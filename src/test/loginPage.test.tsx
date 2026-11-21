import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginPage } from '../pages/LoginPage';
import { getOfficerApplication } from '../services/officerApplicationService';
import type { UserProfile } from '../types';

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../services/officerApplicationService', () => ({
  getOfficerApplication: vi.fn(),
  submitOfficerApplication: vi.fn(),
}));

const signIn = vi.fn();
const signInOfficer = vi.fn();
const signUp = vi.fn();
const logout = vi.fn();

const RouteDisplay = () => {
  const { pathname } = useLocation();
  return <div data-testid="route">{pathname}</div>;
};

const renderLogin = () => render(
  <MemoryRouter initialEntries={['/']}>
    <LoginPage />
    <RouteDisplay />
  </MemoryRouter>
);

describe('LoginPage portal selection and role routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      role: 'citizen',
      loading: false,
      isVerifiedOfficer: false,
      authError: null,
      signIn,
      signInOfficer,
      verifyOfficerAccess: vi.fn(),
      completeCitizenProfile: vi.fn(),
      signUp,
      logout,
      isFirebaseActive: true,
    });
    vi.mocked(getOfficerApplication).mockResolvedValue(null);
  });

  it('starts with citizen and officer portal choices', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /citizen login/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /officer login/i })).toBeInTheDocument();
  });

  it('routes a verified officer to the officer dashboard', async () => {
    const user = userEvent.setup();
    const officer: UserProfile = {
      uid: 'officer-1',
      email: 'officer@example.com',
      displayName: 'Officer',
      role: 'admin',
      isVerifiedOfficer: true,
    };
    signInOfficer.mockResolvedValue(officer);
    renderLogin();

    await user.click(screen.getByRole('button', { name: /officer login/i }));
    await user.type(screen.getByLabelText(/email address/i), officer.email);
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Officer Sign In' }));

    await waitFor(() => expect(screen.getByTestId('route')).toHaveTextContent('/admin'));
    expect(signInOfficer).toHaveBeenCalledOnce();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('routes an authenticated citizen to the citizen dashboard', async () => {
    const user = userEvent.setup();
    signIn.mockResolvedValue({
      uid: 'citizen-1',
      email: 'citizen@example.com',
      displayName: 'Citizen',
      role: 'citizen',
      isVerifiedOfficer: false,
    } satisfies UserProfile);
    renderLogin();

    await user.click(screen.getByRole('button', { name: /citizen login/i }));
    await user.type(screen.getByLabelText(/email address/i), 'citizen@example.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => expect(screen.getByTestId('route')).toHaveTextContent('/dashboard'));
    expect(signIn).toHaveBeenCalledOnce();
    expect(signInOfficer).not.toHaveBeenCalled();
  });

  it('routes an officer with a pending application to verification status', async () => {
    const user = userEvent.setup();
    signInOfficer.mockResolvedValue({
      uid: 'citizen-1',
      email: 'citizen@example.com',
      displayName: 'Citizen',
      role: 'citizen',
      isVerifiedOfficer: false,
    } satisfies UserProfile);
    vi.mocked(getOfficerApplication).mockResolvedValue({
      uid: 'citizen-1',
      fullName: 'Citizen',
      email: 'citizen@example.com',
      phoneNumber: '+15551234567',
      department: 'Roads',
      reason: 'Requesting access for municipal duties.',
      status: 'pending',
      createdAt: '2026-03-01T10:00:00.000Z',
    });
    renderLogin();

    await user.click(screen.getByRole('button', { name: /officer login/i }));
    await user.type(screen.getByLabelText(/email address/i), 'citizen@example.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Officer Sign In' }));

    await waitFor(() => expect(screen.getByTestId('route')).toHaveTextContent('/officer-application'));
    expect(signIn).not.toHaveBeenCalled();
  });

  it('denies officer access when neither authorization nor an application exists', async () => {
    const user = userEvent.setup();
    signInOfficer.mockResolvedValue({
      uid: 'citizen-1',
      email: 'citizen@example.com',
      displayName: 'Citizen',
      role: 'citizen',
      isVerifiedOfficer: false,
    } satisfies UserProfile);
    renderLogin();

    await user.click(screen.getByRole('button', { name: /officer login/i }));
    await user.type(screen.getByLabelText(/email address/i), 'citizen@example.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Officer Sign In' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/no officer application/i);
    expect(screen.getByTestId('route')).toHaveTextContent('/');
  });

  it('keeps officer Firestore permission errors visible', async () => {
    const user = userEvent.setup();
    signInOfficer.mockRejectedValue(
      new Error('Officer authorization lookup failed (permission-denied): Missing or insufficient permissions.')
    );
    renderLogin();

    await user.click(screen.getByRole('button', { name: /officer login/i }));
    await user.type(screen.getByLabelText(/email address/i), 'officer@example.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Officer Sign In' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/permission-denied/i);
  });

  it('shows and follows the officer application link', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /officer login/i }));
    const applyLink = screen.getByRole('link', {
      name: /apply for officer access \/ create officer application/i,
    });
    expect(applyLink).toBeInTheDocument();
    await user.click(applyLink);

    expect(screen.getByTestId('route')).toHaveTextContent('/officer-application');
  });

  it('collects and passes a phone number during citizen registration', async () => {
    const user = userEvent.setup();
    signUp.mockResolvedValue({
      uid: 'citizen-new',
      email: 'new@example.com',
      displayName: 'New Citizen',
      phoneNumber: '+919000000000',
      role: 'citizen',
      isVerifiedOfficer: false,
    } satisfies UserProfile);
    renderLogin();

    await user.click(screen.getByRole('button', { name: /citizen login/i }));
    await user.click(screen.getByRole('button', { name: /create a citizen account/i }));
    await user.type(screen.getByLabelText(/full name/i), 'New Citizen');
    await user.type(screen.getByLabelText(/mobile number/i), '+91 90000 00000');
    await user.type(screen.getByLabelText(/email address/i), 'new@example.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => expect(signUp).toHaveBeenCalledWith(
      'new@example.com',
      'secret123',
      'New Citizen',
      '+91 90000 00000'
    ));
    await waitFor(() => expect(screen.getByTestId('route')).toHaveTextContent('/dashboard'));
  });

  it('routes an authenticated account with a missing profile to recovery instead of re-registering', async () => {
    const user = userEvent.setup();
    signIn.mockResolvedValue({
      uid: 'existing-user',
      email: 'existing@example.com',
      displayName: 'Existing User',
      role: 'citizen',
      isVerifiedOfficer: false,
      profileComplete: false,
      profileError: 'Citizen profile lookup failed (permission-denied): Missing or insufficient permissions.',
    } satisfies UserProfile);
    renderLogin();

    await user.click(screen.getByRole('button', { name: /citizen login/i }));
    await user.type(screen.getByLabelText(/email address/i), 'existing@example.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => expect(screen.getByTestId('route')).toHaveTextContent('/complete-profile'));
    expect(signUp).not.toHaveBeenCalled();
  });
});
