/**
 * Points Calculator for World Cup Knockout Predictions
 * 
 * Points Structure:
 * 
 * 90-MINUTE SCORE:
 * - Exact score: 5 pts
 * - Correct margin: 3 pts
 * - Correct result: 1 pt
 * 
 * EXTRA TIME (if 90min was a draw):
 * - Correct ET result (home/away/draw): 3 pts
 * 
 * PENALTIES (if ET was also a draw):
 * - Correct penalty winner: 2 pts
 * 
 * BONUS:
 * - Correct ultimate match winner: 1 pt
 * 
 * MAX POINTS:
 * - 90min decisive: 6 pts (5 exact + 1 winner)
 * - ET decisive: 9 pts (5 exact + 3 ET + 1 winner)
 * - Penalties: 11 pts (5 exact + 3 ET + 2 pens + 1 winner)
 */

export type MatchResult = {
  matchId: string;
  homeScore: number;      // 90-minute score
  awayScore: number;      // 90-minute score
  etResult?: string | null;      // 'home', 'away', or 'draw' (null if 90min wasn't a draw)
  penaltyWinner?: string | null; // 'home' or 'away' (null if didn't go to penalties)
};

export type UserPrediction = {
  matchId: string;
  homeScore: number;
  awayScore: number;
  etResult?: string | null;
  penaltyWinner?: string | null;
};

export type PointsBreakdown = {
  total: number;
  ninetyMinScore: number;      // 0, 1, 3, or 5
  etResult: number;            // 0 or 3
  penaltyWinner: number;       // 0 or 2
  correctWinner: number;       // 0 or 1
  details: {
    exactScore: boolean;
    correctMargin: boolean;
    correctResult: boolean;
    correctEtResult: boolean;
    correctPenaltyWinner: boolean;
    correctUltimateWinner: boolean;
  };
};

/**
 * Get the ultimate winner of a match based on result
 */
export function getUltimateWinner(result: MatchResult): 'home' | 'away' | null {
  // If 90min wasn't a draw, winner is determined by score
  if (result.homeScore > result.awayScore) return 'home';
  if (result.awayScore > result.homeScore) return 'away';
  
  // 90min was a draw, check ET
  if (result.etResult === 'home') return 'home';
  if (result.etResult === 'away') return 'away';
  
  // ET was also a draw, check penalties
  if (result.penaltyWinner === 'home') return 'home';
  if (result.penaltyWinner === 'away') return 'away';
  
  return null; // Match not yet decided
}

/**
 * Get the predicted ultimate winner based on user's prediction
 */
export function getPredictedWinner(prediction: UserPrediction): 'home' | 'away' | null {
  // If 90min prediction isn't a draw, winner is determined by score
  if (prediction.homeScore > prediction.awayScore) return 'home';
  if (prediction.awayScore > prediction.homeScore) return 'away';
  
  // 90min prediction is a draw, check ET prediction
  if (prediction.etResult === 'home') return 'home';
  if (prediction.etResult === 'away') return 'away';
  
  // ET prediction is also a draw, check penalty prediction
  if (prediction.penaltyWinner === 'home') return 'home';
  if (prediction.penaltyWinner === 'away') return 'away';
  
  return null;
}

/**
 * Calculate points for a single prediction against actual result
 */
export function calculateMatchPoints(
  prediction: UserPrediction,
  result: MatchResult
): PointsBreakdown {
  const breakdown: PointsBreakdown = {
    total: 0,
    ninetyMinScore: 0,
    etResult: 0,
    penaltyWinner: 0,
    correctWinner: 0,
    details: {
      exactScore: false,
      correctMargin: false,
      correctResult: false,
      correctEtResult: false,
      correctPenaltyWinner: false,
      correctUltimateWinner: false,
    },
  };

  // === 90-MINUTE SCORE POINTS ===
  const predHome = prediction.homeScore;
  const predAway = prediction.awayScore;
  const actualHome = result.homeScore;
  const actualAway = result.awayScore;

  if (predHome === actualHome && predAway === actualAway) {
    // Exact score: 5 pts
    breakdown.ninetyMinScore = 5;
    breakdown.details.exactScore = true;
  } else if ((predHome - predAway) === (actualHome - actualAway)) {
    // Correct margin: 3 pts
    breakdown.ninetyMinScore = 3;
    breakdown.details.correctMargin = true;
  } else if (
    (predHome > predAway && actualHome > actualAway) ||
    (predHome < predAway && actualHome < actualAway) ||
    (predHome === predAway && actualHome === actualAway)
  ) {
    // Correct result: 1 pt
    breakdown.ninetyMinScore = 1;
    breakdown.details.correctResult = true;
  }

  // === EXTRA TIME POINTS (only if actual 90min was a draw) ===
  const actual90MinDraw = actualHome === actualAway;
  
  if (actual90MinDraw && result.etResult) {
    // Check if user predicted ET result correctly
    if (prediction.etResult === result.etResult) {
      breakdown.etResult = 3;
      breakdown.details.correctEtResult = true;
    }
  }

  // === PENALTY POINTS (only if actual ET was also a draw) ===
  if (actual90MinDraw && result.etResult === 'draw' && result.penaltyWinner) {
    // Check if user predicted penalty winner correctly
    if (prediction.penaltyWinner === result.penaltyWinner) {
      breakdown.penaltyWinner = 2;
      breakdown.details.correctPenaltyWinner = true;
    }
  }

  // === CORRECT WINNER BONUS ===
  const actualWinner = getUltimateWinner(result);
  const predictedWinner = getPredictedWinner(prediction);
  
  if (actualWinner && predictedWinner && actualWinner === predictedWinner) {
    breakdown.correctWinner = 1;
    breakdown.details.correctUltimateWinner = true;
  }

  // Calculate total
  breakdown.total = 
    breakdown.ninetyMinScore + 
    breakdown.etResult + 
    breakdown.penaltyWinner + 
    breakdown.correctWinner;

  return breakdown;
}

/**
 * Calculate total points for multiple predictions
 */
export function calculateTotalPoints(
  predictions: UserPrediction[],
  results: MatchResult[]
): {
  total: number;
  exactScores: number;
  correctMargins: number;
  correctResults: number;
  correctEtResults: number;
  correctPenaltyWinners: number;
  correctWinners: number;
  matchBreakdowns: Map<string, PointsBreakdown>;
} {
  let total = 0;
  let exactScores = 0;
  let correctMargins = 0;
  let correctResults = 0;
  let correctEtResults = 0;
  let correctPenaltyWinners = 0;
  let correctWinners = 0;
  const matchBreakdowns = new Map<string, PointsBreakdown>();

  for (const prediction of predictions) {
    const result = results.find(r => r.matchId === prediction.matchId);
    if (!result) continue;

    const breakdown = calculateMatchPoints(prediction, result);
    matchBreakdowns.set(prediction.matchId, breakdown);

    total += breakdown.total;
    if (breakdown.details.exactScore) exactScores++;
    if (breakdown.details.correctMargin) correctMargins++;
    if (breakdown.details.correctResult) correctResults++;
    if (breakdown.details.correctEtResult) correctEtResults++;
    if (breakdown.details.correctPenaltyWinner) correctPenaltyWinners++;
    if (breakdown.details.correctUltimateWinner) correctWinners++;
  }

  return {
    total,
    exactScores,
    correctMargins,
    correctResults,
    correctEtResults,
    correctPenaltyWinners,
    correctWinners,
    matchBreakdowns,
  };
}

/**
 * Get maximum possible points for a match scenario
 */
export function getMaxPoints(scenario: '90min' | 'et' | 'penalties'): number {
  switch (scenario) {
    case '90min':
      return 6; // 5 exact + 1 winner
    case 'et':
      return 9; // 5 exact + 3 ET + 1 winner
    case 'penalties':
      return 11; // 5 exact + 3 ET + 2 pens + 1 winner
  }
}
