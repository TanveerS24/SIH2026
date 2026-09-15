import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { storage } from '../storage';

export function getApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // When running via Expo (on physical device or emulator), extract the dev machine host IP
  const hostUri = Constants.expoConfig?.hostUri ?? (Constants as any).manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host) {
      return `http://${host}:4000`;
    }
  }

  // Android emulator loopback alias to host machine
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000';
  }

  return 'http://localhost:4000';
}

export const API_URL = getApiUrl();

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
