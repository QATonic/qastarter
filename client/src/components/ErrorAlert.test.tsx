import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorAlert } from './ErrorAlert';

describe('ErrorAlert', () => {
  it('renders error message', () => {
    render(<ErrorAlert message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('displays default title "Error"', () => {
    render(<ErrorAlert message="Test error" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('displays custom title', () => {
    render(<ErrorAlert title="Custom Error" message="Test error" />);
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
  });

  it('shows retry button when onRetry is provided', () => {
    const onRetry = vi.fn();
    render(<ErrorAlert message="Test error" onRetry={onRetry} />);

    const retryButton = screen.getByTestId('button-retry');
    expect(retryButton).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorAlert message="Test error" onRetry={onRetry} />);

    fireEvent.click(screen.getByTestId('button-retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows dismiss button when onDismiss is provided', () => {
    const onDismiss = vi.fn();
    render(<ErrorAlert message="Test error" onDismiss={onDismiss} />);

    expect(screen.getByTestId('button-dismiss-error')).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn();
    render(<ErrorAlert message="Test error" onDismiss={onDismiss} />);

    fireEvent.click(screen.getByTestId('button-dismiss-error'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('hides retry button when showRetry is false', () => {
    const onRetry = vi.fn();
    render(<ErrorAlert message="Test error" onRetry={onRetry} showRetry={false} />);

    expect(screen.queryByTestId('button-retry')).not.toBeInTheDocument();
  });

  it('has proper test id', () => {
    render(<ErrorAlert message="Test error" />);
    expect(screen.getByTestId('alert-error')).toBeInTheDocument();
  });
});
