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

    public frames$: Observable<Frame[]> = this.framesSubject.asObservable();
    public currentFrameIndex$: Observable<number> = this.currentFrameIndexSubject.asObservable();

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

        // Check for two frames back (for three consecutive strikes)
        if (frameIndex > 1) {
            const twoFramesBack = currentFrames[frameIndex - 2];
            const previousFrame = currentFrames[frameIndex - 1];
            
            // If we have three consecutive strikes
            if (twoFramesBack?.isStrike && previousFrame?.isStrike && frame.isStrike && frameIndex < 8) {
                let twoFramesBackTotal = 10; // Base score for strike
                twoFramesBackTotal += 20; // Add 20 for the two consecutive strikes
                // Add the total from three frames back if it exists
                if (frameIndex > 2) {
                    const threeFramesBack = currentFrames[frameIndex - 3];
                    if (threeFramesBack?.totalScore !== null) {
                        twoFramesBackTotal += threeFramesBack.totalScore;
                    }
                }
                this.updateFrame(frameIndex - 2, { totalScore: twoFramesBackTotal });
            }
        }

        // If previous frame was a strike, update its score
        if (frameIndex > 0) {
            const previousFrame = currentFrames[frameIndex - 1];
            if (previousFrame?.isStrike && frameIndex < 9) { // Not the last frame
                let previousFrameTotal = 10; // Base score for strike
                
                if (frame.isStrike) {
                    // If current frame is also a strike, add 10 more points
                    previousFrameTotal += 10;
                } else {
                    // If current frame is not a strike, add both rolls
                    if (frame.firstRoll !== null) {
                        previousFrameTotal += frame.firstRoll;
                        if (frame.secondRoll !== null) {
                            previousFrameTotal += frame.secondRoll;
                        }
                    }
                }
                
                // Add the previous frame's total if it exists
                if (frameIndex > 1) {
                    const twoFramesBack = currentFrames[frameIndex - 2];
                    if (twoFramesBack?.totalScore !== null) {
                        previousFrameTotal += twoFramesBack.totalScore;
                    }
                }
                
                this.updateFrame(frameIndex - 1, { totalScore: previousFrameTotal });
            }
        }

        // Calculate current frame's total if it's not a strike
        if (!frame.isStrike) {
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

            if (type === 'strike') {
                // For a strike, set initial score of 10 plus previous frame's total
                const previousFrameTotal = frameIndex > 0 ? (currentFrames[frameIndex - 1].totalScore || 0) : 0;
                const newTotal = previousFrameTotal + 10;
                this.updateFrame(frameIndex, { 
                    firstRoll: null, 
                    totalScore: newTotal 
                });

                // If there was a previous strike, update its score
                if (frameIndex > 0) {
                    const previousFrame = currentFrames[frameIndex - 1];
                    if (previousFrame.isStrike && frameIndex < 9) { // Not the last frame
                        // For the previous strike, add 10 more points (20 total for two consecutive strikes)
                        const previousFrameTotal = previousFrame.totalScore || 0;
                        const updatedPreviousTotal = (previousFrameTotal - 10) + 20;
                        this.updateFrame(frameIndex - 1, { totalScore: updatedPreviousTotal });

                        // Update current frame's total to include the previous frame's total
                        const currentFrameTotal = updatedPreviousTotal + 10;
                        this.updateFrame(frameIndex, { totalScore: currentFrameTotal });
                    }
                }
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