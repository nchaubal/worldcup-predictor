import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { TournamentProvider } from '@/context/TournamentContext'
import { TournamentProviderSupabase } from '@/context/TournamentContextSupabase'

// Custom render function with providers. Nests both contexts since some
// components (e.g. MatchPredictionCard) still read the original mock-data
// TournamentContext, while others (e.g. AuthButton) read the Supabase-backed
// TournamentContextSupabase.
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <TournamentProviderSupabase>
      <TournamentProvider>
        {children}
      </TournamentProvider>
    </TournamentProviderSupabase>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything from testing-library
export * from '@testing-library/react'
export { customRender as render }

// Mock data factories
export const createMockTeam = (overrides = {}) => ({
  id: 'team-1',
  name: 'Brazil',
  flag: '🇧🇷',
  group: 'G',
  strength: 91,
  fifaRanking: 5,
  ...overrides
})

export const createMockMatch = (overrides = {}) => ({
  id: 'match-1',
  homeTeam: createMockTeam(),
  awayTeam: createMockTeam({ id: 'team-2', name: 'Argentina', flag: '🇦🇷' }),
  stage: 'r16' as const,
  matchNumber: 1,
  scheduledDate: '2026-06-28',
  ...overrides
})

export const createMockPrediction = (overrides = {}) => ({
  matchId: 'match-1',
  homeScore: 2,
  awayScore: 1,
  ...overrides
})

// Helper functions for testing
export const waitForLoad = () => new Promise(resolve => setTimeout(resolve, 0))

export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn()
  mockIntersectionObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })
  window.IntersectionObserver = mockIntersectionObserver
}

export const mockResizeObserver = () => {
  const mockResizeObserver = jest.fn()
  mockResizeObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })
  window.ResizeObserver = mockResizeObserver
}
