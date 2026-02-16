import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yauheni.kwak',
  appName: 'Kwak',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      overlaysWebView: true,
    },
  },
};

export default config;
