import React from 'react';
import { render, screen } from '@testing-library/react';
import { FootballDataScores } from '@/components/FootballDataScores';

// Mock state variables
let mockHookState = {
  matches: [] as unknown[],
  loading: false,
  error: null as string | null,
};

jest.mock('@/hooks/useFootballData', () => ({
  useFootballData: () => ({
    ...mockHookState,
    fetchLiveMatches: jest.fn(),
    fetchTodayMatches: jest.fn(),
    fetchUpcomingMatches: jest.fn(),
  }),
}));

jest.mock('@/hooks/useOpenFootball', () => ({
  useOpenFootball: () => ({
    getMatchDetails: jest.fn().mockReturnValue(null),
  }),
}));

describe('FootballDataScores', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHookState = {
      matches: [],
      loading: false,
      error: null,
    };
  });

  it('renders loading state', () => {
    mockHookState.loading = true;

    render(<FootballDataScores />);
    expect(screen.getByText('World Cup 2026 Scores')).toBeInTheDocument();
  });

  it('renders error state', () => {
    mockHookState.error = 'Failed to fetch';

    render(<FootballDataScores />);
    expect(screen.getByText('Unable to load scores')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
  });

  it('renders empty state when no matches', () => {
    render(<FootballDataScores />);
    expect(screen.getByText('No upcoming World Cup matches found')).toBeInTheDocument();
  });

  it('renders matches when available', () => {
    mockHookState.matches = [
      {
        id: 1,
        homeTeam: { name: 'Argentina', tla: 'ARG' },
        awayTeam: { name: 'Brazil', tla: 'BRA' },
        formattedScore: '2-1',
        formattedTime: '15:00',
        isLive: false,
        isFinished: true,
        status: 'FINISHED',
        utcDate: '2026-07-01T15:00:00Z',
      },
    ];

    render(<FootballDataScores />);
    expect(screen.getByText('Argentina')).toBeInTheDocument();
    expect(screen.getByText('Brazil')).toBeInTheDocument();
    expect(screen.getByText('2-1')).toBeInTheDocument();
  });

  it('renders live match with LIVE badge', () => {
    mockHookState.matches = [
      {
        id: 1,
        homeTeam: { name: 'Germany', tla: 'GER' },
        awayTeam: { name: 'France', tla: 'FRA' },
        formattedScore: '1-1',
        formattedTime: '45\'',
        isLive: true,
        isFinished: false,
        status: 'IN_PLAY',
        utcDate: '2026-07-01T15:00:00Z',
      },
    ];

    render(<FootballDataScores />);
    expect(screen.getAllByText('LIVE').length).toBeGreaterThan(0);
  });

  it('renders finished match with FT badge', () => {
    mockHookState.matches = [
      {
        id: 1,
        homeTeam: { name: 'Spain', tla: 'ESP' },
        awayTeam: { name: 'Italy', tla: 'ITA' },
        formattedScore: '3-0',
        formattedTime: '20:00',
        isLive: false,
        isFinished: true,
        status: 'FINISHED',
        utcDate: '2026-07-01T20:00:00Z',
      },
    ];

    render(<FootballDataScores />);
    expect(screen.getByText('FT')).toBeInTheDocument();
  });
});
