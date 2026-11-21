import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOfficerApplication, submitOfficerApplication } from '../services/officerApplicationService';
import { OfficerApplicationPage } from '../pages/OfficerApplicationPage';

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../services/officerApplicationService', () => ({
  getOfficerApplication: vi.fn(),
  submitOfficerApplication: vi.fn(),
}));

const RouteDisplay = () => {
  const { pathname } = useLocation();
  return <div data-testid="route">{pathname}</div>;
};

const renderPage = () => render(
  <MemoryRouter initialEntries={['/officer-application']}>
    <OfficerApplicationPage />
    <RouteDisplay />
  </MemoryRouter>
);

describe('OfficerApplicationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: 'citizen-1',
        email: 'citizen@example.com',
        displayName: 'Citizen',
        phoneNumber: '+919000000000',
        role: 'citizen',
        isVerifiedOfficer: false,
      },
      role: 'citizen',
      loading: false,
      isVerifiedOfficer: false,
      authError: null,
      signIn: vi.fn(),
      signInOfficer: vi.fn(),
      verifyOfficerAccess: vi.fn(),
      completeCitizenProfile: vi.fn(),
      signUp: vi.fn(),
      logout: vi.fn(),
      isFirebaseActive: true,
    });
    vi.mocked(getOfficerApplication).mockResolvedValue(null);
    vi.mocked(submitOfficerApplication).mockResolvedValue(undefined);
  });

  it('shows the saved application status without granting access', async () => {
    vi.mocked(getOfficerApplication).mockResolvedValue({
      uid: 'citizen-1',
      fullName: 'Citizen',
      email: 'citizen@example.com',
      phoneNumber: '+919000000000',
      department: 'Roads',
      reason: 'Requesting access for municipal duties.',
      status: 'pending',
      createdAt: '2026-03-01T10:00:00.000Z',
    });

    renderPage();

    expect(await screen.findByText('Application pending')).toBeInTheDocument();
    expect(screen.getByText(/does not grant officer access/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /submit officer application/i })).not.toBeInTheDocument();
  });

  it('submits a new application under the authenticated account', async () => {
    const user = userEvent.setup();
    vi.mocked(getOfficerApplication)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        uid: 'citizen-1',
        fullName: 'Applicant Name',
        email: 'citizen@example.com',
        phoneNumber: '+919000000000',
        department: 'Roads',
        reason: 'Requesting access for assigned municipal duties.',
        status: 'pending',
        createdAt: '2026-03-01T10:00:00.000Z',
      });

    renderPage();
    const nameInput = await screen.findByLabelText(/full name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Applicant Name');
    await user.type(screen.getByLabelText(/municipal department/i), 'Roads');
    await user.type(
      screen.getByLabelText(/reason for requesting officer access/i),
      'Requesting access for assigned municipal duties.'
    );
    await user.click(screen.getByRole('button', { name: /submit officer application/i }));

    await waitFor(() => expect(submitOfficerApplication).toHaveBeenCalledWith(
      'citizen-1',
      expect.objectContaining({
        fullName: 'Applicant Name',
        phoneNumber: '+919000000000',
        department: 'Roads',
      })
    ));
    expect(await screen.findByText('Application pending')).toBeInTheDocument();
  });
});
