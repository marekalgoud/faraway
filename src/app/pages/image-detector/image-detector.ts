import { Component, ElementRef, OnInit, ViewChild, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
// Import des deux composants "formulaires"
import { Card } from '../../components/card/card';
import { Temple } from '../../components/temple/temple';
import { TensorflowService, DetectionResult } from '../../services/tensorFlow.service';

// --- Définitions des classes pour l'analyse ---

// Classes du modèle de SCÈNE
const SCENE_CLASS_NAMES = [ 'card', 'temple' ];

// Classes du modèle d'ANALYSE DE CARTE (43 classes)
const CARD_ELEMENT_CLASSES = [
  'card_blue', 'card_green', 'card_red', 'card_yellow', // 0-3 (Colors)
  'chimera', // 4 (Option)
  'condition_chimera', 'condition_gem', 'condition_thistle', // 5-7 (Conditions)
  'each_all_colors', 'each_blue', 'each_chimera', 'each_gem', 'each_green', 'each_hint', 'each_night', 'each_red', 'each_thistle', 'each_yellow_or_blue', 'each_yellow_or_green', 'each_yellow_or_red', // 8-19 (Multipliers)
  'gem', // 20 (Option)
  'hint', // 21 (Option)
  'night', // 22 (Option)
  'thistle', // 23 (Option)
  'value_1', 'value_10', 'value_12', 'value_13', 'value_14', 'value_15', 'value_16', 'value_17', 'value_18', 'value_19', 'value_2', 'value_20', 'value_24', 'value_3', 'value_4', 'value_5', 'value_7', 'value_8', 'value_9' // 24-42 (Values)
];

// Helpers pour le mapping des CARTES
const CARD_COLOR_CLASSES = CARD_ELEMENT_CLASSES.filter(name => name.startsWith('card_'));
const CARD_VALUE_CLASSES = CARD_ELEMENT_CLASSES.filter(name => name.startsWith('value_'));
const CARD_CONDITION_CLASSES = CARD_ELEMENT_CLASSES.filter(name => name.startsWith('condition_'));
const CARD_OPTION_CLASSES = ['chimera', 'gem', 'hint', 'night', 'thistle'];
const CARD_MULTIPLIER_CLASSES = CARD_ELEMENT_CLASSES.filter(name => name.startsWith('each_'));

// Helpers pour le mapping des TEMPLES (basé sur votre nouvelle liste)
const TEMPLE_COLOR_CLASSES = ['card_blue', 'card_green', 'card_red', 'card_yellow'];
const TEMPLE_VALUE_CLASSES = ['value_1', 'value_2', 'value_5'];
const TEMPLE_MULTIPLIER_CLASSES = [
  'each_all_colors', 'each_blue', 'each_chimera', 'each_gem', 'each_green',
  'each_hint', 'each_night', 'each_red', 'each_thistle', 'each_yellow_or_blue',
  'each_yellow_or_green', 'each_yellow_or_red', 'each_blue_or_yellow'
];
// (Les classes d'analyse du temple doivent être mappées à leurs propres IDs de classe du 3ème modèle)
// NOTE : Cet exemple suppose que le 3ème modèle a aussi des noms de classe commençant par 'card_', 'value_', etc.
// Si ce n'est pas le cas, la fonction buildTempleFormGroup devra mapper les IDs du 3ème modèle.

// Interfaces pour les signaux
interface CroppedFormItem {
    url: string; // La Data URL de l'image découpée
    formGroup: FormGroup; // Le FormGroup associé
}

@Component({
  selector: 'app-image-detector',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Card, Temple], // Ajout de Temple
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './image-detector.html', // Utilisation du template externe
  styles: `/* ... (styles inchangés) ... */`
})
export class ImageDetectorComponent implements OnInit {
  @ViewChild('imageElement') imageRef!: ElementRef<HTMLImageElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private tfService = inject(TensorflowService);
  private fb = inject(FormBuilder);

  // --- Signals ---
  isLoading = signal(true);
  loadingMessage = signal("Chargement des modèles de détection...");
  imageUrl = signal<string | undefined>(undefined);
  imageSelected = signal(false);

  // Signaux pour les formulaires (cartes et temples)
  croppedCards = signal<CroppedFormItem[]>([]);
  croppedTemples = signal<CroppedFormItem[]>([]); // NOUVEAU

  // --- Formulaire Principal ---
  detectorForm: FormGroup = this.fb.group({
    cards: this.fb.array([]),
    temples: this.fb.array([])
  });

  // --- Configuration ---
  private readonly SCENE_MODEL_NAME = 'SCENE_MODEL';
  private readonly SCENE_MODEL_PATH = '/model/set/model.json';

  private readonly CARD_MODEL_NAME = 'CARD_MODEL';
  private readonly CARD_MODEL_PATH = '/model/card/model.json';

  private readonly TEMPLE_MODEL_NAME = 'TEMPLE_MODEL';
  private readonly TEMPLE_MODEL_PATH = '/model/temple/model.json';

  private readonly ANALYSIS_THRESHOLD = 0.2; // Seuil pour l'analyse
  private readonly SCENE_SCORE_THRESHOLD = 0.2; // Seuil pour la scène

  private readonly CLASS_CARD_ID = 0;
  private readonly CLASS_TEMPLE_ID = 1;


  ngOnInit() {
    this.initializeModels();
  }

  // --- Helpers pour le template ---
  get cardsFormArray() {
    return this.detectorForm.get('cards') as FormArray;
  }
  get templesFormArray() {
    return this.detectorForm.get('temples') as FormArray;
  }

  ctrlAsFormGroup(control: any): FormGroup {
    return control as FormGroup;
  }

  /**
   * Charge les TROIS modèles TensorFlow.js au démarrage.
   */
  initializeModels() {
    this.loadingMessage.set("Chargement des 3 modèles...");
    const loadScene = this.tfService.loadModel(this.SCENE_MODEL_PATH, this.SCENE_MODEL_NAME);
    const loadCard = this.tfService.loadModel(this.CARD_MODEL_PATH, this.CARD_MODEL_NAME);
    const loadTemple = this.tfService.loadModel(this.TEMPLE_MODEL_PATH, this.TEMPLE_MODEL_NAME); // NOUVEAU

    Promise.all([loadScene, loadCard, loadTemple]) // Attend les 3
      .then(() => {
        this.loadingMessage.set("Prêt à détecter.");
        this.isLoading.set(false);
      })
      .catch(err => {
        console.error("Échec du chargement des modèles:", err);
        this.loadingMessage.set("Erreur de chargement d'un modèle.");
      });
  }

  /**
   * Gère la sélection d'un fichier.
   */
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.isLoading.set(true);
      this.loadingMessage.set("Image sélectionnée...");
      this.clearCanvas();
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
      this.clearCanvas();
      this.clearCroppedDetections();
    }
  }

  /**
   * Ajuste le canvas lorsque l'image est chargée.
   */
  onImageLoaded() {
    const img = this.imageRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    this.loadingMessage.set("Image chargée. Prêt à détecter.");
    this.isLoading.set(false);
  }

  /**
   * Efface le canvas et les formulaires.
   */
  clearCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  clearCroppedDetections() {
    this.croppedCards.set([]);
    this.croppedTemples.set([]);
    this.cardsFormArray.clear();
    this.templesFormArray.clear(); // NOUVEAU
  }

  /**
   * Orchestre la détection de scène ET l'analyse des cartes/temples.
   */
  async detectImage() {
    if (!this.imageUrl() || this.isLoading()) return;

    this.isLoading.set(true);
    this.loadingMessage.set("1/4 Détection de la scène...");
    this.clearCanvas();
    this.clearCroppedDetections();

    try {
      // 1. Détection de scène (card, temple)
      const sceneResults = await this.tfService.detect(this.imageRef.nativeElement, this.SCENE_SCORE_THRESHOLD, this.SCENE_MODEL_NAME);
      if (!sceneResults) throw new Error("Échec de la détection de scène.");

      this.drawBoxes(sceneResults);

      // 2. Découper les deux types d'objets
      this.loadingMessage.set("2/4 Découpage des objets...");
      const cardCrops = this.cropDetections(sceneResults, this.CLASS_CARD_ID, true);
      const templeCrops = this.cropDetections(sceneResults, this.CLASS_TEMPLE_ID, false);

      // 3. Analyser les cartes
      if (cardCrops.length > 0) {
        this.loadingMessage.set(`3/4 Analyse de ${cardCrops.length} carte(s)...`);
        await this.analyzeAndBuildForms(cardCrops, 'card');
      }

      // 4. Analyser les temples
      if (templeCrops.length > 0) {
        this.loadingMessage.set(`4/4 Analyse de ${templeCrops.length} temple(s)...`);
        await this.analyzeAndBuildForms(templeCrops, 'temple');
      }

      this.loadingMessage.set("Analyse terminée !");

    } catch (error) {
      console.error("Erreur critique lors de la détection:", error);
      this.loadingMessage.set("Erreur de détection.");
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Analyse un ensemble d'images découpées et construit le FormArray approprié.
   */
  async analyzeAndBuildForms(crops: { url: string, canvas: HTMLCanvasElement }[], type: 'card' | 'temple') {

    const analysisResults: CroppedFormItem[] = [];
    const modelName = type === 'card' ? this.CARD_MODEL_NAME : this.TEMPLE_MODEL_NAME;
    const formArray = type === 'card' ? this.cardsFormArray : this.templesFormArray;

    for (const crop of crops) {
      // Analyser le canvas découpé
      const analysisData = await this.tfService.detect(
        crop.canvas,
        this.ANALYSIS_THRESHOLD,
        modelName
      );

      // Construire le FormGroup basé sur les résultats
      const formGroup = type === 'card'
        ? this.buildCardFormGroup(analysisData)
        : this.buildTempleFormGroup(analysisData);

      formArray.push(formGroup);
      analysisResults.push({ url: crop.url, formGroup: formGroup });
    }

    // Mettre à jour le signal approprié
    if (type === 'card') {
      this.croppedCards.set(analysisResults);
    } else {
      this.croppedTemples.set(analysisResults);
    }
  }

  /**
   * Traduit les résultats de détection de CARTE en un FormGroup structuré.
   */
  private buildCardFormGroup(detections: DetectionResult | null): FormGroup {
    let bestColor = '', bestValue = '', bestMultiplier = '';
    let bestColorScore = 0, bestValueScore = 0, bestMultiplierScore = 0;
    const foundConditions: string[] = [];
    const foundOptions: { [key: string]: boolean } = {
      chimera: false, gem: false, hint: false, night: false, thistle: false
    };

    if (detections) {
      for (let i = 0; i < detections.classes.length; i++) {
        const classId = detections.classes[i];
        const score = detections.scores[i];
        // NOTE: Utilise CARD_ELEMENT_CLASSES pour le mapping ID -> Nom
        const className = CARD_ELEMENT_CLASSES[classId];

        if (!className) continue;

        if (CARD_COLOR_CLASSES.includes(className) && score > bestColorScore) {
          bestColor = className; bestColorScore = score;
        } else if (CARD_VALUE_CLASSES.includes(className) && score > bestValueScore) {
          bestValue = className; bestValueScore = score;
        } else if (CARD_MULTIPLIER_CLASSES.includes(className) && score > bestMultiplierScore) {
          bestMultiplier = className; bestMultiplierScore = score;
        } else if (CARD_CONDITION_CLASSES.includes(className)) {
          foundConditions.push(className);
        } else if (CARD_OPTION_CLASSES.includes(className)) {
          foundOptions[className] = true;
        }
      }
    }

    return this.fb.group({
      color: [bestColor],
      value: [bestValue],
      multiplier: [bestMultiplier],
      options: this.fb.group(foundOptions),
      conditions: this.fb.array(foundConditions.map(cond => this.fb.control(cond)))
    });
  }

  /**
   * Traduit les résultats de détection de TEMPLE en un FormGroup structuré. (NOUVEAU)
   * NOTE: Cette fonction suppose que les IDs de classe du modèle Temple
   * correspondent aux noms de classe fournis (ex: ID 0 = 'card_blue').
   * Si ce n'est pas le cas, un mapping ID -> Nom spécifique au temple est nécessaire.
   */
  private buildTempleFormGroup(detections: DetectionResult | null): FormGroup {
    let bestColor = '', bestValue = '', bestMultiplier = '';
    let bestColorScore = 0, bestValueScore = 0, bestMultiplierScore = 0;
    const foundOptions: { [key: string]: boolean } = {
      chimera: false, gem: false, hint: false, night: false, thistle: false
    };
    // IDs de classe du modèle TEMPLE (à adapter si nécessaire)
    // Pour cet exemple, je suppose que le modèle Temple a été entraîné avec les mêmes noms de classe
    // que ceux que vous avez listés (ex: 'card_blue', 'value_1', 'each_gem', etc.)
    // Si votre modèle a 20 classes (IDs 0-19), vous devez fournir ce tableau de mapping.
    // Supposons un mapping hypothétique pour cet exemple :
    const TEMPLE_ELEMENT_CLASSES = [
      ...TEMPLE_COLOR_CLASSES,
      ...TEMPLE_VALUE_CLASSES,
      ...TEMPLE_MULTIPLIER_CLASSES
      // ... (Assurez-vous que l'ordre correspond aux IDs 0, 1, 2... de votre modèle)
    ];


    if (detections) {
      for (let i = 0; i < detections.classes.length; i++) {
        const classId = detections.classes[i];
        const score = detections.scores[i];
        const className = TEMPLE_ELEMENT_CLASSES[classId]; // Utilise le mapping du temple

        if (!className) continue;

        if (TEMPLE_COLOR_CLASSES.includes(className) && score > bestColorScore) {
          bestColor = className; bestColorScore = score;
        } else if (TEMPLE_VALUE_CLASSES.includes(className) && score > bestValueScore) {
          bestValue = className; bestValueScore = score;
        } else if (TEMPLE_MULTIPLIER_CLASSES.includes(className) && score > bestMultiplierScore) {
          bestMultiplier = className; bestMultiplierScore = score;
        } else if (CARD_OPTION_CLASSES.includes(className)) {
          foundOptions[className] = true;
        }
      }
    }

    // Formulaire simplifié pour les temples
    return this.fb.group({
      color: [bestColor],
      value: [bestValue],
      options: this.fb.group(foundOptions),
      multiplier: [bestMultiplier]
    });
  }


  /**
   * Dessine les boîtes de détection sur le canvas. (Inchangé)
   */
  drawBoxes(results: DetectionResult) {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.clearCanvas(); // Nettoyer avant de dessiner

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    ctx.font = '16px Arial';
    ctx.lineWidth = 3;

    for (let i = 0; i < results.boxes.length; i++) {
      const score = results.scores[i];
      if (score < this.SCENE_SCORE_THRESHOLD) continue;

      const classId = results.classes[i];
      const className = SCENE_CLASS_NAMES[classId] || `Classe ${classId}`;
      const [xmin, ymin, xmax, ymax] = results.boxes[i];

      const left = xmin * imgWidth;
      const top = ymin * imgHeight;
      const width = (xmax - xmin) * imgWidth;
      const height = (ymax - ymin) * imgHeight;

      const color = classId === this.CLASS_CARD_ID ? '#306EFF' : '#FF701F';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 4;
      ctx.strokeRect(left, top, width, height);

      const label = `${className}: ${Math.round(score * 100)}%`;
      const textWidth = ctx.measureText(label).width;
      const textHeight = 16;
      const padding = 4;
      ctx.fillRect(left - 1, top - (textHeight + padding * 2), textWidth + padding * 2, textHeight + padding * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(label, left + padding, top - padding);
    }
  }

  /**
   * Découpe les détections d'une classe spécifique et les retourne sous forme d'URL et de Canvas. (Inchangé)
   */
  cropDetections(results: DetectionResult, targetClassId: number, sortLeftToRight: boolean): { url: string, canvas: HTMLCanvasElement }[] {
    const img = this.imageRef.nativeElement;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    const detections = results.boxes
      .map((box, index) => {
        const classId = results.classes[index];
        const score = results.scores[index];

        if (classId !== targetClassId || score < this.SCENE_SCORE_THRESHOLD) {
            return null;
        }

        const [xmin, ymin, xmax, ymax] = box;
        const left = Math.floor(xmin * imgWidth);
        const top = Math.floor(ymin * imgHeight);
        const width = Math.floor((xmax - xmin) * imgWidth);
        const height = Math.floor((ymax - ymin) * imgHeight);

        return { left, top, width, height };
      })
      .filter(d => d !== null) as {left: number, top: number, width: number, height: number}[];


    if (sortLeftToRight) {
        detections.sort((a, b) => a.left - b.left);
    }

    const croppedDetections: { url: string, canvas: HTMLCanvasElement }[] = [];

    for (const detection of detections) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = detection.width;
      tempCanvas.height = detection.height;
      const tempCtx = tempCanvas.getContext('2d');

      if (tempCtx) {
        tempCtx.drawImage(
          img,
          detection.left, detection.top, detection.width, detection.height,
          0, 0, detection.width, detection.height
        );

        croppedDetections.push({
            url: tempCanvas.toDataURL('image/jpeg', 0.9),
            canvas: tempCanvas // Nous retournons le canvas pour l'analyse
        });
      }
    }
    return croppedDetections;
  }
}