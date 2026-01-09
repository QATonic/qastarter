import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from './ThemeToggle';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.classList.remove('dark');
  });

  it('renders the theme toggle button', () => {
    render(<ThemeToggle />);
    const button = screen.getByTestId('button-theme-toggle');
    expect(button).toBeInTheDocument();
  });

  it('has accessible screen reader text', () => {
    render(<ThemeToggle />);
    expect(screen.getByText(/switch to (light|dark) mode/i)).toBeInTheDocument();
  });

  it('toggles theme when clicked', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    render(<ThemeToggle />);

    const button = screen.getByTestId('button-theme-toggle');
    fireEvent.click(button);

    // Wait for the toggle animation
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('respects saved dark theme preference', () => {
    localStorageMock.getItem.mockReturnValue('dark');
    render(<ThemeToggle />);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('respects saved light theme preference', () => {
    localStorageMock.getItem.mockReturnValue('light');
    render(<ThemeToggle />);

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
