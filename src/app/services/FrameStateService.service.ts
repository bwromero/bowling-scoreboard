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

    // Calculate new total
    this.calculateFrameTotal(frameIndex);
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
    const updates: Partial<Frame> = {
      isStrike: type === 'strike',
      isSpare: type === 'spare'
    };
    this.updateFrame(frameIndex, updates);
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