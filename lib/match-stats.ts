import { Team } from "./tournament-data";

export type MatchStatRow = {
  label: string;
  home: number;
  away: number;
  suffix?: string; // e.g. "%"
};

export type Scorer = { name: string; minute: number; ownGoal?: boolean };

export type PenaltyKick = { team: "home" | "away"; name: string; scored: boolean };

export type MatchBoxScore = {
  stats: MatchStatRow[];
  homeScorers: Scorer[];
  awayScorers: Scorer[];
  penaltyKicks: PenaltyKick[];
};

// No provider in this app exposes real shot/possession/card data (football-data.org's
// free tier only gives final scores), so match boxscores are generated deterministically
// from team strength - same match always renders the same stats, but they're synthetic.
function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return () => {
    h = Math.imul(h ^ (h >>> 15), h | 1);
    h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
    return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
  };
}

// Fixed full-name pairs (not independently-shuffled first/last pools) so
// generated scorers don't mix unrelated naming conventions.
const PLAYER_NAMES = [
  "Mohamed Salah", "Mohamed Hany", "Emam Ashour", "Luka Modric", "Ivan Perisic",
  "Kylian Mbappe", "Antoine Griezmann", "Bukayo Saka", "Harry Kane", "Lautaro Martinez",
  "Julian Alvarez", "Jamal Musiala", "Kai Havertz", "Pedri Fati", "Alvaro Morata",
  "Vinicius Junior", "Rodrygo Goes", "Cody Gakpo", "Memphis Depay", "Victor Osimhen",
  "Achraf Hakimi", "Hakim Ziyech", "Sofyan Amrabat", "Randal Kolo Muani", "Romelu Lukaku",
  "Takefusa Kubo", "Kaoru Mitoma", "Son Heung-min", "Hwang Hee-chan", "Christian Pulisic",
  "Rasmus Hojlund", "Alexander Isak", "Erling Haaland",
];

function pickName(rng: () => number): string {
  return PLAYER_NAMES[Math.floor(rng() * PLAYER_NAMES.length)];
}

function generateScorers(rng: () => number, goals: number): Scorer[] {
  const minutes = new Set<number>();
  while (minutes.size < goals) {
    minutes.add(1 + Math.floor(rng() * 90));
  }
  return Array.from(minutes)
    .sort((a, b) => a - b)
    .map((minute) => ({
      name: pickName(rng),
      minute,
      ownGoal: rng() < 0.06,
    }));
}

// Builds a full kick-by-kick shootout that lands on the recorded aggregate
// score (e.g. "3-4"), rather than just displaying the final tally. Not a
// faithful "stops as soon as decided" simulation - deterministic flavor data.
function shuffle<T>(rng: () => number, arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function generatePenaltyShootout(rng: () => number, pens: string): PenaltyKick[] {
  const [homeGoals, awayGoals] = pens.split("-").map((n) => parseInt(n, 10) || 0);
  const rounds = Math.max(5, homeGoals, awayGoals);

  const homeOutcomes = shuffle(
    rng,
    Array.from({ length: rounds }, (_, i) => i < homeGoals)
  );
  const awayOutcomes = shuffle(
    rng,
    Array.from({ length: rounds }, (_, i) => i < awayGoals)
  );

  const kicks: PenaltyKick[] = [];
  for (let i = 0; i < rounds; i++) {
    kicks.push({ team: "home", name: pickName(rng), scored: homeOutcomes[i] });
    kicks.push({ team: "away", name: pickName(rng), scored: awayOutcomes[i] });
  }
  return kicks;
}

function statPair(rng: () => number, base: number, spread: number, homeBias: number, min = 0) {
  const home = Math.max(min, Math.round(base + (rng() - 0.5) * spread + homeBias));
  const away = Math.max(min, Math.round(base + (rng() - 0.5) * spread - homeBias));
  return { home, away };
}

export function generateMatchStats(
  matchId: string,
  homeTeam: Team,
  awayTeam: Team,
  homeScore: number,
  awayScore: number,
  pens?: string
): MatchBoxScore {
  const rng = seededRandom(matchId);
  const strengthDiff = homeTeam.strength - awayTeam.strength;
  const homeBias = strengthDiff / 8; // stronger team trends toward more shots/possession

  const possessionHome = Math.min(72, Math.max(28, Math.round(50 + strengthDiff / 4 + (rng() - 0.5) * 10)));

  const shotsOnTargetMin = { home: Math.max(homeScore, 1), away: Math.max(awayScore, 1) };
  const shotsOnTarget = statPair(rng, 5 + homeScore + awayScore, 4, homeBias, 1);
  shotsOnTarget.home = Math.max(shotsOnTarget.home, shotsOnTargetMin.home);
  shotsOnTarget.away = Math.max(shotsOnTarget.away, shotsOnTargetMin.away);

  const shots = statPair(rng, shotsOnTarget.home + shotsOnTarget.away + 6, 6, homeBias * 1.3, 1);
  shots.home = Math.max(shots.home, shotsOnTarget.home);
  shots.away = Math.max(shots.away, shotsOnTarget.away);

  const passesHome = 350 + Math.round(possessionHome * 4.5);
  const passesAway = 350 + Math.round((100 - possessionHome) * 4.5);
  const passAccuracy = statPair(rng, 82, 8, homeBias * 0.5, 60);

  const stats: MatchStatRow[] = [
    { label: "Possession", home: possessionHome, away: 100 - possessionHome, suffix: "%" },
    { label: "Shots", ...shots },
    { label: "Shots on Target", ...shotsOnTarget },
    { label: "Passes", home: passesHome, away: passesAway },
    { label: "Pass Accuracy", ...passAccuracy, suffix: "%" },
    { label: "Corners", ...statPair(rng, 5, 4, homeBias * 0.6, 0) },
    { label: "Fouls", ...statPair(rng, 11, 5, -homeBias * 0.4, 0) },
    { label: "Offsides", ...statPair(rng, 2, 2, homeBias * 0.3, 0) },
    { label: "Yellow Cards", ...statPair(rng, 2, 2, -homeBias * 0.2, 0) },
    { label: "Red Cards", home: rng() < 0.06 ? 1 : 0, away: rng() < 0.06 ? 1 : 0 },
  ];

  return {
    stats,
    homeScorers: generateScorers(rng, homeScore),
    awayScorers: generateScorers(rng, awayScore),
    penaltyKicks: pens ? generatePenaltyShootout(rng, pens) : [],
  };
}
