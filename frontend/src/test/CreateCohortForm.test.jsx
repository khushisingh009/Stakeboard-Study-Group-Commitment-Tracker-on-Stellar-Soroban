import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateCohortForm from '../components/CreateCohortForm';

describe('CreateCohortForm', () => {
  it('disables submit until title and stake are filled', () => {
    render(<CreateCohortForm onCreate={vi.fn()} loading={false} />);
    expect(screen.getByText('Create cohort on-chain')).toBeDisabled();
  });

  it('calls onCreate with numeric fields converted', async () => {
    const onCreate = vi.fn();
    render(<CreateCohortForm onCreate={onCreate} loading={false} />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Rust Study Group — Fall Cohort'), 'Algorithms Club');
    await user.type(screen.getByPlaceholderText('50'), '75');
    await user.click(screen.getByText('Create cohort on-chain'));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Algorithms Club', stakeAmount: 75, milestoneCount: 8, maxMisses: 1 })
    );
  });

  it('shows the loading label while submitting', () => {
    render(<CreateCohortForm onCreate={vi.fn()} loading={true} />);
    expect(screen.getByText('Publishing…')).toBeInTheDocument();
  });
});
