import { Component, signal, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  showNewGameForm = signal(false);
  hasCurrentGame = signal(false);

  ngOnInit() {
    // Vérifier s'il y a une partie en cours
    const storedPlayers = localStorage.getItem('faraway_players');
    const storedScores = localStorage.getItem('faraway_scores');
    this.hasCurrentGame.set(!!(storedPlayers && storedScores));

    // Pré-remplir le formulaire avec les joueurs sauvegardés
    if (storedPlayers) {
      const players: string[] = JSON.parse(storedPlayers);
      this.playersArray.clear();
      players.forEach(playerName => {
        this.playersArray.push(this.fb.control(playerName, { validators: [Validators.required, Validators.minLength(2)], nonNullable: true }));
      });
    }
  }

  gameForm = this.fb.group({
    players: this.fb.array([
      this.fb.control('', [Validators.required, Validators.minLength(2)]),
      this.fb.control('', [Validators.required, Validators.minLength(2)])
    ])
  });

  get playersArray(): FormArray<FormControl<string>> {
    return this.gameForm.get('players') as FormArray<FormControl<string>>;
  }

  get canAddPlayer(): boolean {
    return this.playersArray.length < 6;
  }

  get canRemovePlayer(): boolean {
    return this.playersArray.length > 2;
  }

  toggleNewGameForm() {
    this.showNewGameForm.update(v => !v);
  }

  addPlayer() {
    if (this.canAddPlayer) {
      this.playersArray.push(this.fb.control('', { validators: [Validators.required, Validators.minLength(2)], nonNullable: true }));
    }
  }

  removePlayer(index: number) {
    if (this.canRemovePlayer) {
      this.playersArray.removeAt(index);
    }
  }

  startGame() {
    if (this.gameForm.valid) {
      const players = this.playersArray.value.filter(name => name.trim());
      // Sauvegarder les joueurs dans le localStorage
      localStorage.setItem('faraway_players', JSON.stringify(players));
      // Réinitialiser les scores pour une nouvelle partie
      localStorage.removeItem('faraway_scores');
      localStorage.removeItem('faraway_rounds');
      this.router.navigate(['/score'], { state: { players } });
    }
  }

  resumeGame() {
    this.router.navigate(['/score']);
  }

  goToDetection() {
    this.router.navigate(['/image-detector']);
  }
}
