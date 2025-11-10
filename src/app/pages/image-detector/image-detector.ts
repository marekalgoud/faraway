import { Component, ElementRef, OnInit, ViewChild, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
// Importez le service et l'interface depuis le fichier de service
import { TensorflowService, DetectionResult } from '../../services/tensorFlow.service';

// Noms des classes - DOIT correspondre à votre fichier data.yaml (card_detector/data.yaml)
const CLASS_NAMES = [
  'card', // Index 0
  'temple' // Index 1
];

@Component({
  selector: 'app-image-detector',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush, // Optimisation Angular
  templateUrl: './image-detector.html',
  styleUrl: `./image-detector.scss`
})
export class ImageDetectorComponent implements OnInit {
  // Références aux éléments du DOM
  @ViewChild('imageElement') imageRef!: ElementRef<HTMLImageElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  // Injection du service
  private tfService = inject(TensorflowService);

  // Signals pour l'état de l'UI
  isLoading = signal(true);
  loadingMessage = signal("Chargement du modèle de détection...");
  imageUrl = signal<string | undefined>(undefined);
  imageSelected = signal(false);

  // Signals pour stocker les URL des images découpées
  croppedCards = signal<string[]>([]);
  croppedTemples = signal<string[]>([]); // NOUVEAU: pour les temples

  // --- Configuration ---
  private readonly CLASS_CARD_ID = 0;
  private readonly CLASS_TEMPLE_ID = 1;
  private readonly SCORE_THRESHOLD = 0.2; // Seuil de confiance (20%)
  private readonly MODEL_PATH = '/model/set/model.json'; // Chemin vers votre modèle

  ngOnInit() {
    this.initializeModel();
  }

  // ... (initializeModel, onFileSelected, onImageLoaded sont inchangées)

  /**
   * Charge le modèle TensorFlow.js au démarrage.
   */
  initializeModel() {
    this.tfService.loadModel(this.MODEL_PATH)
      .then(() => {
        this.loadingMessage.set("Modèle chargé. Prêt à détecter.");
        this.isLoading.set(false);
      })
      .catch(err => {
        console.error("Échec du chargement du modèle:", err);
        this.loadingMessage.set("Erreur de chargement du modèle.");
        this.isLoading.set(false);
      });
  }

  /**
   * Gère la sélection d'un fichier par l'utilisateur.
   */
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.isLoading.set(true);
      this.loadingMessage.set("Image sélectionnée. Nettoyage...");

      // Réinitialiser le canvas et les cartes découpées
      this.clearCanvas();
      this.clearCroppedDetections(); // UTILISATION DE LA NOUVELLE FONCTION

      // Créer une URL pour afficher l'image
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imageUrl.set(e.target?.result as string);
        this.imageSelected.set(true);
      };
      reader.readAsDataURL(file);
    } else {
      this.imageSelected.set(false);
      this.imageUrl.set(undefined);
      this.clearCanvas();
      this.clearCroppedDetections(); // UTILISATION DE LA NOUVELLE FONCTION
    }
  }

  /**
   * Appelé lorsque l'élément <img> a fini de charger l'image.
   */
  onImageLoaded() {
    const img = this.imageRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;

    // Le canvas doit avoir la même taille en pixels que l'image DOM
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    this.loadingMessage.set("Image chargée. Cliquez sur 'Détecter Objets'.");
    this.isLoading.set(false);
  }

  /**
   * Lance le processus de détection en utilisant le service.
   */
  async detectImage() {
    if (!this.imageUrl() || this.isLoading()) return;

    this.isLoading.set(true);
    this.loadingMessage.set("Détection en cours... Veuillez patienter.");
    this.clearCroppedDetections(); // Nettoyer avant une nouvelle détection

    try {
      // 1. Lancer la détection via le service
      const results = await this.tfService.detect(this.imageRef.nativeElement, this.SCORE_THRESHOLD);

      if (results) {
        this.drawBoxes(results);

        // NOUVEAU: Découper les cartes (triées)
        const croppedCards = this.cropAndDisplayDetections(results, this.CLASS_CARD_ID, true);
        this.croppedCards.set(croppedCards);

        // NOUVEAU: Découper les temples (non triés)
        const croppedTemples = this.cropAndDisplayDetections(results, this.CLASS_TEMPLE_ID, false);
        this.croppedTemples.set(croppedTemples);

      } else {
        console.warn("Aucun résultat de détection retourné.");
      }

      this.loadingMessage.set("Détection terminée !");

    } catch (error) {
      console.error("Erreur critique lors de la détection:", error);
      this.loadingMessage.set("Une erreur est survenue lors de la détection.");
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Efface le canvas des détections.
   */
  clearCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  /**
   * Efface les images découpées (cartes et temples). (NOUVEAU)
   */
  clearCroppedDetections() {
    this.croppedCards.set([]);
    this.croppedTemples.set([]);
  }

  /**
   * Dessine les boîtes de détection sur le canvas. (Inchangé)
   */
  drawBoxes(results: DetectionResult) {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.clearCanvas();

    const imgWidth = this.canvasRef.nativeElement.width;
    const imgHeight = this.canvasRef.nativeElement.height;

    ctx.font = '16px Arial';
    ctx.lineWidth = 3;

    // Itérer sur toutes les détections
    for (let i = 0; i < results.boxes.length; i++) {

      const score = results.scores[i];
      if (score < this.SCORE_THRESHOLD) continue;

      const classId = results.classes[i];
      const className = CLASS_NAMES[classId] || `Classe ${classId}`;

      // [xmin, ymin, xmax, ymax] normalisées
      const [xmin, ymin, xmax, ymax] = results.boxes[i];

      // Convertir en pixels
      const left = xmin * imgWidth;
      const top = ymin * imgHeight;
      const width = (xmax - xmin) * imgWidth;
      const height = (ymax - ymin) * imgHeight;

      // Couleur basée sur la classe (0: 'card', 1: 'temple')
      const color = classId === this.CLASS_CARD_ID ? '#306EFF' : '#FF701F';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;

      // Dessiner la boîte
      ctx.lineWidth = 4;
      ctx.strokeRect(left, top, width, height);

      // Label avec fond
      const label = `${className}: ${Math.round(score * 100)}%`;
      const textWidth = ctx.measureText(label).width;
      const textHeight = 16;
      const padding = 4;

      ctx.fillRect(
        left - 1,
        top - (textHeight + padding * 2),
        textWidth + padding * 2,
        textHeight + padding * 2
      );

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(label, left + padding, top - padding);
    }
  }

  /**
   * Découpe les détections d'une classe spécifique et les retourne sous forme d'URLs. (GÉNÉRALISÉ)
   * @param results Les résultats post-NMS.
   * @param targetClassId L'ID de la classe à découper (ex: 0 pour 'card', 1 pour 'temple').
   * @param sortLeftToRight Si les résultats doivent être triés de gauche à droite (important pour les cartes).
   * @returns Un tableau de Data URLs (chaînes de caractères base64).
   */
  cropAndDisplayDetections(results: DetectionResult, targetClassId: number, sortLeftToRight: boolean): string[] {
    const img = this.imageRef.nativeElement;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    // 1. Filtrer et convertir les boîtes de la classe cible en coordonnées pixels
    const detections = results.boxes
      .map((box, index) => {
        const classId = results.classes[index];
        const score = results.scores[index];

        // Seules les détections de la classe cible avec un score suffisant
        if (classId !== targetClassId || score < this.SCORE_THRESHOLD) {
            return null;
        }

        // [xmin, ymin, xmax, ymax] normalisées
        const [xmin, ymin, xmax, ymax] = box;

        // Conversion en pixels (arrondie pour la précision du découpage)
        const left = Math.floor(xmin * imgWidth);
        const top = Math.floor(ymin * imgHeight);
        const right = Math.ceil(xmax * imgWidth);
        const bottom = Math.ceil(ymax * imgHeight);

        const width = right - left;
        const height = bottom - top;

        return {
          left,
          top,
          width,
          height
        };
      })
      .filter(d => d !== null) as {left: number, top: number, width: number, height: number}[];


    // 2. Trier si nécessaire
    if (sortLeftToRight) {
        detections.sort((a, b) => a.left - b.left);
    }

    const croppedUrls: string[] = [];

    // 3. Découper et convertir en Data URL
    for (const detection of detections) {
      // Créer un canvas temporaire pour le découpage
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = detection.width;
      tempCanvas.height = detection.height;
      const tempCtx = tempCanvas.getContext('2d');

      if (tempCtx) {
        tempCtx.drawImage(
          img,
          // Source (partie de l'image originale à découper)
          detection.left,
          detection.top,
          detection.width,
          detection.height,
          // Destination (partie du canvas temporaire où dessiner)
          0,
          0,
          detection.width,
          detection.height
        );

        // Convertir le canvas découpé en Data URL
        croppedUrls.push(tempCanvas.toDataURL('image/jpeg', 0.9));
      }
    }

    return croppedUrls;
  }
}