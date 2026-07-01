import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useTournament } from '@/context/TournamentContext'
import MatchPredictionCard from '@/components/MatchPredictionCard'
import { Match, Team, Prediction } from '@/lib/tournament-data'

// Mock the tournament context
jest.mock('@/context/TournamentContext')
jest.mock('@/lib/ai-predictor', () => ({
  predictMatch: jest.fn(() => ({
    homeWin: 60,
    draw: 25,
    awayWin: 15,
    expectedHomeGoals: 2.1,
    expectedAwayGoals: 0.8,
    confidence: 'high',
    insight: 'Brazil has a strong advantage'
  }))
}))

const mockUseTournament = useTournament as jest.MockedFunction<typeof useTournament>

const mockTeam: Team = {
  id: 'team1',
  name: 'Brazil',
  flag: '🇧🇷',
  group: 'G',
  strength: 91,
  fifaRanking: 5
}

const mockMatch: Match = {
  id: 'match1',
  homeTeam: mockTeam,
  awayTeam: { ...mockTeam, id: 'team2', name: 'Argentina', flag: '🇦🇷' },
  stage: 'r16',
  matchNumber: 1,
  scheduledDate: '2026-06-28'
}

describe('MatchPredictionCard', () => {
  const mockSetPrediction = jest.fn()
  const mockPredictions: Prediction[] = []

  beforeEach(() => {
    mockSetPrediction.mockClear()
    mockUseTournament.mockReturnValue({
      setPrediction: mockSetPrediction,
      predictions: mockPredictions,
      clearPredictions: jest.fn(),
      getPredictionScore: jest.fn(),
      getLeaderboard: jest.fn(),
      addUser: jest.fn(),
      getCurrentUser: jest.fn(),
      updatePrediction: jest.fn(),
      deletePrediction: jest.fn(),
      exportPredictions: jest.fn(),
      importPredictions: jest.fn(),
    } as any)
  })

  it('renders match teams correctly', () => {
    render(<MatchPredictionCard match={mockMatch} />)
    
    expect(screen.getByText('Brazil')).toBeInTheDocument()
    expect(screen.getByText('Argentina')).toBeInTheDocument()
    expect(screen.getByText('🇧🇷')).toBeInTheDocument()
    expect(screen.getByText('🇦🇷')).toBeInTheDocument()
  })

  it('displays score controls', () => {
    render(<MatchPredictionCard match={mockMatch} />)
    
    // Should have increment and decrement buttons
    const incrementButtons = screen.getAllByText('+')
    const decrementButtons = screen.getAllByText('−')
    
    expect(incrementButtons.length).toBe(2)
    expect(decrementButtons.length).toBe(2)
  })

  it('handles score changes correctly', async () => {
    const user = userEvent.setup()
    render(<MatchPredictionCard match={mockMatch} />)
    
    // Find the increment buttons for home and away scores
    const homeIncrementButton = screen.getAllByText('+')[0]
    const awayIncrementButton = screen.getAllByText('+')[1]
    
    await user.click(homeIncrementButton)
    await user.click(awayIncrementButton)
    
    expect(mockSetPrediction).toHaveBeenCalledWith('match1', 1, 0)
    expect(mockSetPrediction).toHaveBeenCalledWith('match1', 1, 1)
  })

  it('loads existing prediction', () => {
    const existingPrediction = { matchId: 'match1', homeScore: 3, awayScore: 1, predictedWinner: 'team1' }
    mockUseTournament.mockReturnValue({
      ...mockUseTournament(),
      predictions: [existingPrediction]
    } as any)

    render(<MatchPredictionCard match={mockMatch} />)
    
    // Check if the score displays show the existing values
    const scoreDisplays = screen.getAllByText('3')
    expect(scoreDisplays.length).toBeGreaterThan(0)
  })

  it('validates score input range', async () => {
    const user = userEvent.setup()
    render(<MatchPredictionCard match={mockMatch} />)
    
    // Find the decrement button for home score (should be disabled at 0)
    const homeDecrementButton = screen.getAllByText('−')[0]
    
    // At score 0, decrement should be disabled
    expect(homeDecrementButton).toBeDisabled()
    
    // Increment to test upper limit
    const homeIncrementButton = screen.getAllByText('+')[0]
    
    // Click many times to test upper limit (20)
    for (let i = 0; i < 25; i++) {
      await user.click(homeIncrementButton)
    }
    
    // Should be clamped to 20
    expect(mockSetPrediction).toHaveBeenLastCalledWith('match1', 20, 0)
  })

  it('shows AI prediction toggle', () => {
    render(<MatchPredictionCard match={mockMatch} />)
    
    expect(screen.getByText('AI')).toBeInTheDocument()
  })

  it('toggles AI prediction visibility', async () => {
    const user = userEvent.setup()
    render(<MatchPredictionCard match={mockMatch} />)
    
    const toggleButton = screen.getByText('AI')
    
    await user.click(toggleButton)
    
    // Check if AI prediction section is visible
    expect(screen.getByText(/confidence/i)).toBeInTheDocument()
  })

  it('handles TBD teams gracefully', () => {
    const TBDMatch: Match = {
      ...mockMatch,
      homeTeam: null,
      awayTeam: null
    }

    render(<MatchPredictionCard match={TBDMatch} />)
    
    expect(screen.getByText('TBD vs TBD')).toBeInTheDocument()
  })
})
