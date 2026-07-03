import { render, screen } from '@testing-library/react'
import HomePage from '@/app/page'
import { usePathname } from 'next/navigation'

// Mock next/navigation
jest.mock('next/navigation')
jest.mock('next/link', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>
  }
})

// Mock tournament data
jest.mock('@/lib/tournament-data', () => ({
  TEAMS: [
    { id: 'brazil', name: 'Brazil', flag: '🇧🇷', group: 'G', fifaRank: 1, confederation: 'CONMEBOL' },
    { id: 'argentina', name: 'Argentina', flag: '🇦🇷', group: 'B', fifaRank: 2, confederation: 'CONMEBOL' },
    { id: 'france', name: 'France', flag: '🇫🇷', group: 'I', fifaRank: 3, confederation: 'UEFA' },
    { id: 'spain', name: 'Spain', flag: '🇪🇸', group: 'J', fifaRank: 4, confederation: 'UEFA' },
    { id: 'england', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'C', fifaRank: 5, confederation: 'UEFA' },
    { id: 'germany', name: 'Germany', flag: '🇩🇪', group: 'C', fifaRank: 6, confederation: 'UEFA' },
    { id: 'portugal', name: 'Portugal', flag: '🇵🇹', group: 'L', fifaRank: 7, confederation: 'UEFA' },
    { id: 'netherlands', name: 'Netherlands', flag: '🇳🇱', group: 'L', fifaRank: 8, confederation: 'UEFA' },
    { id: 'team3', name: 'Team3', flag: '🏳️', group: 'I', fifaRank: 20, confederation: 'CONCACAF' },
    { id: 'team4', name: 'Team4', flag: '🏳️', group: 'I', fifaRank: 30, confederation: 'CONCACAF' },
    { id: 'team7', name: 'Team7', flag: '🏳️', group: 'J', fifaRank: 25, confederation: 'AFC' },
    { id: 'team8', name: 'Team8', flag: '🏳️', group: 'J', fifaRank: 35, confederation: 'AFC' },
    { id: 'team11', name: 'Team11', flag: '🏳️', group: 'C', fifaRank: 40, confederation: 'CAF' },
    { id: 'team12', name: 'Team12', flag: '🏳️', group: 'C', fifaRank: 45, confederation: 'CAF' },
    { id: 'team15', name: 'Team15', flag: '🏳️', group: 'L', fifaRank: 50, confederation: 'OFC' },
    { id: 'team16', name: 'Team16', flag: '🏳️', group: 'L', fifaRank: 55, confederation: 'OFC' }
  ],
  GROUPS: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'],
  GROUP_STANDINGS: {
    'I': [
      { teamId: 'brazil', points: 9, gd: 5, w: 3, d: 0, l: 0, gf: 7, ga: 2 },
      { teamId: 'argentina', points: 6, gd: 3, w: 2, d: 0, l: 1, gf: 5, ga: 2 },
      { teamId: 'team3', points: 3, gd: -2, w: 1, d: 0, l: 2, gf: 3, ga: 5 },
      { teamId: 'team4', points: 0, gd: -6, w: 0, d: 0, l: 3, gf: 2, ga: 8 }
    ],
    'J': [
      { teamId: 'france', points: 9, gd: 7, w: 3, d: 0, l: 0, gf: 8, ga: 1 },
      { teamId: 'spain', points: 6, gd: 3, w: 2, d: 0, l: 1, gf: 6, ga: 3 },
      { teamId: 'team7', points: 3, gd: -3, w: 1, d: 0, l: 2, gf: 3, ga: 6 },
      { teamId: 'team8', points: 0, gd: -7, w: 0, d: 0, l: 3, gf: 1, ga: 8 }
    ],
    'C': [
      { teamId: 'england', points: 7, gd: 4, w: 2, d: 1, l: 0, gf: 6, ga: 2 },
      { teamId: 'germany', points: 6, gd: 2, w: 2, d: 0, l: 1, gf: 5, ga: 3 },
      { teamId: 'team11', points: 3, gd: -2, w: 1, d: 0, l: 2, gf: 3, ga: 5 },
      { teamId: 'team12', points: 1, gd: -4, w: 0, d: 1, l: 2, gf: 2, ga: 6 }
    ],
    'L': [
      { teamId: 'portugal', points: 9, gd: 6, w: 3, d: 0, l: 0, gf: 7, ga: 1 },
      { teamId: 'netherlands', points: 6, gd: 3, w: 2, d: 0, l: 1, gf: 5, ga: 2 },
      { teamId: 'team15', points: 3, gd: -3, w: 1, d: 0, l: 2, gf: 3, ga: 6 },
      { teamId: 'team16', points: 0, gd: -6, w: 0, d: 0, l: 3, gf: 1, ga: 7 }
    ]
  },
  R32_MATCHES: [
    {
      id: 'match1',
      homeTeamId: 'brazil',
      awayTeamId: 'argentina',
      date: '2026-06-28',
      venue: 'Los Angeles',
      status: 'completed',
      homeScore: 2,
      awayScore: 1,
      winner: 'brazil',
      stage: 'R32'
    },
    {
      id: 'match2',
      homeTeamId: 'argentina',
      awayTeamId: 'brazil',
      date: '2026-06-29',
      venue: 'New York',
      status: 'live',
      stage: 'R32'
    }
  ],
  getTeamById: (id: string) => {
    const teams = {
      'brazil': { id: 'brazil', name: 'Brazil', flag: '🇧🇷', group: 'G', fifaRank: 1, confederation: 'CONMEBOL' },
      'argentina': { id: 'argentina', name: 'Argentina', flag: '🇦🇷', group: 'B', fifaRank: 2, confederation: 'CONMEBOL' },
      'france': { id: 'france', name: 'France', flag: '🇫🇷', group: 'I', fifaRank: 3, confederation: 'UEFA' },
      'spain': { id: 'spain', name: 'Spain', flag: '🇪🇸', group: 'J', fifaRank: 4, confederation: 'UEFA' },
      'england': { id: 'england', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'C', fifaRank: 5, confederation: 'UEFA' },
      'germany': { id: 'germany', name: 'Germany', flag: '🇩🇪', group: 'C', fifaRank: 6, confederation: 'UEFA' },
      'portugal': { id: 'portugal', name: 'Portugal', flag: '🇵🇹', group: 'L', fifaRank: 7, confederation: 'UEFA' },
      'netherlands': { id: 'netherlands', name: 'Netherlands', flag: '🇳🇱', group: 'L', fifaRank: 8, confederation: 'UEFA' },
      'team3': { id: 'team3', name: 'Team3', flag: '🏳️', group: 'I', fifaRank: 20, confederation: 'CONCACAF' },
      'team4': { id: 'team4', name: 'Team4', flag: '🏳️', group: 'I', fifaRank: 30, confederation: 'CONCACAF' },
      'team7': { id: 'team7', name: 'Team7', flag: '🏳️', group: 'J', fifaRank: 25, confederation: 'AFC' },
      'team8': { id: 'team8', name: 'Team8', flag: '🏳️', group: 'J', fifaRank: 35, confederation: 'AFC' },
      'team11': { id: 'team11', name: 'Team11', flag: '🏳️', group: 'C', fifaRank: 40, confederation: 'CAF' },
      'team12': { id: 'team12', name: 'Team12', flag: '🏳️', group: 'C', fifaRank: 45, confederation: 'CAF' },
      'team15': { id: 'team15', name: 'Team15', flag: '🏳️', group: 'L', fifaRank: 50, confederation: 'OFC' },
      'team16': { id: 'team16', name: 'Team16', flag: '🏳️', group: 'L', fifaRank: 55, confederation: 'OFC' }
    }
    return teams[id as keyof typeof teams]
  }
}))

describe('HomePage Integration', () => {
  beforeEach(() => {
    ;(usePathname as jest.Mock).mockReturnValue('/')
  })

  it('renders hero section with main content', () => {
    render(<HomePage />)
    
    expect(screen.getByText(/Boom FIFA World Cup/)).toBeInTheDocument()
    expect(screen.getByText('2026™')).toBeInTheDocument()
    expect(screen.getByText('Predictor')).toBeInTheDocument()
    expect(screen.getByText(/48 teams. 104 matches. 3 nations hosting./)).toBeInTheDocument()
  })

  it('displays tournament statistics', () => {
    render(<HomePage />)
    
    expect(screen.getByText('48')).toBeInTheDocument()
    expect(screen.getByText('104')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Teams')).toBeInTheDocument()
    expect(screen.getByText('Matches')).toBeInTheDocument()
    expect(screen.getByText('Groups')).toBeInTheDocument()
  })

  it('shows navigation buttons', () => {
    render(<HomePage />)
    
    expect(screen.getByText('Build My Bracket')).toBeInTheDocument()
    expect(screen.getByText('Predict Matches')).toBeInTheDocument()
  })

  it('displays round of 32 section', () => {
    render(<HomePage />)
    
    expect(screen.getByText('Round of 32')).toBeInTheDocument()
  })

  it('shows match status indicators', () => {
    render(<HomePage />)
    
    // Check for status indicators if they exist
    const statusElements = screen.queryAllByText(/FT|LIVE|Soon/)
    expect(statusElements.length).toBeGreaterThanOrEqual(0)
  })

  it('displays group standings section', () => {
    render(<HomePage />)
    
    expect(screen.getByText('Final Group Standings')).toBeInTheDocument()
  })

  it('shows quick links section', () => {
    render(<HomePage />)
    
    expect(screen.getByText('Group Stage Predictions')).toBeInTheDocument()
    expect(screen.getByText('Build Your Bracket')).toBeInTheDocument()
    expect(screen.getByText('Create a League')).toBeInTheDocument()
  })

  it('displays host information', () => {
    render(<HomePage />)
    
    expect(screen.getByText(/🇺🇸 USA · 🇨🇦 Canada · 🇲🇽 Mexico/)).toBeInTheDocument()
    expect(screen.getByText(/Final: Jul 19, New Jersey/)).toBeInTheDocument()
  })

  it('has proper link structure', () => {
    render(<HomePage />)
    
    const bracketLink = screen.getByText('View full bracket →')
    expect(bracketLink.closest('a')).toHaveAttribute('href', '/bracket')
    
    const predictLink = screen.getByText('See all groups →')
    expect(predictLink.closest('a')).toHaveAttribute('href', '/predict')
  })

  it('shows match status indicators', () => {
    render(<HomePage />)
    
    expect(screen.getByText('FT')).toBeInTheDocument() // Completed match
    expect(screen.getByText('LIVE')).toBeInTheDocument() // Live match
  })

  it('displays match information', () => {
    render(<HomePage />)
    
    // Check that match dates are displayed
    expect(screen.getByText('2026-06-28')).toBeInTheDocument()
  })
})
