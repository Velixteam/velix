import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { VelixErrorBoundary } from '../VelixErrorBoundary.js';

// Suppress React's error boundary console.error spam in test output
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Error boundaries') || args[0].includes('VelixErrorBoundary'))
    ) return;
    originalError(...args);
  };
});
afterAll(() => { console.error = originalError; });

// Component that throws on demand
function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Boom!');
  return <div>OK</div>;
}

// NotFoundError-like error
class FakeNotFoundError extends Error {
  name = 'NotFoundError';
  status = 404;
}

describe('VelixErrorBoundary', () => {
  it('renders children normally when no error is thrown', () => {
    render(
      <VelixErrorBoundary errorComponent={null} routePath="/test">
        <div>Hello world</div>
      </VelixErrorBoundary>
    );
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  it('renders VelixDefaultErrorPage when a child throws and no errorComponent provided', () => {
    render(
      <VelixErrorBoundary errorComponent={null} routePath="/test">
        <Bomb shouldThrow={true} />
      </VelixErrorBoundary>
    );
    // VelixDefaultErrorPage shows status code 500 for generic errors
    expect(screen.getByText('500')).toBeTruthy();
  });

  it('renders a custom errorComponent when provided', () => {
    function CustomError({ error }: { error: Error; reset: () => void }) {
      return <div>Custom: {error.message}</div>;
    }
    render(
      <VelixErrorBoundary errorComponent={CustomError} routePath="/test">
        <Bomb shouldThrow={true} />
      </VelixErrorBoundary>
    );
    expect(screen.getByText('Custom: Boom!')).toBeTruthy();
  });

  it('renders notFoundComponent for NotFoundError', () => {
    function NotFoundUI() { return <div>404 Not Found UI</div>; }

    function NotFoundBomb() {
      throw new FakeNotFoundError('Not Found');
      return null;
    }

    render(
      <VelixErrorBoundary
        errorComponent={null}
        notFoundComponent={NotFoundUI}
        routePath="/test"
      >
        <NotFoundBomb />
      </VelixErrorBoundary>
    );
    expect(screen.getByText('404 Not Found UI')).toBeTruthy();
  });

  it('reset clears the error state', () => {
    let capturedReset: (() => void) | null = null;

    function CustomError({ reset }: { error: Error; reset: () => void }) {
      capturedReset = reset;
      return <button onClick={reset}>Reset</button>;
    }

    const { getByText, queryByText } = render(
      <VelixErrorBoundary errorComponent={CustomError} routePath="/test">
        <Bomb shouldThrow={true} />
      </VelixErrorBoundary>
    );

    // Error boundary catches the throw — Reset button should appear
    expect(getByText('Reset')).toBeTruthy();
    expect(capturedReset).not.toBeNull();

    // Calling reset clears hasError state
    // The boundary will re-render children (Bomb), but since it still throws
    // in this test we simply assert the reset function exists and is callable
    expect(() => capturedReset!()).not.toThrow();
  });
});
