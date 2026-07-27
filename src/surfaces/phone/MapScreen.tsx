import React from 'react';
import { View, StyleSheet } from 'react-native';
import Mapbox, { UserTrackingMode } from '@rnmapbox/maps';
import { useNavStore } from '@/state/navStore';
import { getSkin } from '@/theme/skinRegistry';
import { buildSkinStyle } from '@/map/skinMapStyle';
import { texturesFor } from '@/map/skinTextures';
import { Hud } from '@/surfaces/phone/Hud';
import { SkinSwitcher } from '@/surfaces/phone/SkinSwitcher';
import { useSimulatedDrive } from '@/surfaces/phone/useSimulatedDrive';

export function MapScreen() {
  const activeSkinId = useNavStore((s) => s.activeSkinId);
  const nav = useNavStore((s) => s.nav);
  const skin = getSkin(activeSkinId);
  const styleJSON = JSON.stringify(buildSkinStyle(skin));
  const textures = texturesFor(skin.id);
  const { start } = useSimulatedDrive();

  const routeShape = nav.route
    ? {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates: nav.route.geometry.map((p) => [p.lng, p.lat]),
        },
      }
    : null;

  return (
    <View style={styles.root}>
      <Mapbox.MapView
        style={styles.map}
        styleJSON={styleJSON}
        scaleBarEnabled={false}
        compassEnabled
      >
        {Object.keys(textures).length > 0 && <Mapbox.Images images={textures} />}
        <Mapbox.Camera followUserLocation followUserMode={UserTrackingMode.FollowWithHeading} followZoomLevel={16} />
        <Mapbox.UserLocation visible />
        {routeShape && (
          <Mapbox.ShapeSource id="route" shape={routeShape as never}>
            <Mapbox.LineLayer
              id="route-casing"
              style={{ lineColor: skin.tokens.palette.routeCasing, lineWidth: 10, lineCap: 'round', lineJoin: 'round' }}
            />
            <Mapbox.LineLayer
              id="route-line"
              style={{ lineColor: skin.tokens.palette.routeLine, lineWidth: 6, lineCap: 'round', lineJoin: 'round' }}
            />
          </Mapbox.ShapeSource>
        )}
      </Mapbox.MapView>
      <SkinSwitcher />
      <Hud onStart={start} />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 }, map: { flex: 1 } });
