import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HelpTooltip from './HelpTooltip';

describe('HelpTooltip', () => {
  it('renders with content', () => {
    render(<HelpTooltip content="Test help content" />);
    // The tooltip trigger should be present
    const trigger = screen.getByRole('button');
    expect(trigger).toBeInTheDocument();
  });

  it('accepts string content', () => {
    const { container } = render(<HelpTooltip content="Simple text" />);
    expect(container).toBeTruthy();
  });

  it('accepts JSX content', () => {
    const { container } = render(<HelpTooltip content={<div>JSX content</div>} />);
    expect(container).toBeTruthy();
  });
});
