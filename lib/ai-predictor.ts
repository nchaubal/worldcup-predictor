import { Team } from "./tournament-data";

export type MatchProbability = {
  homeWin: number;
  draw: number;
  awayWin: number;
  expectedHomeGoals: number;
  expectedAwayGoals: number;
  confidence: "high" | "medium" | "low";
  insight: string;
};

export function predictMatch(homeTeam: Team, awayTeam: Team): MatchProbability {
  const strengthDiff = homeTeam.strength - awayTeam.strength;
  const homeAdvantage = 5;
  const adjustedDiff = strengthDiff + homeAdvantage;

  const rawHomeWin = Math.min(Math.max(50 + adjustedDiff * 0.8, 5), 90);
  const rawAwayWin = Math.min(Math.max(50 - adjustedDiff * 0.8, 5), 90);
  const drawBase = 100 - rawHomeWin - rawAwayWin;
  const drawChance = Math.max(drawBase * 0.6 + 10, 5);

  const total = rawHomeWin + rawAwayWin + drawChance;
  const homeWin = Math.round((rawHomeWin / total) * 100);
  const awayWin = Math.round((rawAwayWin / total) * 100);
  const draw = 100 - homeWin - awayWin;

  const _avgStrength = (homeTeam.strength + awayTeam.strength) / 2;
  const expectedHomeGoals = parseFloat((1.2 + (homeTeam.strength / 100) * 1.8 - (awayTeam.strength / 100) * 0.5).toFixed(1));
  const expectedAwayGoals = parseFloat((0.9 + (awayTeam.strength / 100) * 1.5 - (homeTeam.strength / 100) * 0.5).toFixed(1));

  const absDiff = Math.abs(strengthDiff);
  const confidence: "high" | "medium" | "low" = absDiff > 25 ? "high" : absDiff > 10 ? "medium" : "low";

  const rankDiff = awayTeam.fifaRanking - homeTeam.fifaRanking;
  let insight = "";
  if (homeWin > 60) {
    insight = `${homeTeam.name} are strong favorites (FIFA #${homeTeam.fifaRanking} vs #${awayTeam.fifaRanking})`;
  } else if (awayWin > 60) {
    insight = `${awayTeam.name} are strong favorites despite playing away`;
  } else if (draw > 35) {
    insight = `Evenly matched — a draw is very likely`;
  } else if (rankDiff < -10) {
    insight = `Potential upset alert: ${awayTeam.name} could surprise ${homeTeam.name}`;
  } else {
    insight = `Closely contested match — key battles all over the pitch`;
  }

  return { homeWin, draw, awayWin, expectedHomeGoals, expectedAwayGoals, confidence, insight };
}

export function calculatePoints(prediction: { homeScore: number; awayScore: number }, actual: { homeScore: number; awayScore: number }): number {
  // Exact score prediction: 5 points (increased from 3)
  if (prediction.homeScore === actual.homeScore && prediction.awayScore === actual.awayScore) {
    return 5;
  }
  
  // Check for correct win margin: 2 points
  const predMargin = prediction.homeScore - prediction.awayScore;
  const actualMargin = actual.homeScore - actual.awayScore;
  if (predMargin === actualMargin) {
    return 2;
  }
  
  // Correct result only: 1 point
  const predResult = Math.sign(prediction.homeScore - prediction.awayScore);
  const actualResult = Math.sign(actual.homeScore - actual.awayScore);
  if (predResult === actualResult) {
    return 1;
  }
  
  return 0;
}

export function calculatePointsWithBreakdown(prediction: { homeScore: number; awayScore: number }, actual: { homeScore: number; awayScore: number }): {
  totalPoints: number;
  breakdown: {
    exactScore: boolean;
    correctMargin: boolean;
    correctResult: boolean;
    points: number;
    reason: string;
  };
} {
  // Exact score prediction: 5 points
  if (prediction.homeScore === actual.homeScore && prediction.awayScore === actual.awayScore) {
    return {
      totalPoints: 5,
      breakdown: {
        exactScore: true,
        correctMargin: true,
        correctResult: true,
        points: 5,
        reason: "Exact score prediction"
      }
    };
  }
  
  // Check for correct win margin: 2 points
  const predMargin = prediction.homeScore - prediction.awayScore;
  const actualMargin = actual.homeScore - actual.awayScore;
  if (predMargin === actualMargin) {
    return {
      totalPoints: 2,
      breakdown: {
        exactScore: false,
        correctMargin: true,
        correctResult: true,
        points: 2,
        reason: "Correct win margin"
      }
    };
  }
  
  // Correct result only: 1 point
  const predResult = Math.sign(prediction.homeScore - prediction.awayScore);
  const actualResult = Math.sign(actual.homeScore - actual.awayScore);
  if (predResult === actualResult) {
    return {
      totalPoints: 1,
      breakdown: {
        exactScore: false,
        correctMargin: false,
        correctResult: true,
        points: 1,
        reason: "Correct result only"
      }
    };
  }
  
  // No points
  return {
    totalPoints: 0,
    breakdown: {
      exactScore: false,
      correctMargin: false,
      correctResult: false,
      points: 0,
      reason: "Incorrect prediction"
    }
  };
}
