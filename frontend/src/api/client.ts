import { storage } from '../storage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export class BaseApiClient {
  protected baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  protected async getAuthHeader(): Promise<Record<string, string>> {
    const token = await storage.getItem('pramaan_access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  protected async handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      let errData: any;
      try {
        errData = await res.json();
      } catch {
        errData = { error: 'UnknownError', message: res.statusText };
      }
      throw new Error(errData.message || errData.error || `Request failed with status ${res.status}`);
    }
    return res.json() as Promise<T>;
  }
}
