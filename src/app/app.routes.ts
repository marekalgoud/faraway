import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { ImageDetectorComponent } from './pages/image-detector/image-detector';
import { ScoreComponent } from './pages/score/score';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'image-detector', component: ImageDetectorComponent },
  { path: 'score', component: ScoreComponent }
];
