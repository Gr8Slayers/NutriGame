import Constants from 'expo-constants';

const API_URL: string =
    process.env.EXPO_PUBLIC_API_URL ||           // Vercel web build
    Constants.expoConfig?.extra?.apiUrl ||        // EAS build / Expo Go
    'https://nutrigame-754w.onrender.com';        // fallback

export { API_URL };