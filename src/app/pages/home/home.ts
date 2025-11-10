import { AfterViewInit, Component, ElementRef, OnDestroy, signal, viewChild } from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements AfterViewInit, OnDestroy {

  // Stocke l'URL de l'image capturée (format base64)
  capturedImage = signal<string | null>(null);

  // Stocke le message d'erreur en cas de problème avec la webcam
  errorMessage = signal<string | null>(null);

  // Référence au flux de la webcam pour pouvoir l'arrêter
  private videoStream = signal<MediaStream | null>(null);

  // --- Références aux éléments du DOM ---

  // Utilise viewChild.required pour obtenir une référence à l'élément <video>
  videoElement = viewChild.required<ElementRef<HTMLVideoElement>>('videoElement');

  // Référence à l'élément <canvas>
  canvasElement = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasElement');

  /**
   * Hook de cycle de vie : s'exécute après que la vue (template) est initialisée.
   * C'est le bon moment pour accéder à la webcam.
   */
  ngAfterViewInit(): void {
    this.setupWebcam();
  }

  /**
   * Hook de cycle de vie : s'exécute juste avant que le composant ne soit détruit.
   * Essentiel pour nettoyer et arrêter le flux de la webcam.
   */
  ngOnDestroy(): void {
    this.stopWebcam();
  }

  /**
   * Tente d'accéder à la webcam de l'utilisateur.
   */
  async setupWebcam(): Promise<void> {
    try {
      // Demande l'accès au flux vidéo
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 }, // Demande une résolution HD
          height: { ideal: 720 },
          facingMode: 'environment' // Préfère la caméra arrière (mobile)
        }
      });

      this.videoStream.set(stream); // Sauvegarde le flux pour l'arrêter plus tard

      // Lie le flux à l'élément <video>
      const video = this.videoElement().nativeElement;
      video.srcObject = stream;
      video.play(); // Démarre la vidéo

    } catch (err) {
      console.error("Erreur d'accès à la webcam :", err);
      // Gère les erreurs courantes
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          this.errorMessage.set("L'accès à la webcam a été refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur.");
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          this.errorMessage.set("Aucune webcam n'a été trouvée.");
        } else {
          this.errorMessage.set("Une erreur est survenue lors de l'accès à la webcam.");
        }
      } else {
        this.errorMessage.set("Une erreur technique est survenue.");
      }
    }
  }

  /**
   * Arrête proprement le flux de la webcam.
   */
  stopWebcam(): void {
    const stream = this.videoStream();
    if (stream) {
      stream.getTracks().forEach(track => track.stop()); // Arrête chaque piste (vidéo/audio)
      this.videoStream.set(null);
    }
  }

  /**
   * Capture l'image actuelle de la vidéo vers le canvas.
   */
  capture(): void {
    if (this.errorMessage()) {
      console.warn("Capture impossible à cause d'une erreur précédente.");
      return;
    }

    const video = this.videoElement().nativeElement;
    const canvas = this.canvasElement().nativeElement;
    const context = canvas.getContext('2d');

    if (context) {
      // Définit la taille du canvas pour qu'elle corresponde à la taille réelle de la vidéo
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Dessine l'image actuelle de la vidéo sur le canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convertit le contenu du canvas en une URL de données (image PNG en base64)
      const dataUrl = canvas.toDataURL('image/png');

      // Met à jour le signal avec l'image capturée, ce qui l'affichera
      this.capturedImage.set(dataUrl);

      // --- Point d'intégration pour TensorFlow.js ---
      // C'est ici que vous auriez votre image pour TF.js.
      // Vous n'utiliseriez pas le dataUrl, mais directement le canvas ou la vidéo :
      //
      // const imageTensor = tf.browser.fromPixels(video);
      // const predictions = await model.detect(imageTensor);
      // console.log(predictions);
      //
    } else {
      console.error("Impossible d'obtenir le contexte 2D du canvas.");
      this.errorMessage.set("Erreur technique lors de la capture (contexte canvas).");
    }
  }
}
