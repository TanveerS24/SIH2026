import { create } from 'zustand';
import { Role, UserPayload } from '@pramaan/shared-types';
import { storage } from '../services/storage';
import { api } from '../services/api';

export interface DemoAccount {
  email: string;
  role: Role;
  label: string;
  badge: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: 'io@example.gov', role: 'INVESTIGATION_OFFICER', label: 'Investigation Officer (IO)', badge: 'TN-IO-4892' },
  { email: 'helpdesk@example.gov', role: 'WOMEN_HELP_DESK_OFFICER', label: 'Women Help Desk Officer', badge: 'TN-WHD-1044' },
  { email: 'prosecutor@example.gov', role: 'PROSECUTOR', label: 'Public Prosecutor', badge: 'TN-PP-0381' },
  { email: 'judge@example.gov', role: 'JUDGE', label: 'Hon. Magistrate / Judge', badge: 'TN-JUD-0012' },
  { email: 'analyst@example.gov', role: 'NCRB_ANALYST', label: 'NCRB Statistical Analyst', badge: 'NCRB-STAT-992' },
];

interface AuthState {
  user: UserPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaPending: boolean;
  mfaSessionToken: string | null;
  mfaEmail: string | null;
  error: string | null;

  initAuth: () => Promise<void>;
  login: (email: string, password?: string) => Promise<void>;
  verifyMfa: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (role: Role) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  mfaPending: false,
  mfaSessionToken: null,
  mfaEmail: null,
  error: null,

  initAuth: async () => {
    try {
      const rawUser = await storage.getItem('pramaan_user');
      const token = await storage.getItem('pramaan_access_token');
      if (rawUser && token) {
        set({
          user: JSON.parse(rawUser),
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }
    } catch {}
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  login: async (email: string, password = 'DemoPass123!') => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.login({ email, password });
      set({
        mfaPending: true,
        mfaSessionToken: res.sessionToken,
        mfaEmail: email,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false });
    }
  },

  verifyMfa: async (code: string) => {
    const { mfaSessionToken } = get();
    if (!mfaSessionToken) return;

    set({ isLoading: true, error: null });
    try {
      const res = await api.verifyMfa(mfaSessionToken, code);
      set({
        user: res.user,
        isAuthenticated: true,
        mfaPending: false,
        mfaSessionToken: null,
        mfaEmail: null,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'MFA verification failed', isLoading: false });
    }
  },

  logout: async () => {
    await api.logout();
    set({
      user: null,
      isAuthenticated: false,
      mfaPending: false,
      mfaSessionToken: null,
      mfaEmail: null,
      error: null,
    });
  },

  switchDemoRole: async (role: Role) => {
    const acc = DEMO_ACCOUNTS.find((a) => a.role === role);
    if (!acc) return;
    await get().login(acc.email, 'DemoPass123!');
    await get().verifyMfa('123456');
  },

  clearError: () => set({ error: null }),
}));
