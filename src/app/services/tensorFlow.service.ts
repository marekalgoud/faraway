import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { GraphModel } from '@tensorflow/tfjs';

// Interface pour structurer les résultats de la détection simplifiée après traitement (NMS)
export interface DetectionResult {
  boxes: number[][]; // [xmin, ymin, xmax, ymax] NORMALISÉES sur les dimensions ORIGINALES (0 à 1)
  scores: number[];
  classes: number[];
  originalWidth?: number; // Dimensions de l'image originale (avant letterboxing)
  originalHeight?: number;
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
   * Effectue un redimensionnement non-déformant (letterboxing) d'une image.
   * L'image est redimensionnée pour tenir dans les dimensions cibles tout en conservant son ratio d'aspect,
   * puis complétée avec du padding gris (127, 127, 127).
   * Retourne le tenseur prétraité et les offsets de padding pour la conversion des coordonnées.
   */
  private letterbox(
    inputTensor: tf.Tensor,
    targetSize: number
  ): { tensor: tf.Tensor; offsetX: number; offsetY: number; scale: number } {
    const [height, width] = [inputTensor.shape[0] as number, inputTensor.shape[1] as number];

    // Calculer le facteur d'échelle pour maintenir le ratio d'aspect
    const scale = Math.min(targetSize / width, targetSize / height);
    const newWidth = Math.floor(width * scale);
    const newHeight = Math.floor(height * scale);

    // Redimensionner l'image
    const resized = tf.image.resizeBilinear(inputTensor as tf.Tensor3D, [newHeight, newWidth], true);

    // Calculer les offsets de padding (centrer l'image)
    const offsetY = Math.floor((targetSize - newHeight) / 2);
    const offsetX = Math.floor((targetSize - newWidth) / 2);
    const padBottomY = targetSize - newHeight - offsetY;
    const padRightX = targetSize - newWidth - offsetX;

    // Appliquer le padding gris (127 / 255 ≈ 0.498)
    const padded = tf.pad(
      resized,
      [[offsetY, padBottomY], [offsetX, padRightX], [0, 0]],
      127 / 255
    );

    return { tensor: padded, offsetX, offsetY, scale };
  }

  /**
   * Traite la sortie d'un modèle YOLOv8/v11 (générique pour N classes).
   */
  private async processYoloOutput(
    outputTensor: tf.Tensor,
    scoreThreshold: number,
    inputSize: number,
    letterboxOffset: { offsetX: number; offsetY: number; scale: number } | null,
    originalWidth?: number,
    originalHeight?: number
  ): Promise<DetectionResult> {

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

      // Appliquer la transformation inverse du letterboxing AVANT normalisation
      let boxesInOriginalPixels: tf.Tensor;

      if (letterboxOffset && originalWidth && originalHeight) {
        // Les boîtes sont actuellement en pixels du modèle letterboxé (0-640)
        // Formule: coord_original = (coord_letterboxed - offset) / scale
        const { offsetX, offsetY, scale } = letterboxOffset;
        
        // Créer une matrice d'offsets [offsetX, offsetY, offsetX, offsetY] pour [xmin, ymin, xmax, ymax]
        const offsetsMatrix = tf.tensor1d([offsetX, offsetY, offsetX, offsetY], 'float32');
        
        // Soustraire les offsets: (coord - offset)
        const unpadded = tf.sub(finalBoxesPixelCoords, offsetsMatrix);
        intermediates.push(unpadded);
        
        // Diviser par le scale: (coord - offset) / scale
        boxesInOriginalPixels = tf.div(unpadded, tf.scalar(scale, 'float32'));
        intermediates.push(boxesInOriginalPixels);
      } else {
        // Pas de letterboxing: les boîtes sont déjà en pixels du modèle
        boxesInOriginalPixels = finalBoxesPixelCoords;
      }

      // Normaliser basé sur les dimensions ORIGINALES
      const xmin = boxesInOriginalPixels.slice([0, 0], [-1, 1]).div(tf.scalar(originalWidth!, 'float32'));
      const ymin = boxesInOriginalPixels.slice([0, 1], [-1, 1]).div(tf.scalar(originalHeight!, 'float32'));
      const xmax = boxesInOriginalPixels.slice([0, 2], [-1, 1]).div(tf.scalar(originalWidth!, 'float32'));
      const ymax = boxesInOriginalPixels.slice([0, 3], [-1, 1]).div(tf.scalar(originalHeight!, 'float32'));
      
      const boxesNormalized = tf.concat([xmin, ymin, xmax, ymax], 1);
      intermediates.push(xmin, ymin, xmax, ymax);

      // 7. Convertir les tenseurs finaux en tableaux JavaScript
      const result: DetectionResult = {
          boxes: boxesNormalized.arraySync() as number[][],
          scores: finalScores.arraySync() as number[],
          classes: finalClasses.arraySync() as number[],
          originalWidth,
          originalHeight
      };

      // 8. Nettoyer les tenseurs
      tf.dispose(intermediates);
      tf.dispose(boxesNormalized);

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

    // Capture les dimensions originales
    let originalWidth: number;
    let originalHeight: number;

    // Stockage des paramètres de letterboxing pour la conversion des coordonnées
    let letterboxParams: { offsetX: number; offsetY: number; scale: number } | null = null;

    // Le prétraitement et l'inférence
    const outputTensor = tf.tidy(() => {
      // 1. Convertir les pixels en tenseur
      const inputTensor = tf.browser.fromPixels(sourceElement);
      originalWidth = inputTensor.shape[1] as number;
      originalHeight = inputTensor.shape[0] as number;

      // 2. Appliquer le letterboxing (redimensionnement non-déformant)
      const { tensor: letterboxedTensor, offsetX, offsetY, scale } = this.letterbox(inputTensor, inputSize);
      letterboxParams = { offsetX, offsetY, scale };

      // Normaliser à [0, 1] et ajouter la dimension du lot
      const processedTensor = letterboxedTensor.div(255.0).expandDims(0);

      // 3. Exécuter l'inférence
      const results = model.execute(processedTensor) as tf.Tensor | tf.Tensor[];

      return Array.isArray(results) ? results[0] : results;
    });

    // 4. Traiter la sortie YOLO (asynchrone à cause du NMS)
    try {
      const processedResults = await this.processYoloOutput(outputTensor, scoreThreshold, inputSize, letterboxParams, originalWidth!, originalHeight!);
      return processedResults;
    } catch (e) {
      console.error("Échec du traitement des résultats YOLO.", e);
      return null;
    } finally {
      tf.dispose(outputTensor);
    }
  }
}
