import * as SecureStore from 'expo-secure-store';

/**
 * Universal Storage Wrapper - Native Version
 * Uses SecureStore for encrypted storage on iOS/Android.
 */

export const getItemAsync = async (key: string): Promise<string | null> => {
  return await SecureStore.getItemAsync(key);
};

export const setItemAsync = async (key: string, value: string): Promise<void> => {
  await SecureStore.setItemAsync(key, value);
};

export const deleteItemAsync = async (key: string): Promise<void> => {
  await SecureStore.deleteItemAsync(key);
};
