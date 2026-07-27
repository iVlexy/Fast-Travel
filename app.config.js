// Dynamic Expo config. Loads the public Mapbox token from .env.local (git-ignored)
// so no token lands in a committed file. The secret download token is NOT here —
// it lives in ~/.gradle/gradle.properties (MAPBOX_DOWNLOADS_TOKEN). See docs/MAPBOX_SETUP.md.
require('dotenv').config({ path: '.env.local' });

module.exports = {
  expo: {
    name: 'Fast Travel',
    slug: 'fast-travel',
    scheme: 'fasttravel',
    version: '0.1.0',
    orientation: 'portrait',
    userInterfaceStyle: 'dark',
    ios: { bundleIdentifier: 'cloud.browning.fasttravel', supportsTablet: true },
    android: { package: 'cloud.browning.fasttravel' },
    plugins: [
      ['@rnmapbox/maps', { RNMapboxMapsImpl: 'mapbox' }],
      [
        'expo-location',
        { locationWhenInUsePermission: 'Fast Travel uses your location to show you on the map and navigate.' },
      ],
    ],
    extra: {
      mapboxPublicToken: process.env.MAPBOX_PUBLIC_TOKEN || '',
    },
  },
};
