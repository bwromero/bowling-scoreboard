import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Frame } from '../models/frame.interface';

@Component({
  selector: 'app-scoreboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

    this.calculateTotal(frameIndex);
  }

  calculateTotal(frameIndex: number) {
    const frame = this.frames[frameIndex];
    let prevFrame = null;
    const nextFrame = this.frames[frameIndex + 1];
    //open frame
    if (frame.firstRoll !== null && frame.secondRoll !== null && !frame.isStrike && !frame.isSpare) {
      frame.totalScore = frame.firstRoll + frame.secondRoll;
      if (frameIndex > 0) {
        prevFrame = this.frames[frameIndex - 1];
        if (prevFrame.totalScore !== null) {
          frame.totalScore += prevFrame.totalScore;
        }
      }
    }


    //strike
    if (frame.isStrike && frame.firstRoll !== null && frame.secondRoll == null) {

    }

    //spare
    if (frame.isSpare) {
      frame.secondRoll = null;

      if(frameIndex == 0 && frame.firstRoll !== null) {
        frame.totalScore = 10
      }

      if(frameIndex  > 0) { 
        const prevFrameTotalScore = this.frames[frameIndex - 1].totalScore;
        if(prevFrameTotalScore !== null && frame.firstRoll !== null && frame.firstRoll > 0) {
          frame.totalScore = 10 + prevFrameTotalScore;
        }
      }
    }
  }
}
