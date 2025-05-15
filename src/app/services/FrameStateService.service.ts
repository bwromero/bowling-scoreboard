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
            thirdRoll: null,  // For 10th frame
            fourthRoll: null, // For 10th frame
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

    updateRoll(frameIndex: number, rollType: 'firstRoll' | 'secondRoll' | 'thirdRoll' | 'fourthRoll', value: number | null): void {
        const currentFrames = this.framesSubject.value;
        const frame = currentFrames[frameIndex];

        // Update the roll
        this.updateFrame(frameIndex, { [rollType]: value });

        // Special handling for 10th frame
        if (frameIndex === 9) {
            let total = 0;
            
            // Add previous frame's total if it exists
            if (frameIndex > 0) {
                const previousFrame = currentFrames[frameIndex - 1];
                if (previousFrame.totalScore !== null) {
                    total += previousFrame.totalScore;
                }
            }

            // Calculate current frame's score based on the situation
            if (frame.isStrike) {
                // For a strike in 10th frame, add 10 plus bonus rolls
                total += 10;
                if (frame.thirdRoll !== null) {
                    total += frame.thirdRoll;
                }
                if (frame.fourthRoll !== null) {
                    total += frame.fourthRoll;
                }
            } else if (frame.isSpare) {
                // For a spare in 10th frame, add 10 plus bonus roll
                total += 10;
                if (frame.thirdRoll !== null) {
                    total += frame.thirdRoll;
                }
            } else {
                // For an open frame, just add the rolls
                if (frame.firstRoll !== null) {
                    total += frame.firstRoll;
                }
                if (frame.secondRoll !== null) {
                    total += frame.secondRoll;
                }
            }

            this.updateFrame(frameIndex, { totalScore: total });
            return;
        }

        // Regular frame handling (non-10th frame)
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

            if(previousFrame?.isSpare && frameIndex < 9) {
                let previousFrameTotal = previousFrame.totalScore || 0;
                if(frame.firstRoll !== null) {
                    previousFrameTotal += frame.firstRoll;
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
                totalScore: null,  // Reset total score when unselecting
                thirdRoll: null,   // Reset extra rolls for 10th frame
                fourthRoll: null
            });
        } else {
            // If switching from strike to spare or vice versa
            if ((type === 'spare' && frame.isStrike) || (type === 'strike' && frame.isSpare)) {
                this.updateFrame(frameIndex, {
                    isStrike: type === 'strike',
                    isSpare: type === 'spare',
                    totalScore: null,  // Reset total score when switching types
                    thirdRoll: null,   // Reset extra rolls for 10th frame
                    fourthRoll: null
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

                // If there are two previous consecutive strikes, update the frame two back
                if (frameIndex > 1) {
                    const twoFramesBack = currentFrames[frameIndex - 2];
                    const oneFrameBack = currentFrames[frameIndex - 1];
                    if (twoFramesBack.isStrike && oneFrameBack.isStrike) {
                        // The frame two back should now be finalized as a triple strike: previous of two back + 30
                        const twoBackPrevTotal = frameIndex > 2 ? (currentFrames[frameIndex - 3].totalScore || 0) : 0;
                        const tripleStrikeTotal = twoBackPrevTotal + 30;
                        this.updateFrame(frameIndex - 2, { totalScore: tripleStrikeTotal });

                        // Now update the next frames to keep the running total
                        // Update frameIndex-1 (second strike)
                        const secondStrikeTotal = tripleStrikeTotal + 10;
                        this.updateFrame(frameIndex - 1, { totalScore: secondStrikeTotal });

                        // Update current frame (third strike)
                        const thirdStrikeTotal = secondStrikeTotal + 10;
                        this.updateFrame(frameIndex, { totalScore: thirdStrikeTotal });
                    }
                }
            } else if (type === 'spare') {
                // For a spare, set total to 10 plus the next roll
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