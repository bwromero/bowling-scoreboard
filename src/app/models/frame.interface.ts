export interface Frame {
    frameNumber: number;
    firstRoll: number | null;
    secondRoll: number | null;
    totalScore: number | null;
    isStrike: boolean;
    isSpare: boolean;
}