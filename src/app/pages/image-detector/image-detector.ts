import { Component, ElementRef, OnInit, ViewChild, inject, ChangeDetectionStrategy, signal } from '@angular/core';
// ... (imports inchangés)
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl } from '@angular/forms';
import { Card } from '../../components/card/card';
import { Temple } from '../../components/temple/temple';
import { TensorflowService, DetectionResult } from '../../services/tensorFlow.service';
import { CommonModule } from '@angular/common';
// NOUVEAU: Import du service de calcul
import { ScoreCalculatorService } from '../../services/scoreCalculator.service';

// NOUVEAU: Import des constantes
import {
  SCENE_CLASS_NAMES,
  CARD_ELEMENT_CLASSES,
  CARD_COLOR_CLASSES,
  CARD_VALUE_CLASSES,
  CARD_CONDITION_CLASSES,
  CARD_OPTION_CLASSES,
  CARD_MULTIPLIER_CLASSES,
  TEMPLE_COLOR_CLASSES,
  TEMPLE_VALUE_CLASSES,
  TEMPLE_MULTIPLIER_CLASSES,
  TEMPLE_ELEMENT_CLASSES_MAPPING,
  CARD_OPTION_CLASSES as TEMPLE_OPTION_CLASSES // Les temples utilisent les mêmes options
} from '../../constants';

// ... (Interface CroppedFormItem inchangée)
interface CroppedFormItem {
    url: string;
    formGroup: FormGroup;
}

@Component({
  selector: 'app-image-detector',
  // ... (imports, changeDetection, templateUrl, styles inchangés)
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Card, Temple],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './image-detector.html',
  styleUrl: './image-detector.scss'
})
export class ImageDetectorComponent implements OnInit {
  // ... (ViewChilds, injections inchangés)
  @ViewChild('imageElement') imageRef!: ElementRef<HTMLImageElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private tfService = inject(TensorflowService);
  private fb = inject(FormBuilder);
  private scoreService = inject(ScoreCalculatorService);


  // --- Signals ---
  isLoading = signal(true);
  loadingMessage = signal("Chargement des modèles de détection...");
  imageUrl = signal<string | undefined>(undefined);
  imageSelected = signal(false);

  croppedCards = signal<CroppedFormItem[]>([]);
  croppedTemples = signal<CroppedFormItem[]>([]);

  // NOUVEAU: Signals pour le résultat du calcul
  totalScore = signal<number>(0);
  calculationDetails = signal<string[]>([]);

  // --- Formulaire Principal ---
  detectorForm: FormGroup = this.fb.group({
    cards: this.fb.array([]),
    temples: this.fb.array([])
  });

  // --- (Configuration des modèles inchangée) ---
  private readonly SCENE_MODEL_NAME = 'SCENE_MODEL';
  private readonly SCENE_MODEL_PATH = '/model/set/model.json';
  private readonly CARD_MODEL_NAME = 'CARD_MODEL';
  private readonly CARD_MODEL_PATH = '/model/card/model.json';
  private readonly TEMPLE_MODEL_NAME = 'TEMPLE_MODEL';
  private readonly TEMPLE_MODEL_PATH = '/model/temple/model.json';
  private readonly ANALYSIS_THRESHOLD = 0.1;
  private readonly SCENE_SCORE_THRESHOLD = 0.2;
  private readonly CLASS_CARD_ID = 0;
  private readonly CLASS_TEMPLE_ID = 1;


  ngOnInit() {
    this.initializeModels();
  }

  // --- (Helpers pour le template inchangés) ---
  get cardsFormArray() {
    return this.detectorForm.get('cards') as FormArray;
  }
  get templesFormArray() {
    return this.detectorForm.get('temples') as FormArray;
  }
  ctrlAsFormGroup(control: any): FormGroup {
    return control as FormGroup;
  }

  // Helpers sûrs pour récupérer les URLs découpées (protègent contre les accès hors-borne)
  getCroppedCardUrl(index: number): string {
    const arr = this.croppedCards();
    if (!arr || !arr[index]) return '';
    return arr[index].url || '';
  }

  getCroppedTempleUrl(index: number): string {
    const arr = this.croppedTemples();
    if (!arr || !arr[index]) return '';
    return arr[index].url || '';
  }

  /**
   * Charge les TROIS modèles TensorFlow.js au démarrage.
   */
  initializeModels() {
    this.loadingMessage.set("Chargement des 3 modèles...");
    const loadScene = this.tfService.loadModel(this.SCENE_MODEL_PATH, this.SCENE_MODEL_NAME, 640);
    const loadCard = this.tfService.loadModel(this.CARD_MODEL_PATH, this.CARD_MODEL_NAME, 640);
    const loadTemple = this.tfService.loadModel(this.TEMPLE_MODEL_PATH, this.TEMPLE_MODEL_NAME, 640);

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
    this.templesFormArray.clear();
    // Réinitialiser aussi le score
    this.totalScore.set(0);
    this.calculationDetails.set([]);
  }

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
    const inputSize = 640;

    for (const crop of crops) {
      // Analyser le canvas découpé
      const analysisData = await this.tfService.detect(
        crop.canvas,
        this.ANALYSIS_THRESHOLD,
        modelName,
        inputSize
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

  protected calculateScore() {
    // Obtenir les valeurs brutes des formulaires
    const allCards = this.cardsFormArray.getRawValue();
    const allTemples = this.templesFormArray.getRawValue();

    // Appeler le service externe
    const result = this.scoreService.calculate(allCards, allTemples);

    // Mettre à jour les signaux pour l'affichage
    this.totalScore.set(result.score);
    this.calculationDetails.set(result.details);
  }

  private buildCardFormGroup(detections: DetectionResult | null): FormGroup {
    let bestColor = '', bestValue = '', bestMultiplier = '';
    let bestColorScore = 0, bestValueScore = 0, bestMultiplierScore = 0;
    const foundConditions: string[] = [];
    const foundOptions: string[] = [];

    if (detections) {
      for (let i = 0; i < detections.classes.length; i++) {
        const classId = detections.classes[i];
        const score = detections.scores[i];
        const className = CARD_ELEMENT_CLASSES[classId];
        this.loadingMessage.set(`element trouvé : ${className} (confiance : ${Math.round(score * 100)}%)`);
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
          foundOptions.push(className);
        }
      }
    }
    return this.fb.group({
      color: [bestColor],
      value: [bestValue],
      multiplier: [bestMultiplier],
      options: this.fb.array(foundOptions.map(opt => this.fb.control(opt))),
      conditions: this.fb.array(foundConditions.map(cond => this.fb.control(cond)))
    });
  }

  private buildTempleFormGroup(detections: DetectionResult | null): FormGroup {
    let bestColor = '', bestValue = '', bestMultiplier = '';
    let bestColorScore = 0, bestValueScore = 0, bestMultiplierScore = 0;
    // Les temples peuvent aussi avoir des options (gem, chimera...)
    const foundOptions: string[] = [];

    // Utiliser le mapping global `TEMPLE_ELEMENT_CLASSES_MAPPING` importé depuis `constants`.

    if (detections) {
      for (let i = 0; i < detections.classes.length; i++) {
        const classId = detections.classes[i];
        const score = detections.scores[i];
        // Utiliser le mapping des classes du temple (hypothétique)
        const className = TEMPLE_ELEMENT_CLASSES_MAPPING[classId];
        if (!className) continue;

        if (TEMPLE_COLOR_CLASSES.includes(className) && score > bestColorScore) {
          bestColor = className;
          bestColorScore = score;
        } else if (TEMPLE_VALUE_CLASSES.includes(className) && score > bestValueScore) {
          bestValue = className;
          bestValueScore = score;
        } else if (TEMPLE_MULTIPLIER_CLASSES.includes(className) && score > bestMultiplierScore) {
          bestMultiplier = className;
          bestMultiplierScore = score;
        } else if (CARD_OPTION_CLASSES.includes(className)) {
          foundOptions.push(className);
        }
      }
    }

    return this.fb.group({
      color: [bestColor],
      value: [bestValue],
      multiplier: [bestMultiplier],
      options: this.fb.array(foundOptions.map(opt => this.fb.control(opt)))
    });
  }  drawBoxes(results: DetectionResult) {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.clearCanvas();
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

  cropDetections(results: DetectionResult, targetClassId: number, sortLeftToRight: boolean): { url: string, canvas: HTMLCanvasElement }[] {
    const img = this.imageRef.nativeElement;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    const detections = results.boxes
      .map((box, i) => {
        const classId = results.classes[i];
        const score = results.scores[i];
        if (classId !== targetClassId || score < this.SCENE_SCORE_THRESHOLD) {
            return null;
        }
        const [xmin, ymin, xmax, ymax] = box;
        const left = Math.round(xmin * imgWidth);
        const top = Math.round(ymin * imgHeight);
        const width = Math.round((xmax - xmin) * imgWidth);
        const height = Math.round((ymax - ymin) * imgHeight);
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
            url: tempCanvas.toDataURL('image/jpeg', 0.95),
            canvas: tempCanvas
        });
      }
    }
    return croppedDetections;
  }
}
