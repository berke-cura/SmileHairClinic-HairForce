// app.config.js
// This file replaces app.json and allows us to use environment variables
// Note: Expo automatically loads EXPO_PUBLIC_* variables from .env file
// No need for dotenv here - Expo handles it natively

module.exports = {
  expo: {
    name: 'HairForce',
    slug: 'HairForce',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'hairforce',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.berkecura.HairForce',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.berkecura.HairForce',
      permissions: ['HIGH_SAMPLING_RATE_SENSORS'],
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000',
          },
        },
      ],
      [
        'expo-sensors',
        {
          motionPermission: 'Allow $(PRODUCT_NAME) to access your device motion.',
        },
      ],
      [
        'expo-navigation-bar',
        {
          backgroundColor: '#0b1e33',
          barStyle: 'light',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      'expo-navigation-bar': {
        backgroundColor: '#0b1e33',
        barStyle: 'light',
      },
      eas: {
        projectId: '5fa8f4be-3f0c-4e4a-ae5a-87f436bc8770',
      },
      // Environment variables accessible via Constants.expoConfig.extra
      openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
    },
  },
};

