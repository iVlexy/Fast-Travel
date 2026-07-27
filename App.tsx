import React from 'react';
import Constants from 'expo-constants';
import Mapbox from '@rnmapbox/maps';
import { MapScreen } from '@/surfaces/phone/MapScreen';

// Public token from app.config.js extra (loaded from .env.local).
const token = (Constants.expoConfig?.extra as { mapboxPublicToken?: string } | undefined)?.mapboxPublicToken ?? '';
Mapbox.setAccessToken(token);

export default function App() {
  return <MapScreen />;
}
