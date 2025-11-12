import { Component, ElementRef, OnInit, ViewChild, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from '../../components/card/card'; // NOUVEAU: Import du composant d'analyse
import { TensorflowService, DetectionResult } from '../../services/tensorFlow.service';

// Noms des classes pour le modèle de SCÈNE
const SCENE_CLASS_NAMES = [
  'card',
  'temple'
];

// Interface pour les cartes découpées avec l'URL
interface CroppedCard {
    id: number; // Pour le suivi (optionnel)
    url: string; // La Data URL de l'image découpée
}

@Component({
  selector: 'app-image-detector',
  standalone: true,
  imports: [CommonModule, Card], // NOUVEAU: Ajout du module
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 bg-gray-100 min-h-screen">
      <h1 class="text-3xl font-bold text-center text-indigo-800 mb-6">Détecteur de Scène & Analyse de Cartes</h1>

      <div class="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow-2xl">

        <div class="flex flex-col sm:flex-row gap-4 mb-6 items-center">
          <input
            type="file"
            (change)="onFileSelected($event)"
            accept="image/*"
            class="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            [disabled]="isLoading()"
          >

          <button
            (click)="detectImage()"
            [disabled]="!imageSelected() || isLoading()"
            class="w-full sm:w-auto px-6 py-2 rounded-lg text-white font-semibold transition duration-150"
            [ngClass]="{'bg-indigo-600 hover:bg-indigo-700': imageSelected(), 'bg-gray-400 cursor-not-allowed': !imageSelected()}"
          >
            Détecter Objets
          </button>
        </div>

        <div *ngIf="isLoading()"
             class="loading-overlay absolute inset-0 z-20 flex flex-col items-center justify-center bg-white bg-opacity-90 rounded-xl">
          <div class="loader text-indigo-700 text-2xl mb-4"></div>
          <p class="text-indigo-700 text-xl font-medium">{{ loadingMessage() }}</p>
        </div>

        <div class="relative w-full overflow-hidden border-4 border-dashed border-gray-300 rounded-lg bg-gray-50 mb-8">
          <img #imageElement
               [src]="imageUrl()"
               alt="Image chargée pour détection"
               (load)="onImageLoaded()"
               class="w-full h-auto object-contain"
               [ngClass]="{'hidden': !imageUrl()}"
          >
          <canvas #canvas
                  class="absolute top-0 left-0 w-full h-full pointer-events-none"></canvas>
          <div *ngIf="!imageUrl()" class="flex items-center justify-center h-64 text-gray-500">
            Veuillez sélectionner une image (JPG ou PNG).
          </div>
        </div>

        <div *ngIf="croppedCards().length > 0" class="mt-8">
          <h2 class="text-xl font-semibold text-indigo-800 mb-4">🃏 Cartes (Gauche à Droite) & Analyse des Éléments</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <app-card
              *ngFor="let card of croppedCards()"
              [cardUrl]="card.url"
              class="w-full"
            ></app-card>
          </div>
        </div>

        <div *ngIf="croppedTemples().length > 0" class="mt-8">
          <h2 class="text-xl font-semibold text-indigo-800 mb-4">🏛️ Temples</h2>
          <div class="flex flex-wrap gap-4 justify-center">
            <img
              *ngFor="let templeUrl of croppedTemples()"
              [src]="templeUrl"
              class="max-h-32 shadow-lg border border-gray-200 rounded-lg object-contain"
              alt="Temple découpé">
          </div>
        </div>

      </div>
    </div>
  `,
  styles: `/* Styles inchangés... */`
})
export class ImageDetectorComponent implements OnInit {
  // Références aux éléments du DOM
  @ViewChild('imageElement') imageRef!: ElementRef<HTMLImageElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  // Injection du service
  private tfService = inject(TensorflowService);

  // Signals pour l'état de l'UI
  isLoading = signal(true);
  loadingMessage = signal("Chargement des modèles de détection...");
  imageUrl = signal<string | undefined>(undefined);
  imageSelected = signal(false);

  // Signals pour stocker les images découpées
  croppedCards = signal<CroppedCard[]>([]);
  croppedTemples = signal<string[]>([]);

  // --- Configuration des modèles et classes ---
  private readonly SCENE_MODEL_NAME = 'SCENE_MODEL';
  private readonly SCENE_MODEL_PATH = '/model/set/model.json'; // Mise à jour du chemin pour la clarté

  private readonly ELEMENT_MODEL_NAME = 'CARD_MODEL';
  private readonly ELEMENT_MODEL_PATH = '/model/card/model.json'; // Nouveau chemin pour le second modèle

  private readonly CLASS_CARD_ID = 0;
  private readonly CLASS_TEMPLE_ID = 1;
  private readonly SCORE_THRESHOLD = 0.2; // Seuil de confiance (20%)

  ngOnInit() {
    this.initializeModels();
  }

  /**
   * Charge les deux modèles TensorFlow.js au démarrage.
   */
  initializeModels() {
    // Les deux modèles sont chargés en parallèle
    const loadScene = this.tfService.loadModel(this.SCENE_MODEL_PATH, this.SCENE_MODEL_NAME);
    const loadElement = this.tfService.loadModel(this.ELEMENT_MODEL_PATH, this.ELEMENT_MODEL_NAME);

    Promise.all([loadScene, loadElement])
      .then(() => {
        this.loadingMessage.set("Les deux modèles sont chargés. Prêt à détecter.");
        this.isLoading.set(false);
      })
      .catch(err => {
        console.error("Échec d'un ou plusieurs chargements de modèles:", err);
        this.loadingMessage.set("Erreur de chargement d'un modèle. Vérifiez la console.");
        this.isLoading.set(false);
      });
  }

  // ... (onFileSelected, onImageLoaded, clearCanvas, clearCroppedDetections sont mis à jour)

  /**
   * Gère la sélection d'un fichier par l'utilisateur.
   */
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.isLoading.set(true);
      this.loadingMessage.set("Image sélectionnée. Nettoyage...");

      // this.clearCanvas();
      this.clearCroppedDetections();

      const reader = new FileReader();
      reader.onload = (e) => {
        this.imageUrl.set(e.target?.result as string);
        this.imageSelected.set(true);
      };
      reader.readAsDataURL(file);
    } else {
      this.imageSelected.set(false);
      this.imageUrl.set(undefined);
      // this.clearCanvas();
      this.clearCroppedDetections();
    }
  }

  /**
   * Appelé lorsque l'élément <img> a fini de charger l'image.
   */
  onImageLoaded() {
    const img = this.imageRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    this.loadingMessage.set("Image chargée. Cliquez sur 'Détecter Objets'.");
    this.isLoading.set(false);
  }

  /**
   * Efface les images découpées (cartes et temples).
   */
  clearCroppedDetections() {
    this.croppedCards.set([]);
    this.croppedTemples.set([]);
  }


  /**
   * Lance le processus de détection en utilisant le service.
   */
  async detectImage() {
    if (!this.imageUrl() || this.isLoading()) return;

    this.isLoading.set(true);
    this.loadingMessage.set("Détection de scène en cours...");
    this.clearCroppedDetections();

    try {
      // 1. Lancer la détection de scène (SCENE_MODEL)
      const results = await this.tfService.detect(this.imageRef.nativeElement, this.SCORE_THRESHOLD, this.SCENE_MODEL_NAME);

      if (results) {
        this.drawBoxes(results);

        // 2. Découper et stocker les cartes (format CroppedCard[])
        const croppedCards = this.cropDetections(results, this.CLASS_CARD_ID, true);
        this.croppedCards.set(croppedCards);

        // 3. Découper et stocker les temples (format string[])
        const croppedTemples = this.cropDetections(results, this.CLASS_TEMPLE_ID, false).map(c => c.url); // On prend juste l'URL pour les temples
        this.croppedTemples.set(croppedTemples);
      }
      // La détection des éléments est maintenant gérée par CardAnalyzerComponent

      this.loadingMessage.set("Détection et découpage terminés ! L'analyse des éléments est en cours...");

    } catch (error) {
      console.error("Erreur critique lors de la détection:", error);
      this.loadingMessage.set("Une erreur est survenue lors de la détection.");
    } finally {
      this.isLoading.set(false);
    }
  }


  /**
   * Dessine les boîtes de détection sur le canvas. (Utilise les classes de SCÈNE)
   */
  drawBoxes(results: DetectionResult) {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // this.clearCanvas();

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    ctx.font = '16px Arial';
    ctx.lineWidth = 3;

    for (let i = 0; i < results.boxes.length; i++) {
      const score = results.scores[i];
      if (score < this.SCORE_THRESHOLD) continue;

      const classId = results.classes[i];
      const className = SCENE_CLASS_NAMES[classId] || `Classe ${classId}`;

      // [xmin, ymin, xmax, ymax] normalisées
      const [xmin, ymin, xmax, ymax] = results.boxes[i];

      // Convertir en pixels
      const left = xmin * imgWidth;
      const top = ymin * imgHeight;
      const width = (xmax - xmin) * imgWidth;
      const height = (ymax - ymin) * imgHeight;

      // Couleur basée sur la classe
      const color = classId === this.CLASS_CARD_ID ? '#306EFF' : '#FF701F';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;

      ctx.lineWidth = 4;
      ctx.strokeRect(left, top, width, height);

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
   * Découpe les détections d'une classe spécifique et les retourne sous forme d'objets CroppedCard.
   * La fonction précédente a été renommée et modifiée pour retourner un objet structurel.
   */
  cropDetections(results: DetectionResult, targetClassId: number, sortLeftToRight: boolean): CroppedCard[] {
    const img = this.imageRef.nativeElement;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    const detections = results.boxes
      .map((box, index) => {
        const classId = results.classes[index];
        const score = results.scores[index];

        if (classId !== targetClassId || score < this.SCORE_THRESHOLD) {
            return null;
        }

        const [xmin, ymin, xmax, ymax] = box;

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


    if (sortLeftToRight) {
        detections.sort((a, b) => a.left - b.left);
    }

    const croppedCards: CroppedCard[] = [];

    for (let i = 0; i < detections.length; i++) {
      const detection = detections[i];
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = detection.width;
      tempCanvas.height = detection.height;
      const tempCtx = tempCanvas.getContext('2d');

      if (tempCtx) {
        tempCtx.drawImage(
          img,
          detection.left,
          detection.top,
          detection.width,
          detection.height,
          0,
          0,
          detection.width,
          detection.height
        );

        croppedCards.push({
            id: i,
            url: tempCanvas.toDataURL('image/jpeg', 0.9)
        });
      }
    }

    return croppedCards;
  }
}