import { Injectable } from '@angular/core';
// Utilisation d'un import CDN pour résoudre le problème de dépendance dans cet environnement
import * as tf from '@tensorflow/tfjs';
import { GraphModel } from '@tensorflow/tfjs';

// Interface pour structurer les résultats de la détection simplifiée après traitement (NMS)
export interface DetectionResult {
  boxes: number[][]; // [xmin, ymin, xmax, ymax] normalisées (0 à 1)
  scores: number[];
  classes: number[];
}


@Injectable({
  providedIn: 'root'
})
export class TensorflowService {

  // --- Configuration ---
  private readonly MODEL_INPUT_SIZE: number = 640;
  private readonly IOU_THRESHOLD: number = 0.45; // Seuil IOU pour NMS
  private readonly MAX_DETECTIONS: number = 50; // Nombre maximum de détections à conserver
  // ---------------------

  private model: GraphModel | null = null;
  private modelLoadingPromise: Promise<void> | null = null;

  constructor() {
    tf.setBackend('webgl').catch(() => tf.setBackend('cpu'));
  }

  /**
   * Charge le modèle GraphModel et exécute l'échauffement.
   */
  public loadModel(modelUrl: string): Promise<void> {
    if (this.modelLoadingPromise) {
      return this.modelLoadingPromise;
    }

    this.modelLoadingPromise = new Promise(async (resolve, reject) => {
      try {
        console.log("Chargement du modèle depuis:", modelUrl);
        this.model = await tf.loadGraphModel(modelUrl);
        console.log("Modèle chargé.");

        // Échauffement du modèle (Warmup)
        // Utilisation de tf.tidy ici car c'est synchrone
        tf.tidy(() => {
          const dummyInput = tf.zeros([1, this.MODEL_INPUT_SIZE, this.MODEL_INPUT_SIZE, 3], 'float32');
          // Utilisation de execute() synchrone
          const warmupResults = this.model!.execute(dummyInput) as tf.Tensor;
          // tf.tidy gère l'élimination des tenseurs
        });

        console.log("Modèle prêt.");
        resolve();
      } catch (error) {
        console.error("Erreur lors du chargement ou de l'échauffement du modèle:", error);
        reject(error);
      }
    });
    return this.modelLoadingPromise;
  }

  /**
   * Traite la sortie d'un modèle de type YOLOv8 (tenseur unique [1, X, 8400]).
   * Applique la suppression non maximale (NMS) optimisée par TensorFlow.js.
   * La mémoire des tenseurs est gérée à l'intérieur de cette fonction ou par l'appelant.
   * @param outputTensor Le tenseur de sortie unique du modèle (sera disposé par l'appelant).
   * @param scoreThreshold Le seuil de confiance minimum à considérer.
   * @returns Un objet DetectionResult nettoyé.
   */
  private async processYoloOutput(outputTensor: tf.Tensor, scoreThreshold: number): Promise<DetectionResult> {

    // Déclaration d'un tableau pour suivre les tenseurs intermédiaires à disposer
    const intermediates: tf.Tensor[] = [];

    try {
      // 1. Transposer et Squeezie: [1, 4+N, 8400] -> [8400, 4+N]
      // La forme finale du tenseur est [nombre_boites_candidates, 4_boites + N_classes]
      const transposed = outputTensor.squeeze().transpose(); // Shape: [8400, 4 + N]
      intermediates.push(transposed);

      // 2. Extraire les données de boîtes et de scores
      // Coordonnées brutes (x_center, y_center, w, h)
      const rawBoxes = transposed.slice([0, 0], [-1, 4]); // Shape: [8400, 4]
      intermediates.push(rawBoxes);

      // --- DÉBUT CORRECTION GÉNÉRIQUE POUR N CLASSES ---

      // La forme du tenseur est [Nombre de boîtes, (4 coordonnées + N classes)]
      const totalColumns = transposed.shape[1] || 4;
      const numClasses = totalColumns - 4; // Nombre de classes = Total - Colonnes de boîte

      if (numClasses <= 0) {
        throw new Error("Le tenseur de sortie du modèle n'a pas la forme attendue (nombre de classes invalide).");
      }

      // Extraction générique des scores de classe (colonnes 4 jusqu'à la fin)
      const classScores = transposed.slice([0, 4], [-1, numClasses]); // Shape: [8400, N]
      intermediates.push(classScores);

      // Trouver le score maximum pour chaque boîte (utilisé pour NMS)
      const maxScores = classScores.max(1).squeeze(); // Score maximum [8400]
      intermediates.push(maxScores);

      // Trouver l'indice (ID de classe, de 0 à N-1) du score maximum
      const maxIndices = classScores.argMax(1).squeeze(); // Indice de classe [8400]
      intermediates.push(maxIndices);

      // --- FIN CORRECTION GÉNÉRIQUE ---


      // 3. Convertir (x_c, y_c, w, h) en [y1, x1, y2, x2] pour NMS
      const [x_center, y_center, width, height] = tf.split(rawBoxes, 4, 1);
      intermediates.push(x_center, y_center, width, height);

      const x1 = tf.sub(x_center, tf.div(width, 2));
      const y1 = tf.sub(y_center, tf.div(height, 2));
      const x2 = tf.add(x_center, tf.div(width, 2));
      const y2 = tf.add(y_center, tf.div(height, 2));
      intermediates.push(x1, y1, x2, y2);

      // NMS par TensorFlow.js utilise [y1, x1, y2, x2]
      const boxesNMS = tf.concat([y1, x1, y2, x2], 1); // Shape: [8400, 4]
      intermediates.push(boxesNMS);

      // 4. Appliquer NMS (fonction GPU-accélérée)
      // On utilise maxScores pour le filtrage par NMS
      const nmsResult = await tf.image.nonMaxSuppressionWithScoreAsync(
          boxesNMS as tf.Tensor2D,
          maxScores as tf.Tensor1D, // <--- Utilisation du score max
          this.MAX_DETECTIONS,
          this.IOU_THRESHOLD,
          scoreThreshold
      ) as any;

      // 5. Rassembler les résultats finaux
      const finalIndices = nmsResult.selectedIndices;
      const finalScores = nmsResult.selectedScores; // Les scores finaux sont ceux qui ont passé le filtre
      intermediates.push(finalIndices, finalScores);

      // Récupérer les boîtes NMS sélectionnées ([y1, x1, y2, x2])
      const finalBoxesNMS = tf.gather(boxesNMS, finalIndices);
      intermediates.push(finalBoxesNMS);

      // Récupérer les classes correspondantes (indices 0 à N-1)
      const finalClasses = tf.gather(maxIndices, finalIndices); // <--- Utilisation des indices de classe max
      intermediates.push(finalClasses);

      // 6. Conversion finale : [y1, x1, y2, x2] -> [xmin, ymin, xmax, ymax] pour le dessin
      const yminGather = finalBoxesNMS.slice([0, 0], [-1, 1]);
      const xminGather = finalBoxesNMS.slice([0, 1], [-1, 1]);
      const ymaxGather = finalBoxesNMS.slice([0, 2], [-1, 1]);
      const xmaxGather = finalBoxesNMS.slice([0, 3], [-1, 1]);
      intermediates.push(yminGather, xminGather, ymaxGather, xmaxGather);

      // Le format de sortie pour le composant est [xmin, ymin, xmax, ymax]
      const finalBoxesPixelCoords = tf.concat([xminGather, yminGather, xmaxGather, ymaxGather], 1);
      intermediates.push(finalBoxesPixelCoords);

      // Normaliser les coordonnées (0-640) en (0-1)
      const finalBoxesNormalized = finalBoxesPixelCoords.div(this.MODEL_INPUT_SIZE);

      // 7. Convertir les tenseurs finaux en tableaux JavaScript
      const result: DetectionResult = {
          boxes: finalBoxesNormalized.arraySync() as number[][],
          scores: finalScores.arraySync() as number[],
          classes: finalClasses.arraySync() as number[],
      };

      // 8. Nettoyer les tenseurs intermédiaires AVANT de retourner le résultat
      tf.dispose(intermediates);
      tf.dispose(finalBoxesNormalized);

      return result;

    } catch (e) {
      console.error("Erreur dans processYoloOutput", e);
      // Nettoyer en cas d'erreur
      tf.dispose(intermediates);
      throw e;
    }
  }

  /**
   * Exécute la détection d'objets sur un élément Image ou Vidéo.
   */
  public async detect(sourceElement: HTMLImageElement | HTMLVideoElement, scoreThreshold: number): Promise<DetectionResult | null> {
    if (!this.model) {
      console.error("Erreur: Le modèle n'est pas chargé.");
      return null;
    }

    // Le prétraitement et l'inférence sont exécutés à l'intérieur d'un tf.tidy() synchrone
    // pour garantir la libération de la mémoire des tenseurs d'entrée.
    const outputTensor = tf.tidy(() => {
      // 1. Convertir les pixels en tenseur
      const inputTensor = tf.browser.fromPixels(sourceElement);

      // 2. Redimensionner et prétraiter (float32 et normalisation à [0, 1])
      const resizedTensor = tf.image.resizeBilinear(
        inputTensor,
        [this.MODEL_INPUT_SIZE, this.MODEL_INPUT_SIZE],
        true
      );

      // Normaliser à [0, 1] et ajouter la dimension du lot
      const processedTensor = resizedTensor.div(255.0).expandDims(0);

      // 3. Exécuter l'inférence (execute() synchrone)
      const results = this.model!.execute(processedTensor) as tf.Tensor | tf.Tensor[];

      // S'assurer que le résultat est bien le tenseur unique et le retourner
      return Array.isArray(results) ? results[0] : results;
    });

    // 4. Traiter la sortie YOLO (asynchrone à cause du NMS)
    try {
      const processedResults = await this.processYoloOutput(outputTensor, scoreThreshold);
      return processedResults;
    } catch (e) {
      console.error("Échec du traitement des résultats YOLO.", e);
      return null;
    } finally {
      // Nettoyer le tenseur de sortie après le traitement (ou en cas d'échec)
      tf.dispose(outputTensor);
    }
  }
}