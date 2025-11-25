import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TensorflowService } from './services/tensorFlow.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('faraway');
  private tfService = inject(TensorflowService);

  private readonly SCENE_MODEL_PATH = '/model/set/model.json';
  private readonly CARD_MODEL_PATH = '/model/card/model.json';
  private readonly TEMPLE_MODEL_PATH = '/model/temple/model.json';
  private readonly SCENE_MODEL_NAME = 'SCENE_MODEL';
  private readonly CARD_MODEL_NAME = 'CARD_MODEL';
  private readonly TEMPLE_MODEL_NAME = 'TEMPLE_MODEL';

  ngOnInit() {
    // Chargement des modèles en tâche de fond au démarrage de l'application
    console.log('Chargement des modèles TensorFlow en arrière-plan...');
    Promise.all([
      this.tfService.loadModel(this.SCENE_MODEL_PATH, this.SCENE_MODEL_NAME, 640),
      this.tfService.loadModel(this.CARD_MODEL_PATH, this.CARD_MODEL_NAME, 640),
      this.tfService.loadModel(this.TEMPLE_MODEL_PATH, this.TEMPLE_MODEL_NAME, 640)
    ]).then(() => {
      console.log('Tous les modèles TensorFlow sont chargés et prêts.');
    }).catch(err => {
      console.error('Erreur lors du chargement des modèles:', err);
    });
  }
}
