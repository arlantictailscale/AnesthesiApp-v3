import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'id.my.anesthesiapp.app',
  appName: 'AnesthesiApp',
  webDir: 'public',
  server: {
    url: 'https://anesthesiapp.my.id',
    cleartext: true
  }
};

export default config;
