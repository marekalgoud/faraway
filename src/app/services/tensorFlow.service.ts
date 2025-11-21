import { Injectable } from '@angular/core';
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
  // private readonly MODEL_INPUT_SIZE: number = 640;
  private readonly IOU_THRESHOLD: number = 0.45; // Seuil IOU pour NMS
  private readonly MAX_DETECTIONS: number = 50; // Nombre maximum de détections à conserver
  // ---------------------

  // Utilisation d'une Map pour stocker plusieurs modèles chargés
  private models: Map<string, GraphModel> = new Map();
  // Utilisation d'une Map pour gérer les promesses de chargement
  private loadingPromises: Map<string, Promise<void>> = new Map();

  constructor() {
    tf.setBackend('webgl').catch(() => tf.setBackend('cpu'));
  }

  /**
   * Charge un modèle GraphModel et l'enregistre avec un nom unique.
   */
  public loadModel(modelUrl: string, modelName: string, inputSize: number): Promise<void> {
    if (this.loadingPromises.has(modelName)) {
      return this.loadingPromises.get(modelName)!;
    }

    const promise = new Promise<void>(async (resolve, reject) => {
      try {
        console.log(`Chargement du modèle '${modelName}' depuis:`, modelUrl);
        const model = await tf.loadGraphModel(modelUrl);
        this.models.set(modelName, model);
        console.log(`Modèle '${modelName}' chargé.`);

        // Échauffement (Warmup)
        tf.tidy(() => {
          const dummyInput = tf.zeros([1, inputSize, inputSize, 3], 'float32');
          model.execute(dummyInput);
        });

        console.log(`Modèle '${modelName}' prêt.`);
        resolve();
      } catch (error) {
        console.error(`Erreur lors du chargement du modèle '${modelName}':`, error);
        reject(error);
      } finally {
        this.loadingPromises.delete(modelName);
      }
    });

    this.loadingPromises.set(modelName, promise);
    return promise;
  }

  /**
   * Traite la sortie d'un modèle YOLOv8/v11 (générique pour N classes).
   */
  private async processYoloOutput(outputTensor: tf.Tensor, scoreThreshold: number,  inputSize: number): Promise<DetectionResult> {

    const intermediates: tf.Tensor[] = [];

    try {
      // 1. Transposer et Squeezie: [1, 4+N, 8400] -> [8400, 4+N]
      const transposed = outputTensor.squeeze().transpose();
      intermediates.push(transposed);

      // --- CORRECTION GÉNÉRIQUE POUR N CLASSES ---
      const totalColumns = transposed.shape[1] || 4;
      const numClasses = totalColumns - 4; // Nombre de classes = Total - 4 Coordonnées (x,y,w,h)

      if (numClasses <= 0) {
        throw new Error("Le tenseur de sortie du modèle n'a pas la forme attendue (nombre de classes invalide).");
      }

      // 2. Extraire les coordonnées et les scores
      const rawBoxes = transposed.slice([0, 0], [-1, 4]); // Coordonnées brutes (x_center, y_center, w, h)
      intermediates.push(rawBoxes);

      const classScores = transposed.slice([0, 4], [-1, numClasses]); // Scores de classe (colonnes 4 à 4+N)
      intermediates.push(classScores);

      // Score maximal de la boîte (utilisé pour NMS)
      const maxScores = classScores.max(1).squeeze();
      intermediates.push(maxScores);

      // Indice de la classe avec le score maximal (l'ID de classe)
      const maxIndices = classScores.argMax(1).squeeze();
      intermediates.push(maxIndices);
      // ------------------------------------------

      // 3. Convertir (x_c, y_c, w, h) en [y1, x1, y2, x2] pour NMS
      const [x_center, y_center, width, height] = tf.split(rawBoxes, 4, 1);
      intermediates.push(x_center, y_center, width, height);

      const x1 = tf.sub(x_center, tf.div(width, 2));
      const y1 = tf.sub(y_center, tf.div(height, 2));
      const x2 = tf.add(x_center, tf.div(width, 2));
      const y2 = tf.add(y_center, tf.div(height, 2));
      intermediates.push(x1, y1, x2, y2);

      const boxesNMS = tf.concat([y1, x1, y2, x2], 1);
      intermediates.push(boxesNMS);

      // 4. Appliquer NMS
      const nmsResult = await tf.image.nonMaxSuppressionWithScoreAsync(
          boxesNMS as tf.Tensor2D,
          maxScores as tf.Tensor1D, // Utilisation du score max pour le NMS
          this.MAX_DETECTIONS,
          this.IOU_THRESHOLD,
          scoreThreshold
      ) as any;

      // 5. Rassembler les résultats finaux
      const finalIndices = nmsResult.selectedIndices;
      const finalScores = nmsResult.selectedScores;
      intermediates.push(finalIndices, finalScores);

      const finalBoxesNMS = tf.gather(boxesNMS, finalIndices);
      intermediates.push(finalBoxesNMS);

      const finalClasses = tf.gather(maxIndices, finalIndices); // Classes ID basées sur le score max
      intermediates.push(finalClasses);

      // 6. Conversion finale : [y1, x1, y2, x2] -> [xmin, ymin, xmax, ymax]
      const yminGather = finalBoxesNMS.slice([0, 0], [-1, 1]);
      const xminGather = finalBoxesNMS.slice([0, 1], [-1, 1]);
      const ymaxGather = finalBoxesNMS.slice([0, 2], [-1, 1]);
      const xmaxGather = finalBoxesNMS.slice([0, 3], [-1, 1]);
      intermediates.push(yminGather, xminGather, ymaxGather, xmaxGather);

      // Le format de sortie pour le composant est [xmin, ymin, xmax, ymax]
      const finalBoxesPixelCoords = tf.concat([xminGather, yminGather, xmaxGather, ymaxGather], 1);
      intermediates.push(finalBoxesPixelCoords);

      // Normaliser les coordonnées (0-640) en (0-1)
      const finalBoxesNormalized = finalBoxesPixelCoords.div(inputSize);

      // 7. Convertir les tenseurs finaux en tableaux JavaScript
      const result: DetectionResult = {
          boxes: finalBoxesNormalized.arraySync() as number[][],
          scores: finalScores.arraySync() as number[],
          classes: finalClasses.arraySync() as number[],
      };

      // 8. Nettoyer les tenseurs
      tf.dispose(intermediates);
      tf.dispose(finalBoxesNormalized);

      return result;

    } catch (e) {
      console.error("Erreur dans processYoloOutput", e);
      tf.dispose(intermediates);
      throw e;
    }
  }

  /**
   * Exécute la détection d'objets sur un élément Image ou Vidéo avec le modèle spécifié.
   */
  public async detect(sourceElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, scoreThreshold: number, modelName: string, inputSize: number = 640): Promise<DetectionResult | null> {
    const model = this.models.get(modelName);
    if (!model) {
      console.error(`Erreur: Le modèle '${modelName}' n'est pas chargé.`);
      return null;
    }

    // Le prétraitement et l'inférence
    const outputTensor = tf.tidy(() => {
      // 1. Convertir les pixels en tenseur
      const inputTensor = tf.browser.fromPixels(sourceElement);

      // 2. Redimensionner et prétraiter
      const resizedTensor = tf.image.resizeBilinear(
        inputTensor,
        [inputSize, inputSize],
        true
      );

      // Normaliser à [0, 1] et ajouter la dimension du lot
      const processedTensor = resizedTensor.div(255.0).expandDims(0);

      // 3. Exécuter l'inférence
      const results = model.execute(processedTensor) as tf.Tensor | tf.Tensor[];

      return Array.isArray(results) ? results[0] : results;
    });

    // 4. Traiter la sortie YOLO (asynchrone à cause du NMS)
    try {
      const processedResults = await this.processYoloOutput(outputTensor, scoreThreshold, inputSize);
      return processedResults;
    } catch (e) {
      console.error("Échec du traitement des résultats YOLO.", e);
      return null;
    } finally {
      tf.dispose(outputTensor);
    }
  }
}
