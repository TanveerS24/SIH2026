import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') localStorage.setItem(key, value);
      } catch {}
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') localStorage.removeItem(key);
      } catch {}
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};
