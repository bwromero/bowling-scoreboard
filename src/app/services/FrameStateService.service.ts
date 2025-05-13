import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Frame } from '../models/frame.interface';

@Injectable({
  providedIn: 'root'
})
export class FrameStateService {
  private framesSubject = new BehaviorSubject<Frame[]>([]);
  private currentFrameIndexSubject = new BehaviorSubject<number>(0);

  constructor() {
    // Initialize frames
    const initialFrames = Array.from({ length: 10 }, (_, i) => ({
      frameNumber: i + 1,
      firstRoll: null,
      secondRoll: null,
      totalScore: null,
      isStrike: false,
      isSpare: false
    }));
    this.framesSubject.next(initialFrames);
  }

  // Observable streams
  public frames$: Observable<Frame[]> = this.framesSubject.asObservable();
  public currentFrameIndex$: Observable<number> = this.currentFrameIndexSubject.asObservable();

  // Methods to update frame state
  updateFrame(frameIndex: number, updates: Partial<Frame>): void {
    const currentFrames = this.framesSubject.value;
    const updatedFrames = [...currentFrames];
    updatedFrames[frameIndex] = { ...updatedFrames[frameIndex], ...updates };
    this.framesSubject.next(updatedFrames);
  }

  updateRoll(frameIndex: number, rollType: 'firstRoll' | 'secondRoll', value: number | null): void {
    const currentFrames = this.framesSubject.value;
    const frame = currentFrames[frameIndex];
    
    // Update the roll
    this.updateFrame(frameIndex, { [rollType]: value });

    // If it's the first roll and spare is selected, set total to 10
    if (rollType === 'firstRoll' && frame.isSpare) {
        const previousFrameTotal = frameIndex > 0 ? (currentFrames[frameIndex - 1].totalScore || 0) : 0;
        const newTotal = previousFrameTotal + 10;
        this.updateFrame(frameIndex, { totalScore: newTotal });
    } else {
        // Calculate new total for other cases
        this.calculateFrameTotal(frameIndex);
    }
  }

  private calculateFrameTotal(frameIndex: number): void {
    const currentFrames = this.framesSubject.value;
    const frame = currentFrames[frameIndex];
    let currentFrameScore = 0;

    // Calculate current frame's score
    if (frame.firstRoll !== null && frame.secondRoll !== null) {
      currentFrameScore = frame.firstRoll + frame.secondRoll;
    } else if (frame.firstRoll !== null) {
      currentFrameScore = frame.firstRoll;
    }

    if (frame.firstRoll !== null && frame.isSpare) {
        currentFrameScore = 10;
    } 

    // Add previous frame's total if it exists
    if (frameIndex > 0) {
      const previousFrame = currentFrames[frameIndex - 1];
      if (previousFrame.totalScore !== null) {
        currentFrameScore += previousFrame.totalScore;
      }
    }

    this.updateFrame(frameIndex, { totalScore: currentFrameScore || null });
  }

  setFrameType(frameIndex: number, type: 'strike' | 'spare'): void {
    const currentFrames = this.framesSubject.value;
    const frame = currentFrames[frameIndex];
    
    // If clicking the same type that's already selected, unselect it
    if ((type === 'strike' && frame.isStrike) || (type === 'spare' && frame.isSpare)) {
        this.updateFrame(frameIndex, {
            isStrike: false,
            isSpare: false,
            totalScore: null  // Reset total score when unselecting
        });
    } else {
        // If switching from strike to spare or vice versa
        if ((type === 'spare' && frame.isStrike) || (type === 'strike' && frame.isSpare)) {
            this.updateFrame(frameIndex, {
                isStrike: type === 'strike',
                isSpare: type === 'spare',
                totalScore: null  // Reset total score when switching types
            });
        } else {
            // Otherwise, set the new type
            this.updateFrame(frameIndex, {
                isStrike: type === 'strike',
                isSpare: type === 'spare'
            });
        }
        
        // Add 10 to total score for strike
        if (type === 'strike') {
            const previousFrameTotal = frameIndex > 0 ? (currentFrames[frameIndex - 1].totalScore || 0) : 0;
            const newTotal = previousFrameTotal + 10;
            this.updateFrame(frameIndex, { firstRoll: null, totalScore: newTotal });
        }
         // Set total to 10 for spare if first roll exists
         else if (type === 'spare' && frame.firstRoll !== null) {
            const previousFrameTotal = frameIndex > 0 ? (currentFrames[frameIndex - 1].totalScore || 0) : 0;
            const newTotal = previousFrameTotal + 10;
            this.updateFrame(frameIndex, { totalScore: newTotal });
        }
    }
}

  getCurrentFrame(): Observable<Frame> {
    return new Observable(subscriber => {
      this.currentFrameIndex$.subscribe(index => {
        const frames = this.framesSubject.value;
        subscriber.next(frames[index]);
      });
    });
  }
}