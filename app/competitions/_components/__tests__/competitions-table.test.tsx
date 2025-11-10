import { render, screen } from '@testing-library/react'
import { CompetitionsTable } from '../competitions-table'

describe('CompetitionsTable', () => {
  it('renders empty state when no competitions', () => {
    render(<CompetitionsTable competitions={[]} />)
    expect(screen.getByText(/no competitions found/i)).toBeInTheDocument()
  })

  it('renders competition data correctly', () => {
    const mockCompetitions = [
      {
        id: '1',
        title: 'Test Competition',
        description: 'A test competition',
        organizationName: 'Test Org',
        totalPrize: 1000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: 'ACTIVE',
        bestScore: 0.95,
        _count: { submissions: 42 },
        organizer: { name: 'John Doe', email: 'john@example.com' },
      },
    ]

    render(<CompetitionsTable competitions={mockCompetitions} />)

    expect(screen.getByText('Test Competition')).toBeInTheDocument()
    expect(screen.getByText('A test competition')).toBeInTheDocument()
    expect(screen.getByText('Test Org')).toBeInTheDocument()
    expect(screen.getByText('$1,000.00')).toBeInTheDocument()
    expect(screen.getByText('95.0%')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('displays dash for null best score', () => {
    const mockCompetitions = [
      {
        id: '1',
        title: 'New Competition',
        description: 'No submissions yet',
        organizationName: 'Test Org',
        totalPrize: 500,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: 'ACTIVE',
        bestScore: null,
        _count: { submissions: 0 },
        organizer: { name: 'Jane Doe', email: 'jane@example.com' },
      },
    ]

    render(<CompetitionsTable competitions={mockCompetitions} />)

    const cells = screen.getAllByRole('cell')
    const bestScoreCell = cells.find(cell => cell.textContent === '-')
    expect(bestScoreCell).toBeInTheDocument()
  })
})
