export interface Frame {
    frameNumber: number;
    firstRoll: number | null;
    secondRoll: number | null;
    thirdRoll: number | null;  // For 10th frame
    fourthRoll: number | null; // For 10th frame
    totalScore: number | null;
    isStrike: boolean;
    isSpare: boolean;
}