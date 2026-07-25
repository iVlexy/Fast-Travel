import { getMapboxToken } from '@/config/mapbox';

test('returns the public token from the provided env', () => {
  expect(getMapboxToken({ MAPBOX_PUBLIC_TOKEN: 'pk.test' })).toBe('pk.test');
});

test('throws a helpful error when the token is missing', () => {
  expect(() => getMapboxToken({})).toThrow(/MAPBOX_PUBLIC_TOKEN/);
});
