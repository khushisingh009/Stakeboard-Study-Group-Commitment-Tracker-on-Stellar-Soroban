import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SyllabusBoard from '../components/SyllabusBoard';

const sampleCohort = {
  title: 'Rust Study Group',
  milestone_count: 4,
  milestones_closed: 1,
  finalized: false,
  members: [
    { address: 'GAAAA1111111111111111111111111111111111111111111111111', status: 'Active', misses: 0 },
    { address: 'GBBBB2222222222222222222222222222222222222222222222222', status: 'Dropped', misses: 2 },
  ],
};

describe('SyllabusBoard', () => {
  it('shows an empty state when no cohort is loaded', () => {
    render(<SyllabusBoard cohort={null} onCloseMilestone={vi.fn()} onFinalize={vi.fn()} actionLoading={false} />);
    expect(screen.getByText(/no cohort loaded/i)).toBeInTheDocument();
  });

  it('renders session progress and member roster', () => {
    render(<SyllabusBoard cohort={sampleCohort} onCloseMilestone={vi.fn()} onFinalize={vi.fn()} actionLoading={false} />);
    expect(screen.getByText('1 / 4 sessions')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Dropped')).toBeInTheDocument();
  });

  it('calls onCloseMilestone with the next session index', async () => {
    const onCloseMilestone = vi.fn();
    render(<SyllabusBoard cohort={sampleCohort} onCloseMilestone={onCloseMilestone} onFinalize={vi.fn()} actionLoading={false} />);
    const user = userEvent.setup();
    await user.click(screen.getByText('Close session 2'));
    expect(onCloseMilestone).toHaveBeenCalledWith(1);
  });

  it('shows the finalize button once all sessions are closed', () => {
    const doneCohort = { ...sampleCohort, milestones_closed: 4 };
    render(<SyllabusBoard cohort={doneCohort} onCloseMilestone={vi.fn()} onFinalize={vi.fn()} actionLoading={false} />);
    expect(screen.getByText('Finalize & split the pool')).toBeInTheDocument();
  });
});
