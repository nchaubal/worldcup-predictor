export type Team = {
  id: string;
  name: string;
  flag: string;
  group: string;
  strength: number; // 1-100, used for AI predictions
  fifaRanking: number;
  eliminated?: boolean;
  groupFinish?: 1 | 2 | 3; // 1=winner, 2=runner-up, 3=best third
};

export type Match = {
  id: string;
  homeTeam: Team | null;
  awayTeam: Team | null;
  stage: "group" | "r16" | "qf" | "sf" | "final" | "third";
  group?: string;
  matchNumber: number;
  scheduledDate: string;
};

export type Prediction = {
  matchId: string;
  homeScore: number;
  awayScore: number;
  predictedWinner: string | null;
};

export type UserPredictions = {
  userId: string;
  userName: string;
  avatar: string;
  predictions: Prediction[];
  totalPoints: number;
};

export type League = {
  id: string;
  name: string;
  code: string;
  members: UserPredictions[];
  createdBy: string;
};

// ── Real FIFA World Cup 2026 data ──────────────────────────────────────────
// Group stage concluded June 27, 2026. Round of 32 began June 28.
// groupFinish: 1=Winner, 2=Runner-up, 3=Best third-place qualifier, eliminated=true if out

export const TEAMS: Team[] = [
  // Group A – Mexico 1st, South Africa 2nd (South Korea & Czechia eliminated)
  { id: "mex", name: "Mexico",       flag: "🇲🇽", group: "A", strength: 79, fifaRanking: 16, groupFinish: 1 },
  { id: "rsa", name: "South Africa", flag: "🇿🇦", group: "A", strength: 60, fifaRanking: 65, groupFinish: 2 },
  { id: "kor", name: "South Korea",  flag: "🇰🇷", group: "A", strength: 68, fifaRanking: 22, eliminated: true },
  { id: "cze", name: "Czechia",      flag: "🇨🇿", group: "A", strength: 65, fifaRanking: 36, eliminated: true },

  // Group B – Switzerland 1st, Canada 2nd, Bosnia & Herzegovina 3rd (Qatar eliminated)
  { id: "sui", name: "Switzerland",        flag: "🇨🇭", group: "B", strength: 78, fifaRanking: 19, groupFinish: 1 },
  { id: "can", name: "Canada",             flag: "🇨🇦", group: "B", strength: 72, fifaRanking: 41, groupFinish: 2 },
  { id: "bih", name: "Bosnia & Herz.",     flag: "🇧🇦", group: "B", strength: 63, fifaRanking: 63, groupFinish: 3 },
  { id: "qat", name: "Qatar",              flag: "🇶🇦", group: "B", strength: 50, fifaRanking: 37, eliminated: true },

  // Group C – Brazil 1st, Morocco 2nd (Scotland & Haiti eliminated)
  { id: "bra", name: "Brazil",   flag: "🇧🇷", group: "C", strength: 91, fifaRanking: 5,  groupFinish: 1 },
  { id: "mar", name: "Morocco",  flag: "🇲🇦", group: "C", strength: 77, fifaRanking: 14, groupFinish: 2 },
  { id: "sco", name: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group: "C", strength: 61, fifaRanking: 39, eliminated: true },
  { id: "hai", name: "Haiti",    flag: "🇭🇹", group: "C", strength: 42, fifaRanking: 83, eliminated: true },

  // Group D – USA 1st, Australia 2nd, Paraguay 3rd (Türkiye eliminated)
  { id: "usa", name: "USA",       flag: "🇺🇸", group: "D", strength: 76, fifaRanking: 13, groupFinish: 1 },
  { id: "aus", name: "Australia", flag: "🇦🇺", group: "D", strength: 68, fifaRanking: 23, groupFinish: 2 },
  { id: "par", name: "Paraguay",  flag: "🇵🇾", group: "D", strength: 62, fifaRanking: 58, groupFinish: 3 },
  { id: "tur", name: "Türkiye",   flag: "🇹🇷", group: "D", strength: 67, fifaRanking: 27, eliminated: true },

  // Group E – Germany 1st, Ivory Coast 2nd, Ecuador 3rd (Curaçao eliminated)
  { id: "ger", name: "Germany",      flag: "🇩🇪", group: "E", strength: 87, fifaRanking: 12, groupFinish: 1 },
  { id: "civ", name: "Ivory Coast",  flag: "🇨🇮", group: "E", strength: 73, fifaRanking: 17, groupFinish: 2 },
  { id: "ecu", name: "Ecuador",      flag: "🇪🇨", group: "E", strength: 64, fifaRanking: 44, groupFinish: 3 },
  { id: "cur", name: "Curaçao",      flag: "🇨🇼", group: "E", strength: 38, fifaRanking: 85, eliminated: true },

  // Group F – Netherlands 1st, Japan 2nd, Sweden 3rd (Tunisia eliminated)
  { id: "ned", name: "Netherlands", flag: "🇳🇱", group: "F", strength: 85, fifaRanking: 8,  groupFinish: 1 },
  { id: "jpn", name: "Japan",        flag: "🇯🇵", group: "F", strength: 74, fifaRanking: 18, groupFinish: 2 },
  { id: "swe", name: "Sweden",       flag: "🇸🇪", group: "F", strength: 73, fifaRanking: 25, groupFinish: 3 },
  { id: "tun", name: "Tunisia",      flag: "🇹🇳", group: "F", strength: 55, fifaRanking: 30, eliminated: true },

  // Group G – Belgium 1st, Egypt 2nd (Iran & New Zealand eliminated)
  { id: "bel", name: "Belgium",     flag: "🇧🇪", group: "G", strength: 83, fifaRanking: 3,  groupFinish: 1 },
  { id: "egy", name: "Egypt",       flag: "🇪🇬", group: "G", strength: 66, fifaRanking: 34, groupFinish: 2 },
  { id: "ira", name: "Iran",        flag: "🇮🇷", group: "G", strength: 57, fifaRanking: 20, eliminated: true },
  { id: "nzl", name: "New Zealand", flag: "🇳🇿", group: "G", strength: 44, fifaRanking: 95, eliminated: true },

  // Group H – Spain 1st, Cape Verde 2nd (Uruguay & Saudi Arabia eliminated)
  { id: "esp", name: "Spain",       flag: "🇪🇸", group: "H", strength: 90, fifaRanking: 7,  groupFinish: 1 },
  { id: "cpv", name: "Cape Verde",  flag: "🇨🇻", group: "H", strength: 59, fifaRanking: 71, groupFinish: 2 },
  { id: "uru", name: "Uruguay",     flag: "🇺🇾", group: "H", strength: 76, fifaRanking: 11, eliminated: true },
  { id: "ksa", name: "Saudi Arabia",flag: "🇸🇦", group: "H", strength: 52, fifaRanking: 51, eliminated: true },

  // Group I – France 1st, Norway 2nd, Senegal 3rd (Iraq eliminated)
  { id: "fra", name: "France",   flag: "🇫🇷", group: "I", strength: 94, fifaRanking: 2,  groupFinish: 1 },
  { id: "nor", name: "Norway",   flag: "🇳🇴", group: "I", strength: 80, fifaRanking: 28, groupFinish: 2 },
  { id: "sen", name: "Senegal",  flag: "🇸🇳", group: "I", strength: 69, fifaRanking: 20, groupFinish: 3 },
  { id: "irq", name: "Iraq",     flag: "🇮🇶", group: "I", strength: 45, fifaRanking: 68, eliminated: true },

  // Group J – Argentina 1st, Austria 2nd, Algeria 3rd (Jordan eliminated)
  { id: "arg", name: "Argentina", flag: "🇦🇷", group: "J", strength: 93, fifaRanking: 1,  groupFinish: 1 },
  { id: "aut", name: "Austria",   flag: "🇦🇹", group: "J", strength: 71, fifaRanking: 26, groupFinish: 2 },
  { id: "alg", name: "Algeria",   flag: "🇩🇿", group: "J", strength: 66, fifaRanking: 33, groupFinish: 3 },
  { id: "jor", name: "Jordan",    flag: "🇯🇴", group: "J", strength: 47, fifaRanking: 74, eliminated: true },

  // Group K – Colombia 1st, Portugal 2nd, DR Congo 3rd (Uzbekistan eliminated)
  { id: "col", name: "Colombia", flag: "🇨🇴", group: "K", strength: 79, fifaRanking: 9,  groupFinish: 1 },
  { id: "por", name: "Portugal", flag: "🇵🇹", group: "K", strength: 88, fifaRanking: 6,  groupFinish: 2 },
  { id: "cod", name: "DR Congo",  flag: "🇨🇩", group: "K", strength: 57, fifaRanking: 55, groupFinish: 3 },
  { id: "uzb", name: "Uzbekistan",flag: "🇺🇿", group: "K", strength: 43, fifaRanking: 77, eliminated: true },

  // Group L – England 1st, Croatia 2nd, Ghana 3rd (Panama eliminated)
  { id: "eng", name: "England",  flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "L", strength: 86, fifaRanking: 4,  groupFinish: 1 },
  { id: "cro", name: "Croatia",  flag: "🇭🇷", group: "L", strength: 79, fifaRanking: 10, groupFinish: 2 },
  { id: "gha", name: "Ghana",    flag: "🇬🇭", group: "L", strength: 62, fifaRanking: 59, groupFinish: 3 },
  { id: "pan", name: "Panama",   flag: "🇵🇦", group: "L", strength: 46, fifaRanking: 72, eliminated: true },
];

export const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

export function getTeamsByGroup(group: string): Team[] {
  return TEAMS.filter((t) => t.group === group);
}

export function getTeamById(id: string): Team | undefined {
  return TEAMS.find((t) => t.id === id);
}

// Group stage is complete – scores are historical results
export type GroupResult = {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  date: string;
};

// Final group stage standings
export type GroupStanding = {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
};

export const GROUP_STANDINGS: Record<string, GroupStanding[]> = {
  A: [
    { teamId: "mex", played: 3, won: 3, drawn: 0, lost: 0, gf: 9, ga: 3, gd: 6,  points: 9 },
    { teamId: "rsa", played: 3, won: 1, drawn: 1, lost: 1, gf: 3, ga: 4, gd: -1, points: 4 },
    { teamId: "kor", played: 3, won: 1, drawn: 0, lost: 2, gf: 3, ga: 4, gd: -1, points: 3 },
    { teamId: "cze", played: 3, won: 0, drawn: 1, lost: 2, gf: 2, ga: 6, gd: -4, points: 1 },
  ],
  B: [
    { teamId: "sui", played: 3, won: 2, drawn: 1, lost: 0, gf: 6, ga: 2, gd: 4,  points: 7 },
    { teamId: "can", played: 3, won: 1, drawn: 1, lost: 1, gf: 6, ga: 1, gd: 5,  points: 4 },
    { teamId: "bih", played: 3, won: 1, drawn: 1, lost: 1, gf: 3, ga: 4, gd: -1, points: 4 },
    { teamId: "qat", played: 3, won: 0, drawn: 1, lost: 2, gf: 1, ga: 9, gd: -8, points: 1 },
  ],
  C: [
    { teamId: "bra", played: 3, won: 2, drawn: 1, lost: 0, gf: 8, ga: 2, gd: 6,  points: 7 },
    { teamId: "mar", played: 3, won: 2, drawn: 1, lost: 0, gf: 5, ga: 2, gd: 3,  points: 7 },
    { teamId: "sco", played: 3, won: 1, drawn: 0, lost: 2, gf: 3, ga: 6, gd: -3, points: 3 },
    { teamId: "hai", played: 3, won: 0, drawn: 0, lost: 3, gf: 0, ga: 6, gd: -6, points: 0 },
  ],
  D: [
    { teamId: "usa", played: 3, won: 2, drawn: 0, lost: 1, gf: 5, ga: 1, gd: 4,  points: 6 },
    { teamId: "aus", played: 3, won: 1, drawn: 1, lost: 1, gf: 3, ga: 3, gd: 0,  points: 4 },
    { teamId: "par", played: 3, won: 1, drawn: 1, lost: 1, gf: 2, ga: 4, gd: -2, points: 4 },
    { teamId: "tur", played: 3, won: 1, drawn: 0, lost: 2, gf: 2, ga: 4, gd: -2, points: 3 },
  ],
  E: [
    { teamId: "ger", played: 3, won: 2, drawn: 0, lost: 1, gf: 8, ga: 2, gd: 6,  points: 6 },
    { teamId: "civ", played: 3, won: 2, drawn: 0, lost: 1, gf: 5, ga: 3, gd: 2,  points: 6 },
    { teamId: "ecu", played: 3, won: 1, drawn: 1, lost: 1, gf: 3, ga: 3, gd: 0,  points: 4 },
    { teamId: "cur", played: 3, won: 0, drawn: 1, lost: 2, gf: 1, ga: 9, gd: -8, points: 1 },
  ],
  F: [
    { teamId: "ned", played: 3, won: 2, drawn: 1, lost: 0, gf: 7, ga: 1, gd: 6,  points: 7 },
    { teamId: "jpn", played: 3, won: 1, drawn: 2, lost: 0, gf: 5, ga: 1, gd: 4,  points: 5 },
    { teamId: "swe", played: 3, won: 1, drawn: 1, lost: 1, gf: 3, ga: 3, gd: 0,  points: 4 },
    { teamId: "tun", played: 3, won: 0, drawn: 0, lost: 3, gf: 0, ga: 10,gd:-10, points: 0 },
  ],
  G: [
    { teamId: "bel", played: 3, won: 1, drawn: 2, lost: 0, gf: 5, ga: 2, gd: 3,  points: 5 },
    { teamId: "egy", played: 3, won: 1, drawn: 2, lost: 0, gf: 4, ga: 2, gd: 2,  points: 5 },
    { teamId: "ira", played: 3, won: 1, drawn: 0, lost: 2, gf: 2, ga: 2, gd: 0,  points: 3 },
    { teamId: "nzl", played: 3, won: 0, drawn: 0, lost: 3, gf: 1, ga: 6, gd: -5, points: 1 },
  ],
  H: [
    { teamId: "esp", played: 3, won: 2, drawn: 1, lost: 0, gf: 6, ga: 1, gd: 5,  points: 7 },
    { teamId: "cpv", played: 3, won: 1, drawn: 0, lost: 2, gf: 2, ga: 2, gd: 0,  points: 3 },
    { teamId: "uru", played: 3, won: 0, drawn: 2, lost: 1, gf: 2, ga: 3, gd: -1, points: 2 },
    { teamId: "ksa", played: 3, won: 0, drawn: 1, lost: 2, gf: 1, ga: 5, gd: -4, points: 1 },
  ],
  I: [
    { teamId: "fra", played: 3, won: 3, drawn: 0, lost: 0, gf: 11,ga: 3, gd: 8,  points: 9 },
    { teamId: "nor", played: 3, won: 2, drawn: 0, lost: 1, gf: 4, ga: 3, gd: 1,  points: 6 },
    { teamId: "sen", played: 3, won: 0, drawn: 0, lost: 3, gf: 1, ga: 4, gd: -3, points: 0 },
    { teamId: "irq", played: 3, won: 0, drawn: 0, lost: 3, gf: 1, ga: 7, gd: -6, points: 0 },
  ],
  J: [
    { teamId: "arg", played: 3, won: 3, drawn: 0, lost: 0, gf: 9, ga: 2, gd: 7,  points: 9 },
    { teamId: "aut", played: 3, won: 1, drawn: 1, lost: 1, gf: 3, ga: 3, gd: 0,  points: 4 },
    { teamId: "alg", played: 3, won: 1, drawn: 1, lost: 1, gf: 2, ga: 4, gd: -2, points: 4 },
    { teamId: "jor", played: 3, won: 0, drawn: 0, lost: 3, gf: 1, ga: 6, gd: -5, points: 0 },
  ],
  K: [
    { teamId: "col", played: 3, won: 2, drawn: 0, lost: 1, gf: 5, ga: 2, gd: 3,  points: 6 },
    { teamId: "por", played: 3, won: 1, drawn: 1, lost: 1, gf: 7, ga: 2, gd: 5,  points: 4 },
    { teamId: "cod", played: 3, won: 1, drawn: 1, lost: 1, gf: 4, ga: 3, gd: 1,  points: 4 },
    { teamId: "uzb", played: 3, won: 0, drawn: 0, lost: 3, gf: 0, ga: 7, gd: -7, points: 0 },
  ],
  L: [
    { teamId: "eng", played: 3, won: 2, drawn: 1, lost: 0, gf: 5, ga: 1, gd: 4,  points: 7 },
    { teamId: "cro", played: 3, won: 2, drawn: 0, lost: 1, gf: 4, ga: 4, gd: 0,  points: 6 },
    { teamId: "gha", played: 3, won: 1, drawn: 1, lost: 1, gf: 3, ga: 3, gd: 0,  points: 4 },
    { teamId: "pan", played: 3, won: 0, drawn: 0, lost: 3, gf: 0, ga: 4, gd: -4, points: 0 },
  ],
};

// Round of 32 – real fixtures. Results marked where played (as of June 30 2026)
export type R32Match = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  venue: string;
  homeScore?: number;
  awayScore?: number;
  pens?: string;   // e.g. "3-2" if decided by penalties
  winner?: string; // teamId of winner
  status: "completed" | "live" | "upcoming";
};

export const R32_MATCHES: R32Match[] = [
  // Played
  { id: "r32_1",  homeTeamId: "rsa", awayTeamId: "can", date: "Sun Jun 28", venue: "Los Angeles",  homeScore: 0, awayScore: 1, winner: "can", status: "completed" },
  { id: "r32_2",  homeTeamId: "ger", awayTeamId: "par", date: "Mon Jun 29", venue: "Foxborough",   homeScore: 1, awayScore: 1, pens: "3-4", winner: "par", status: "completed" },
  { id: "r32_3",  homeTeamId: "ned", awayTeamId: "mar", date: "Mon Jun 29", venue: "Guadalajara",  homeScore: 1, awayScore: 1, pens: "2-3", winner: "mar", status: "completed" },
  { id: "r32_4",  homeTeamId: "bra", awayTeamId: "jpn", date: "Mon Jun 29", venue: "Houston",      homeScore: 2, awayScore: 1, winner: "bra", status: "completed" },
  { id: "r32_5",  homeTeamId: "fra", awayTeamId: "swe", date: "Tue Jun 30", venue: "New Jersey",   homeScore: 3, awayScore: 0, winner: "fra", status: "completed" },
  { id: "r32_6",  homeTeamId: "civ", awayTeamId: "nor", date: "Tue Jun 30", venue: "Arlington",    homeScore: 1, awayScore: 2, winner: "nor", status: "completed" },
  // Today / Upcoming
  { id: "r32_7",  homeTeamId: "mex", awayTeamId: "ecu", date: "Wed Jul 1",  venue: "Mexico City",  homeScore: 2, awayScore: 0, winner: "mex", status: "completed" },
  { id: "r32_8",  homeTeamId: "eng", awayTeamId: "cod", date: "Wed Jul 1",  venue: "Atlanta",      status: "upcoming" },
  { id: "r32_9",  homeTeamId: "bel", awayTeamId: "sen", date: "Wed Jul 1",  venue: "Seattle",      status: "upcoming" },
  { id: "r32_10", homeTeamId: "usa", awayTeamId: "bih", date: "Thu Jul 2",  venue: "Santa Clara",  status: "upcoming" },
  { id: "r32_11", homeTeamId: "esp", awayTeamId: "aut", date: "Thu Jul 2",  venue: "Los Angeles",  status: "upcoming" },
  { id: "r32_12", homeTeamId: "por", awayTeamId: "cro", date: "Fri Jul 3",  venue: "Toronto",      status: "upcoming" },
  { id: "r32_13", homeTeamId: "sui", awayTeamId: "alg", date: "Fri Jul 3",  venue: "Vancouver",    status: "upcoming" },
  { id: "r32_14", homeTeamId: "aus", awayTeamId: "egy", date: "Fri Jul 3",  venue: "Arlington",    status: "upcoming" },
  { id: "r32_15", homeTeamId: "arg", awayTeamId: "cpv", date: "Fri Jul 3",  venue: "Miami",        status: "upcoming" },
  { id: "r32_16", homeTeamId: "col", awayTeamId: "gha", date: "Sat Jul 4",  venue: "Kansas City",  status: "upcoming" },
];

// Round of 16 fixtures (teams TBD based on R32 winners)
export const R16_MATCHES = [
  { id: "r16_1", label: "Canada vs Morocco",   date: "Sat Jul 4",  venue: "Houston" },
  { id: "r16_2", label: "Paraguay vs France",  date: "Sat Jul 4",  venue: "Philadelphia" },
  { id: "r16_3", label: "Brazil vs Norway",    date: "Sun Jul 5",  venue: "New Jersey" },
  { id: "r16_4", label: "Mexico/Ecuador vs England/DR Congo", date: "Mon Jul 6", venue: "Mexico City" },
  { id: "r16_5", label: "Portugal/Croatia vs Spain/Austria",  date: "Mon Jul 6", venue: "Arlington" },
  { id: "r16_6", label: "USA/Bosnia vs Belgium/Senegal",      date: "Tue Jul 7", venue: "Seattle" },
  { id: "r16_7", label: "Argentina/Cape Verde vs Australia/Egypt", date: "Tue Jul 7", venue: "Atlanta" },
  { id: "r16_8", label: "Switzerland/Algeria vs Colombia/Ghana",   date: "Tue Jul 7", venue: "Vancouver" },
];

// Legacy flat match list used by predict page (group stage only)
export const GROUP_MATCHES: Match[] = GROUPS.flatMap((grp) => {
  const t = TEAMS.filter((tm) => tm.group === grp);
  return [
    { id: `g${grp}1`, homeTeam: t[0], awayTeam: t[1], stage: "group", group: grp, matchNumber: 0, scheduledDate: "Completed" },
    { id: `g${grp}2`, homeTeam: t[2], awayTeam: t[3], stage: "group", group: grp, matchNumber: 0, scheduledDate: "Completed" },
    { id: `g${grp}3`, homeTeam: t[0], awayTeam: t[2], stage: "group", group: grp, matchNumber: 0, scheduledDate: "Completed" },
    { id: `g${grp}4`, homeTeam: t[1], awayTeam: t[3], stage: "group", group: grp, matchNumber: 0, scheduledDate: "Completed" },
    { id: `g${grp}5`, homeTeam: t[0], awayTeam: t[3], stage: "group", group: grp, matchNumber: 0, scheduledDate: "Completed" },
    { id: `g${grp}6`, homeTeam: t[1], awayTeam: t[2], stage: "group", group: grp, matchNumber: 0, scheduledDate: "Completed" },
  ] as Match[];
});

export const KNOCKOUT_MATCHES: Match[] = [
  { id: "qf_1", homeTeam: null, awayTeam: null, stage: "qf",    matchNumber: 57, scheduledDate: "2026-07-09" },
  { id: "qf_2", homeTeam: null, awayTeam: null, stage: "qf",    matchNumber: 58, scheduledDate: "2026-07-10" },
  { id: "qf_3", homeTeam: null, awayTeam: null, stage: "qf",    matchNumber: 59, scheduledDate: "2026-07-11" },
  { id: "qf_4", homeTeam: null, awayTeam: null, stage: "qf",    matchNumber: 60, scheduledDate: "2026-07-12" },
  { id: "sf_1", homeTeam: null, awayTeam: null, stage: "sf",    matchNumber: 61, scheduledDate: "2026-07-14" },
  { id: "sf_2", homeTeam: null, awayTeam: null, stage: "sf",    matchNumber: 62, scheduledDate: "2026-07-15" },
  { id: "final",homeTeam: null, awayTeam: null, stage: "final", matchNumber: 63, scheduledDate: "2026-07-19" },
];
