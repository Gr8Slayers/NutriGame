import Constants from 'expo-constants';

// For Debugging on Live Site
console.log("Environment Config Loading...");

const getApiUrl = (): string => {
  const fallback = 'https://nutrigame-754w.onrender.com';
  
  // 1. Check EXPO_PUBLIC_API_URL (Web/Vercel)
  if (process.env.EXPO_PUBLIC_API_URL && process.env.EXPO_PUBLIC_API_URL !== 'undefined') {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // 2. Check Constants (EAS/Native)
  const extraUrl = Constants.expoConfig?.extra?.apiUrl;
  if (extraUrl && extraUrl !== 'undefined') {
    return extraUrl;
  }
  
  // 3. Last Resort Fallback
  return fallback;
};

const API_URL = getApiUrl().replace(/\/$/, '');

console.log("Resolved API URL:", API_URL);

export { API_URL };