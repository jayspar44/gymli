import type { ExpoConfig } from 'expo/config';

const variant = process.env.APP_VARIANT ?? 'production';
const isDev = variant === 'development';

const config: ExpoConfig = {
  name: isDev ? 'Gymli (Dev)' : 'Gymli',
  slug: 'gymli',
  owner: 'jayspar44',
  scheme: isDev ? 'gymli-dev' : 'gymli',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'automatic',
  android: {
    package: isDev ? 'com.getgymli.dev' : 'com.getgymli.app',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
  },
  web: { bundler: 'metro', output: 'static', favicon: './assets/images/favicon.png' },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#0c0a09',
        android: {
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      },
    ],
    ['@react-native-google-signin/google-signin', { iosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME ?? 'com.googleusercontent.apps.placeholder' }],
    [
      '@sentry/react-native/expo',
      {
        organization: process.env.SENTRY_ORG ?? 'gymli',
        project: process.env.SENTRY_PROJECT ?? 'gymli-mobile',
        // SENTRY_AUTH_TOKEN is read from the environment (EAS secret) at build time — never inline it here.
      },
    ],
  ],
  experiments: { typedRoutes: true },
  runtimeVersion: { policy: 'appVersion' },
  updates: {
    url: 'https://u.expo.dev/18695339-fd5b-4c06-9743-d0e59c0ac197',
    // fallbackToCacheTimeout 0 = fully non-blocking startup (fetch update in background)
    fallbackToCacheTimeout: 0,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    firebaseConfig: process.env.EXPO_PUBLIC_FIREBASE_CONFIG,
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    eas: { projectId: '18695339-fd5b-4c06-9743-d0e59c0ac197' },
  },
};

export default config;
