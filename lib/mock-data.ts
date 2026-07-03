import { UserPredictions, League, Prediction } from './tournament-data';

// Mock user profiles with realistic data
export const MOCK_USERS: UserPredictions[] = [
  {
    userId: "user_alex",
    userName: "Alex Martinez",
    avatar: "🏆",
    predictions: [],
    totalPoints: 47,
  },
  {
    userId: "user_sarah",
    userName: "Sarah Chen", 
    avatar: "🎯",
    predictions: [],
    totalPoints: 38,
  },
  {
    userId: "user_marcus",
    userName: "Marcus Johnson",
    avatar: "⚽",
    predictions: [],
    totalPoints: 55,
  },
  {
    userId: "user_emily",
    userName: "Emily Rodriguez",
    avatar: "🌟",
    predictions: [],
    totalPoints: 29,
  },
  {
    userId: "user_david",
    userName: "David Kim",
    avatar: "🔥",
    predictions: [],
    totalPoints: 41,
  }
];

// Mock league
export const MOCK_LEAGUE: League = {
  id: "demo_league_2026",
  name: "World Cup 2026 Demo League",
  code: "DEMO26",
  members: MOCK_USERS,
  createdBy: "user_alex",
};

// Generate mock predictions for each user
export function generateMockPredictions(): { [userId: string]: Prediction[] } {
  const mockPredictions: { [userId: string]: Prediction[] } = {};
  
  // Mock some realistic predictions for different matches
  const basePredictions = [
    { matchId: "r32_1", homeScore: 2, awayScore: 1, predictedWinner: "mex" },
    { matchId: "r32_2", homeScore: 1, awayScore: 1, predictedWinner: "draw" },
    { matchId: "r32_3", homeScore: 3, awayScore: 0, predictedWinner: "arg" },
    { matchId: "r32_4", homeScore: 2, awayScore: 2, predictedWinner: "draw" },
    { matchId: "r32_5", homeScore: 1, awayScore: 0, predictedWinner: "fra" },
    { matchId: "r32_6", homeScore: 2, awayScore: 1, predictedWinner: "bra" },
    { matchId: "r32_7", homeScore: 1, awayScore: 2, predictedWinner: "eng" },
    { matchId: "r32_8", homeScore: 0, awayScore: 1, predictedWinner: "esp" },
  ];

  MOCK_USERS.forEach((user, _userIndex) => {
    mockPredictions[user.userId] = basePredictions.map((pred, _index) => ({
      ...pred,
      // Add some variation to make it realistic
      homeScore: pred.homeScore + Math.floor(Math.random() * 2) - 1,
      awayScore: pred.awayScore + Math.floor(Math.random() * 2) - 1,
      predictedWinner: Math.random() > 0.3 ? pred.predictedWinner : 
        Math.random() > 0.5 ? "draw" : 
        Math.random() > 0.5 ? "mex" : "usa"
    }));
  });

  return mockPredictions;
}

// Mock analytics data
export const MOCK_ANALYTICS = {
  totalPredictions: 156,
  averageAccuracy: 0.68,
  mostPredictedWinner: "Argentina",
  highestScoringUser: "Marcus Johnson",
  mostActiveDay: "2026-06-15",
  predictionDistribution: {
    correctExact: 23,
    correctResult: 45,
    incorrect: 88
  },
  teamPerformance: {
    "Argentina": { predictedWins: 12, actualWins: 10 },
    "Brazil": { predictedWins: 11, actualWins: 9 },
    "France": { predictedWins: 10, actualWins: 8 },
    "England": { predictedWins: 9, actualWins: 7 },
    "Spain": { predictedWins: 8, actualWins: 6 }
  }
};
