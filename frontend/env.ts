import Constants from 'expo-constants';

const getApiUrl = (): string => {
  // Priority 1: EXPO_PUBLIC_API_URL (Modern Expo env var)
  if (process.env.EXPO_PUBLIC_API_URL && process.env.EXPO_PUBLIC_API_URL !== 'undefined') {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Priority 2: expoConfig.extra.apiUrl (EAS/Native config)
  const extraUrl = Constants.expoConfig?.extra?.apiUrl;
  if (extraUrl && extraUrl !== 'undefined') {
    return extraUrl;
  }

  // Final Fallback: Hardcoded Render URL
  return 'https://nutrigame-754w.onrender.com';
};

const API_URL = getApiUrl().replace(/\/$/, ''); // Remove trailing slash if any

export { API_URL };