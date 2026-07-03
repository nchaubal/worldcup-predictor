// Match Events Component - Displays goal scorers and cards
import React from 'react';
import { GoalEvent, CardEvent } from '@/lib/football-data-sync';

interface MatchEventsProps {
  goals?: GoalEvent[];
  cards?: CardEvent[];
  homeTeamName?: string;
  awayTeamName?: string;
  compact?: boolean;
}

export const MatchEvents: React.FC<MatchEventsProps> = ({
  goals = [],
  cards = [],
  homeTeamName = 'Home',
  awayTeamName = 'Away',
  compact = false,
}) => {
  if (goals.length === 0 && cards.length === 0) {
    return null;
  }

  const homeGoals = goals.filter(g => g.team === 'home');
  const awayGoals = goals.filter(g => g.team === 'away');
  const homeCards = cards.filter(c => c.team === 'home');
  const awayCards = cards.filter(c => c.team === 'away');

  if (compact) {
    return (
      <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
        {homeGoals.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-emerald-400">⚽</span>
            <span>
              {homeGoals.map((g, i) => (
                <span key={i}>
                  {g.scorer} {g.minute}&apos;
                  {g.penalty && ' (P)'}
                  {g.ownGoal && ' (OG)'}
                  {i < homeGoals.length - 1 && ', '}
                </span>
              ))}
            </span>
          </div>
        )}
        {awayGoals.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-emerald-400">⚽</span>
            <span>
              {awayGoals.map((g, i) => (
                <span key={i}>
                  {g.scorer} {g.minute}&apos;
                  {g.penalty && ' (P)'}
                  {g.ownGoal && ' (OG)'}
                  {i < awayGoals.length - 1 && ', '}
                </span>
              ))}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-border/30 pt-3">
      <div className="grid grid-cols-2 gap-4 text-xs">
        {/* Home Team Events */}
        <div className="space-y-1">
          <p className="font-medium text-muted-foreground mb-2">{homeTeamName}</p>
          {homeGoals.map((goal, i) => (
            <div key={`goal-${i}`} className="flex items-center gap-2">
              <span className="text-emerald-400">⚽</span>
              <span>
                {goal.scorer} {goal.minute}&apos;
                {goal.penalty && <span className="text-muted-foreground ml-1">(pen)</span>}
                {goal.ownGoal && <span className="text-red-400 ml-1">(og)</span>}
              </span>
            </div>
          ))}
          {homeCards.map((card, i) => (
            <div key={`card-${i}`} className="flex items-center gap-2">
              <span className={card.type === 'red' ? 'text-red-500' : 'text-yellow-400'}>
                {card.type === 'red' ? '🟥' : card.type === 'yellowred' ? '🟨🟥' : '🟨'}
              </span>
              <span>
                {card.player} {card.minute}&apos;
              </span>
            </div>
          ))}
          {homeGoals.length === 0 && homeCards.length === 0 && (
            <p className="text-muted-foreground/50 italic">No events</p>
          )}
        </div>

        {/* Away Team Events */}
        <div className="space-y-1">
          <p className="font-medium text-muted-foreground mb-2">{awayTeamName}</p>
          {awayGoals.map((goal, i) => (
            <div key={`goal-${i}`} className="flex items-center gap-2">
              <span className="text-emerald-400">⚽</span>
              <span>
                {goal.scorer} {goal.minute}&apos;
                {goal.penalty && <span className="text-muted-foreground ml-1">(pen)</span>}
                {goal.ownGoal && <span className="text-red-400 ml-1">(og)</span>}
              </span>
            </div>
          ))}
          {awayCards.map((card, i) => (
            <div key={`card-${i}`} className="flex items-center gap-2">
              <span className={card.type === 'red' ? 'text-red-500' : 'text-yellow-400'}>
                {card.type === 'red' ? '🟥' : card.type === 'yellowred' ? '🟨🟥' : '🟨'}
              </span>
              <span>
                {card.player} {card.minute}&apos;
              </span>
            </div>
          ))}
          {awayGoals.length === 0 && awayCards.length === 0 && (
            <p className="text-muted-foreground/50 italic">No events</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Compact goal scorers display for match cards
export const GoalScorers: React.FC<{ goals?: GoalEvent[] }> = ({ goals = [] }) => {
  if (goals.length === 0) return null;

  const homeGoals = goals.filter(g => g.team === 'home');
  const awayGoals = goals.filter(g => g.team === 'away');

  return (
    <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-1">
      <div className="text-left max-w-[45%] truncate">
        {homeGoals.map((g, i) => (
          <span key={i}>
            {g.scorer} {g.minute}&apos;
            {g.penalty && '(P)'}
            {g.ownGoal && '(OG)'}
            {i < homeGoals.length - 1 && ', '}
          </span>
        ))}
      </div>
      <div className="text-right max-w-[45%] truncate">
        {awayGoals.map((g, i) => (
          <span key={i}>
            {g.scorer} {g.minute}&apos;
            {g.penalty && '(P)'}
            {g.ownGoal && '(OG)'}
            {i < awayGoals.length - 1 && ', '}
          </span>
        ))}
      </div>
    </div>
  );
};
