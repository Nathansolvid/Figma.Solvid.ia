/**
 * GUARDED ACTION - Tests unitaires
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GuardedAction } from '../GuardedAction';
import { Action, Role } from '@/permissions';
import { UserProvider } from '@/contexts/UserContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

// Mock useUser hook
vi.mock('@/contexts/UserContext', async () => {
  const actual = await vi.importActual('@/contexts/UserContext');
  return {
    ...actual,
    useUser: vi.fn(() => ({
      currentUser: {
        id: 'test-user',
        name: 'Test User',
        email: 'test@example.com',
        role: Role.CLIENT_OWNER,
        organizationId: 'test-org',
      },
      isAuthenticated: true,
      loading: false,
      initError: null,
      setCurrentUser: vi.fn(),
      logout: vi.fn(),
    })),
  };
});

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

describe('GuardedAction', () => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <UserProvider>{children}</UserProvider>
    </QueryClientProvider>
  );

  it('should render children when allowed', () => {
    render(
      <Wrapper>
        <GuardedAction action={Action.CREATE_DOSSIER}>
          <button>Create</button>
        </GuardedAction>
      </Wrapper>
    );

    const button = screen.getByText('Create');
    expect(button).toBeTruthy();
    expect(button).not.toBeDisabled();
  });

  it('should disable button when not allowed (mode=disable)', async () => {
    const { useUser } = await import('@/contexts/UserContext');
    
    // Mock VIEWER role (no permissions)
    vi.mocked(useUser).mockReturnValue({
      currentUser: {
        id: 'viewer',
        name: 'Viewer',
        email: 'viewer@example.com',
        role: Role.VIEWER,
        organizationId: 'test-org',
      },
      isAuthenticated: true,
      loading: false,
      initError: null,
      setCurrentUser: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <Wrapper>
        <GuardedAction action={Action.CREATE_DOSSIER} mode="disable">
          <button>Create</button>
        </GuardedAction>
      </Wrapper>
    );

    const button = screen.getByText('Create');
    expect(button).toBeDisabled();
  });

  it('should hide button when not allowed (mode=hide)', async () => {
    const { useUser } = await import('@/contexts/UserContext');
    
    // Mock VIEWER role
    vi.mocked(useUser).mockReturnValue({
      currentUser: {
        id: 'viewer',
        name: 'Viewer',
        email: 'viewer@example.com',
        role: Role.VIEWER,
        organizationId: 'test-org',
      },
      isAuthenticated: true,
      loading: false,
      initError: null,
      setCurrentUser: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <Wrapper>
        <GuardedAction action={Action.CREATE_DOSSIER} mode="hide">
          <button>Create</button>
        </GuardedAction>
      </Wrapper>
    );

    const button = screen.queryByText('Create');
    expect(button).toBeNull();
  });

  it('should call onClick when allowed', () => {
    const handleClick = vi.fn();

    render(
      <Wrapper>
        <GuardedAction action={Action.CREATE_DOSSIER}>
          <button onClick={handleClick}>Create</button>
        </GuardedAction>
      </Wrapper>
    );

    const button = screen.getByText('Create');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should show toast when clicking disabled button', async () => {
    const { toast } = await import('sonner');
    const { useUser } = await import('@/contexts/UserContext');
    
    // Mock VIEWER role
    vi.mocked(useUser).mockReturnValue({
      currentUser: {
        id: 'viewer',
        name: 'Viewer',
        email: 'viewer@example.com',
        role: Role.VIEWER,
        organizationId: 'test-org',
      },
      isAuthenticated: true,
      loading: false,
      initError: null,
      setCurrentUser: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <Wrapper>
        <GuardedAction action={Action.CREATE_DOSSIER}>
          <button>Create</button>
        </GuardedAction>
      </Wrapper>
    );

    const button = screen.getByText('Create');
    fireEvent.click(button);

    expect(toast.error).toHaveBeenCalledWith('Action non autorisée pour votre rôle');
  });

  it('should support render prop pattern', () => {
    render(
      <Wrapper>
        <GuardedAction action={Action.CREATE_DOSSIER}>
          {({ disabled, onClick }) => (
            <button disabled={disabled} onClick={onClick}>
              {disabled ? 'Disabled' : 'Enabled'}
            </button>
          )}
        </GuardedAction>
      </Wrapper>
    );

    const button = screen.getByText('Enabled');
    expect(button).toBeTruthy();
    expect(button).not.toBeDisabled();
  });
});
