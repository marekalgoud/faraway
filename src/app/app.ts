import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TensorflowService } from './services/tensorFlow.service';
import { PwaService } from './services/pwa.service';
import { Footer } from './components/footer/footer';
import { TranslatePipe } from './pipes/translate.pipe';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Footer, TranslatePipe],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('faraway');
  private tfService = inject(TensorflowService);
  private pwaService = inject(PwaService);
  
  // Exposer les signaux de chargement pour le template
  protected isLoadingModels = this.tfService.isLoadingModels;
  protected loadingProgress = this.tfService.loadingProgress;
  protected loadingMessage = this.tfService.loadingMessage;
  
  // Exposer les signaux PWA
  protected canInstall = this.pwaService.canInstall;
  protected isOnline = this.pwaService.isOnline;
  protected isStandalone = this.pwaService.isStandalone;
  
  // Afficher la bannière de mise à jour uniquement si l'app est installée en PWA
  protected showUpdateBanner = computed(() => 
    this.pwaService.updateAvailable() && this.pwaService.isStandalone()
  );
  
  showInstallBanner = signal(false);

  private readonly SCENE_MODEL_PATH = '/model/set/model.json';
  private readonly CARD_MODEL_PATH = '/model/card/model.json';
  private readonly TEMPLE_MODEL_PATH = '/model/temple/model.json';
  private readonly SCENE_MODEL_NAME = 'SCENE_MODEL';
  private readonly CARD_MODEL_NAME = 'CARD_MODEL';
  private readonly TEMPLE_MODEL_NAME = 'TEMPLE_MODEL';

  ngOnInit() {
    // Chargement des modèles en tâche de fond au démarrage de l'application
    this.tfService.loadModels([
      { url: this.SCENE_MODEL_PATH, name: this.SCENE_MODEL_NAME, size: 640 },
      { url: this.CARD_MODEL_PATH, name: this.CARD_MODEL_NAME, size: 640 },
      { url: this.TEMPLE_MODEL_PATH, name: this.TEMPLE_MODEL_NAME, size: 640 }
    ]);
    
    // Afficher la bannière d'installation après 30 secondes si disponible
    setTimeout(() => {
      if (this.canInstall()) {
        this.showInstallBanner.set(true);
      }
    }, 30000);
  }
  
  async installApp() {
    const installed = await this.pwaService.promptInstall();
    if (installed) {
      this.showInstallBanner.set(false);
    }
  }
  
  dismissInstallBanner() {
    this.showInstallBanner.set(false);
  }
  
  async updateApp() {
    await this.pwaService.forceUpdate();
  }
}
