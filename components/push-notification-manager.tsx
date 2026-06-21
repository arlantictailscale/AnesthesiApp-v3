"use client";

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export function PushNotificationManager() {
  useEffect(() => {
    // Only execute on native platforms (iOS/Android)
    if (!Capacitor.isNativePlatform()) return;

    // Request permissions from the user
    PushNotifications.requestPermissions().then((result) => {
      if (result.receive === 'granted') {
        // Register with Apple / Google to receive a token
        PushNotifications.register();
      }
    });

    // Listeners
    PushNotifications.addListener('registration', (token) => {
      console.log('Push notification registration succeeded. Token:', token.value);
      // Optional: You can send this token to your database or auth table via API
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push notification registration failed:', err);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push action performed:', action);
    });
  }, []);

  return null;
}
