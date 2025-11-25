import { Component, signal, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl } from '@angular/forms';

@Component({
  selector: 'app-score',
  imports: [ReactiveFormsModule],
  templateUrl: './score.html',
  styleUrl: './score.scss',
})
export class ScoreComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  players = signal<string[]>([]);
  rounds = signal<number>(1);

  scoreForm: FormGroup = this.fb.group({
    scores: this.fb.array([])
  });

  get scoresArray(): FormArray {
    return this.scoreForm.get('scores') as FormArray;
  }

  ngOnInit() {
    // Récupérer les joueurs depuis l'état de navigation
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;

    let players: string[] | null = null;

    if (state && state['players']) {
      players = state['players'];
    } else {
      // Essayer de récupérer depuis le localStorage
      const storedPlayers = localStorage.getItem('faraway_players');
      if (storedPlayers) {
        players = JSON.parse(storedPlayers);
      }
    }

    if (players && players.length > 0) {
      this.players.set(players);
      this.loadScores();
    } else {
      // Si pas de joueurs, retourner à l'accueil
      this.router.navigate(['/']);
    }
  }

  loadScores() {
    const storedScores = localStorage.getItem('faraway_scores');
    const storedRounds = localStorage.getItem('faraway_rounds');

    if (storedScores && storedRounds) {
      // Charger les scores existants
      const scores = JSON.parse(storedScores);
      this.rounds.set(Number(storedRounds));

      // Reconstruire le FormArray avec les scores sauvegardés
      scores.forEach((playerScores: number[]) => {
        const roundsArray = this.fb.array(
          playerScores.map(score => this.fb.control(score))
        );
        this.scoresArray.push(roundsArray);
      });
    } else {
      // Initialiser avec des scores vides
      this.initializeScores();
    }

    // S'abonner aux changements pour sauvegarder automatiquement
    this.scoreForm.valueChanges.subscribe(() => {
      this.saveScores();
    });
  }

  initializeScores() {
    const playerCount = this.players().length;
    const roundCount = this.rounds();

    // Créer un FormArray pour chaque joueur
    for (let i = 0; i < playerCount; i++) {
      const roundsArray = this.fb.array([]);

      // Ajouter un FormControl pour chaque round
      for (let j = 0; j < roundCount; j++) {
        roundsArray.push(this.fb.control(0));
      }

      this.scoresArray.push(roundsArray);
    }
  }

  saveScores() {
    const scores = this.scoresArray.controls.map(playerScores => {
      return (playerScores as FormArray).controls.map(control => control.value);
    });

    localStorage.setItem('faraway_scores', JSON.stringify(scores));
    localStorage.setItem('faraway_rounds', this.rounds().toString());
  }

  addRound() {
    this.rounds.update(r => r + 1);

    // Ajouter un nouveau FormControl à chaque joueur
    this.scoresArray.controls.forEach(playerScores => {
      (playerScores as FormArray).push(this.fb.control(0));
    });

    // Sauvegarder immédiatement
    this.saveScores();
  }

  getPlayerScores(playerIndex: number): FormArray {
    return this.scoresArray.at(playerIndex) as FormArray;
  }

  getScoreControl(playerIndex: number, roundIndex: number): FormControl {
    return this.getPlayerScores(playerIndex).at(roundIndex) as FormControl;
  }

  getPlayerWins(playerIndex: number): number {
    let wins = 0;
    const roundCount = this.rounds();

    // Pour chaque round, vérifier si ce joueur a le score le plus élevé
    for (let j = 0; j < roundCount; j++) {
      let maxScore = -1;
      let winnerCount = 0;

      // Trouver le score maximum du round
      for (let i = 0; i < this.players().length; i++) {
        const score = Number(this.getScoreControl(i, j).value) || 0;
        if (score > maxScore) {
          maxScore = score;
          winnerCount = 1;
        } else if (score === maxScore && score > 0) {
          winnerCount++;
        }
      }

      // Vérifier si ce joueur a gagné ce round
      const playerScore = Number(this.getScoreControl(playerIndex, j).value) || 0;
      if (playerScore === maxScore && maxScore > 0 && winnerCount === 1) {
        wins += 1; // Seulement si victoire solo (pas d'égalité)
      }
    }

    return wins; // Retourne le nombre entier de victoires
  }

  getPlayerAverage(playerIndex: number): number {
    const playerScores = this.getPlayerScores(playerIndex);
    const total = playerScores.controls.reduce((sum, control) => {
      return sum + (Number(control.value) || 0);
    }, 0);
    const average = this.rounds() > 0 ? total / this.rounds() : 0;
    return Math.round(average * 10) / 10; // Arrondir à 1 décimale
  }

  getRoundNumbers(): number[] {
    return Array.from({ length: this.rounds() }, (_, i) => i + 1);
  }

  isRoundWinner(playerIndex: number, roundIndex: number): boolean {
    let maxScore = -1;
    let winnerCount = 0;

    // Trouver le score maximum du round
    for (let i = 0; i < this.players().length; i++) {
      const score = Number(this.getScoreControl(i, roundIndex).value) || 0;
      if (score > maxScore) {
        maxScore = score;
        winnerCount = 1;
      } else if (score === maxScore && score > 0) {
        winnerCount++;
      }
    }

    // Vérifier si ce joueur a gagné ce round (victoire solo uniquement)
    const playerScore = Number(this.getScoreControl(playerIndex, roundIndex).value) || 0;
    return playerScore === maxScore && maxScore > 0 && winnerCount === 1;
  }

  goToDetection() {
    this.router.navigate(['/image-detector']);
  }

  goToHome() {
    this.router.navigate(['/']);
  }
}
