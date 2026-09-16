import { BaseApiClient } from './client';
import { storage } from '../storage';
import {
  LoginRequest,
  MFAPendingResponse,
  AuthSuccessResponse,
  RegisterRequest,
  UpdateProfileRequest,
  MockLoginRequest,
} from '@pramaan/shared-types';

export class AuthApi extends BaseApiClient {
  async login(payload: LoginRequest): Promise<MFAPendingResponse> {
    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return this.handleResponse<MFAPendingResponse>(res);
  }

  async register(payload: RegisterRequest): Promise<{ success: boolean; user: any; message: string }> {
    const res = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return this.handleResponse(res);
  }

  async updateProfile(payload: UpdateProfileRequest): Promise<{ success: boolean; user: any; message: string }> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/auth/profile`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await this.handleResponse<{ success: boolean; user: any; message: string }>(res);
    if (data.user) {
      await storage.setItem('pramaan_user', JSON.stringify(data.user));
    }
    return data;
  }

  async mockLogin(payload: MockLoginRequest): Promise<AuthSuccessResponse> {
    const res = await fetch(`${this.baseUrl}/auth/mock-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await this.handleResponse<AuthSuccessResponse>(res);
    await storage.setItem('pramaan_access_token', data.accessToken);
    await storage.setItem('pramaan_refresh_token', data.refreshToken);
    await storage.setItem('pramaan_user', JSON.stringify(data.user));
    return data;
  }

  async verifyMfa(sessionToken: string, totpCode: string): Promise<AuthSuccessResponse> {
    const res = await fetch(`${this.baseUrl}/auth/mfa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken, totpCode }),
    });
    const data = await this.handleResponse<AuthSuccessResponse>(res);
    await storage.setItem('pramaan_access_token', data.accessToken);
    await storage.setItem('pramaan_refresh_token', data.refreshToken);
    await storage.setItem('pramaan_user', JSON.stringify(data.user));
    return data;
  }

  async logout(): Promise<void> {
    const refreshToken = await storage.getItem('pramaan_refresh_token');
    const headers = await this.getAuthHeader();
    try {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {}
    await storage.removeItem('pramaan_access_token');
    await storage.removeItem('pramaan_refresh_token');
    await storage.removeItem('pramaan_user');
  }
}


export const authApi = new AuthApi();
