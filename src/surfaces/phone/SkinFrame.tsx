import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useNavStore } from '@/state/navStore';
import { getSkin } from '@/theme/skinRegistry';
import { FrameShape } from '@/theme/skinTypes';

const PIPBOY_SCAN = require('../../../assets/skins/textures/pipboy-scan.png');

function radiusFor(shape: FrameShape, corner: number): number {
  switch (shape) {
    case 'circle':
      return 90; // heavily rounded "radar" corners (screen isn't square)
    case 'paper':
      return corner;
    case 'strip':
      return 0;
    default:
      return corner;
  }
}

// A decorative, non-interactive overlay that frames the map per the active skin:
// border shape/color/width from the frame tokens, a compass 'N', and a Pip-Boy
// scanline layer. pointerEvents="none" so map gestures pass through.
export function SkinFrame() {
  const skin = getSkin(useNavStore((s) => s.activeSkinId));
  const f = skin.tokens.frame;
  const p = skin.tokens.palette;
  const radius = radiusFor(f.shape, f.cornerRadius);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {skin.id === 'pipboy' && (
        <>
          <Image source={PIPBOY_SCAN} resizeMode="repeat" style={[StyleSheet.absoluteFill, styles.scan]} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: p.routeLine, opacity: 0.06 }]} />
        </>
      )}

      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderColor: f.borderColor,
            borderWidth: Math.max(4, f.borderWidth * 2),
            borderRadius: radius,
            margin: 6,
          },
        ]}
      />

      {f.shape === 'strip' && (
        <>
          <View style={[styles.strip, styles.stripTop, { backgroundColor: p.background, opacity: 0.55 }]} />
          <View style={[styles.strip, styles.stripBottom, { backgroundColor: p.background, opacity: 0.55 }]} />
        </>
      )}

      <View style={[styles.compass, { borderColor: f.borderColor, backgroundColor: `${p.background}cc` }]}>
        <Text style={[styles.compassTxt, { color: p.text, letterSpacing: skin.tokens.typography.letterSpacing * 10 }]}>N</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scan: { opacity: 0.5 },
  strip: { position: 'absolute', left: 0, right: 0, height: 40 },
  stripTop: { top: 0 },
  stripBottom: { bottom: 0 },
  compass: {
    position: 'absolute',
    top: 96,
    right: 16,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassTxt: { fontSize: 15, fontWeight: '800' },
});
