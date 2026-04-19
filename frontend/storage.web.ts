/**
 * Universal Storage Wrapper - Web Version
 * Directly uses browser's localStorage.
 */

export const getItemAsync = async (key: string): Promise<string | null> => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
};

export const setItemAsync = async (key: string, value: string): Promise<void> => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
};

export const deleteItemAsync = async (key: string): Promise<void> => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error deleting from localStorage:', error);
  }
};
