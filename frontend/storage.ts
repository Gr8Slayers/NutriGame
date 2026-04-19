import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Universal Storage Wrapper for Expo
 * Uses SecureStore on iOS/Android for security
 * Falls back to localStorage on Web (since SecureStore is not supported)
 */

export const getItemAsync = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }
  return await SecureStore.getItemAsync(key);
};

export const setItemAsync = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
};

export const deleteItemAsync = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
};
