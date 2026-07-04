import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuthButton } from '@/components/AuthButton';

// Mock the TournamentContextSupabase
const mockUseTournamentSupabase = jest.fn();

jest.mock('@/context/TournamentContextSupabase', () => ({
  useTournamentSupabase: () => mockUseTournamentSupabase(),
}));

describe('AuthButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    mockUseTournamentSupabase.mockReturnValue({
      currentUser: null,
      isAuthenticated: false,
      isLoading: true,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    });

    render(<AuthButton />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders authenticated user with sign out button', () => {
    mockUseTournamentSupabase.mockReturnValue({
      currentUser: { userName: 'TestUser', avatar: '⚽' },
      isAuthenticated: true,
      isLoading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    });

    render(<AuthButton />);
    expect(screen.getByText('TestUser')).toBeInTheDocument();
    expect(screen.getByText('⚽')).toBeInTheDocument();
  });

  it('renders sign in button when not authenticated', () => {
    mockUseTournamentSupabase.mockReturnValue({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    });

    render(<AuthButton />);
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });
});
