import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Frame } from '../models/frame.interface';
import { FrameStateService } from '../services/FrameStateService.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-scoreboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scoreboard.component.html',
  styleUrl: './scoreboard.component.scss'
})
export class ScoreboardComponent {

  frames: Frame[] = [];
  private subscription: Subscription = new Subscription();

  constructor(private frameStateService: FrameStateService) {}

  ngOnInit() {
    // Subscribe to frames updates
    this.subscription.add(
      this.frameStateService.frames$.subscribe(frames => {
        this.frames = frames;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onRollChange(frameIndex: number, rollType: 'firstRoll' | 'secondRoll' | 'thirdRoll' | 'fourthRoll', value: number | null) {
    this.frameStateService.updateRoll(frameIndex, rollType, value);
  }

  onRadiobuttonClick(type: 'strike' | 'spare', frameIndex: number) {
    this.frameStateService.setFrameType(frameIndex, type);
  }

}
