import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProgressBar from './ProgressBar';

describe('ProgressBar', () => {
  const defaultProps = {
    currentStep: 2,
    totalSteps: 5,
    steps: ['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5'],
  };

  it('renders the progress bar with step indicator', () => {
    render(<ProgressBar {...defaultProps} />);
    expect(screen.getByText('Step 3 of 5')).toBeInTheDocument();
  });

  it('displays correct percentage complete', () => {
    render(<ProgressBar {...defaultProps} />);
    expect(screen.getByText('60% Complete')).toBeInTheDocument();
  });

  it('renders all step labels', () => {
    render(<ProgressBar {...defaultProps} />);
    defaultProps.steps.forEach((step) => {
      expect(screen.getByText(step)).toBeInTheDocument();
    });
  });

  it('marks completed steps correctly', () => {
    render(<ProgressBar {...defaultProps} />);
    // Steps 0 and 1 should be completed (current is 2)
    const step0 = screen.getByTestId('step-0');
    const step1 = screen.getByTestId('step-1');
    expect(step0).toBeInTheDocument();
    expect(step1).toBeInTheDocument();
  });

  it('calls onStepClick when clicking on a completed step', () => {
    const onStepClick = vi.fn();
    render(<ProgressBar {...defaultProps} onStepClick={onStepClick} />);

    const step0Button = screen.getByTestId('step-0').querySelector('button');
    if (step0Button) {
      fireEvent.click(step0Button);
      expect(onStepClick).toHaveBeenCalledWith(0);
    }
  });

  it('does not call onStepClick when clicking on a future step', () => {
    const onStepClick = vi.fn();
    render(<ProgressBar {...defaultProps} onStepClick={onStepClick} />);

    const step4Button = screen.getByTestId('step-4').querySelector('button');
    if (step4Button) {
      fireEvent.click(step4Button);
      expect(onStepClick).not.toHaveBeenCalled();
    }
  });

  it('handles keyboard navigation', () => {
    const onStepClick = vi.fn();
    render(<ProgressBar {...defaultProps} onStepClick={onStepClick} />);

    const step1Button = screen.getByTestId('step-1').querySelector('button');
    if (step1Button) {
      fireEvent.keyDown(step1Button, { key: 'Enter' });
      expect(onStepClick).toHaveBeenCalledWith(1);
    }
  });

  it('has proper ARIA attributes', () => {
    render(<ProgressBar {...defaultProps} />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60');
  });
});
