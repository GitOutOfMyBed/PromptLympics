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
    expect(screen.getByText('95.0%')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('hides best score when null', () => {
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

    expect(screen.getByText('New Competition')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument() // submission count
    // Best score should not be displayed when null
    expect(screen.queryByText(/%$/)).not.toBeInTheDocument()
  })

  it('renders multiple competitions in grid layout', () => {
    const mockCompetitions = [
      {
        id: '1',
        title: 'Competition 1',
        description: 'First competition',
        organizationName: 'Org 1',
        totalPrize: 1000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: 'ACTIVE',
        bestScore: 0.85,
        _count: { submissions: 10 },
        organizer: { name: 'John Doe', email: 'john@example.com' },
      },
      {
        id: '2',
        title: 'Competition 2',
        description: 'Second competition',
        organizationName: 'Org 2',
        totalPrize: 2000,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-12-31'),
        status: 'COMPLETED',
        bestScore: 0.92,
        _count: { submissions: 25 },
        organizer: { name: 'Jane Doe', email: 'jane@example.com' },
      },
    ]

    render(<CompetitionsTable competitions={mockCompetitions} />)

    expect(screen.getByText('Competition 1')).toBeInTheDocument()
    expect(screen.getByText('Competition 2')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Ended')).toBeInTheDocument()
    expect(screen.getByText('85.0%')).toBeInTheDocument()
    expect(screen.getByText('92.0%')).toBeInTheDocument()
  })

  it('displays correct status badges', () => {
    const mockCompetitions = [
      {
        id: '1',
        title: 'Active Competition',
        description: 'This is an active competition',
        organizationName: 'Org',
        totalPrize: 1000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: 'ACTIVE',
        bestScore: null,
        _count: { submissions: 0 },
        organizer: { name: 'John', email: 'john@example.com' },
      },
      {
        id: '2',
        title: 'Completed Competition',
        description: 'This competition has ended',
        organizationName: 'Org',
        totalPrize: 1000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: 'COMPLETED',
        bestScore: null,
        _count: { submissions: 0 },
        organizer: { name: 'John', email: 'john@example.com' },
      },
      {
        id: '3',
        title: 'Cancelled Competition',
        description: 'This competition was cancelled',
        organizationName: 'Org',
        totalPrize: 1000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: 'CANCELLED',
        bestScore: null,
        _count: { submissions: 0 },
        organizer: { name: 'John', email: 'john@example.com' },
      },
    ]

    render(<CompetitionsTable competitions={mockCompetitions} />)

    // Check that all three different statuses are displayed
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Ended').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Cancelled').length).toBeGreaterThan(0)
  })
})
