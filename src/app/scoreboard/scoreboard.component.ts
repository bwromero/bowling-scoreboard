import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Frame } from '../models/frame.interface';
@Component({
  selector: 'app-scoreboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scoreboard.component.html',
  styleUrl: './scoreboard.component.scss'
})
export class ScoreboardComponent {

  frames: Frame[] = Array.from({ length: 10 }, (_, i) => ({
    frameNumber: i + 1,
    firstRoll: null,
    secondRoll: null,
    totalScore: null,
    isStrike: false,
    isSpare: false
  }));


  onRadiobuttonClick(type: 'strike' | 'spare', frameIndex: number) {
    this.frames[frameIndex].isStrike = type === 'strike';
    this.frames[frameIndex].isSpare = type === 'spare';
  }

}
