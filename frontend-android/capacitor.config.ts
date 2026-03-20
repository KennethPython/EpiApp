import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.epilappsy.app',
  appName: 'EpilAppsy',
  webDir: 'dist/epiapp-frontend/browser',
  server: {
    androidScheme: 'https',
    allowNavigation: [],
  },
};

export default config;
