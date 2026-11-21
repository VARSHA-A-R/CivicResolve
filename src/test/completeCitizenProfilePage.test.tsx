import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CompleteCitizenProfilePage } from '../pages/CompleteCitizenProfilePage';

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));

const completeCitizenProfile = vi.fn();

const RouteDisplay = () => {
  const { pathname } = useLocation();
  return <div data-testid="route">{pathname}</div>;
};

describe('CompleteCitizenProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: 'existing-user',
        email: 'existing@example.com',
        displayName: 'Existing Citizen',
        phoneNumber: '+15551234567',
        role: 'citizen',
        profileComplete: false,
        profileError: 'Citizen profile creation failed (permission-denied): Missing or insufficient permissions.',
      },
      role: 'citizen',
      loading: false,
      isVerifiedOfficer: false,
      authError: null,
      signIn: vi.fn(),
      signInOfficer: vi.fn(),
      verifyOfficerAccess: vi.fn(),
      completeCitizenProfile,
      signUp: vi.fn(),
      logout: vi.fn(),
      isFirebaseActive: true,
    });
    completeCitizenProfile.mockResolvedValue({
      uid: 'existing-user',
      email: 'existing@example.com',
      displayName: 'Existing Citizen',
      phoneNumber: '+15551234567',
      role: 'citizen',
      profileComplete: true,
    });
  });

  it('shows the saved profile error and retries the existing authenticated account', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/complete-profile']}>
        <CompleteCitizenProfilePage />
        <RouteDisplay />
      </MemoryRouter>
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(/permission-denied/i);
    await user.click(screen.getByRole('button', { name: /retry profile save/i }));

    await waitFor(() => expect(completeCitizenProfile).toHaveBeenCalledWith(
      'Existing Citizen',
      '+15551234567'
    ));
    expect(screen.getByTestId('route')).toHaveTextContent('/dashboard');
  });

  it('returns to an officer application after profile recovery when requested', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/complete-profile?continue=officer-application']}>
        <CompleteCitizenProfilePage />
        <RouteDisplay />
      </MemoryRouter>
    );

    await user.click(await screen.findByRole('button', { name: /retry profile save/i }));
    await waitFor(() => expect(screen.getByTestId('route')).toHaveTextContent('/officer-application'));
  });
});
