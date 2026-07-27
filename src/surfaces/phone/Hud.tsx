import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavStore } from '@/state/navStore';
import { getSkin } from '@/theme/skinRegistry';
import { PaletteTokens } from '@/theme/skinTypes';

const fmtM = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`);

function Stat({ label, value, p }: { label: string; value: string; p: PaletteTokens }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.k, { color: p.textMuted }]}>{label}</Text>
      <Text style={[styles.sv, { color: p.text }]}>{value}</Text>
    </View>
  );
}

export function Hud({ onStart }: { onStart: () => void }) {
  const nav = useNavStore((s) => s.nav);
  const skin = getSkin(useNavStore((s) => s.activeSkinId));
  const p = skin.tokens.palette;
  const mph = Math.round(nav.speed * 2.23694);
  const next = nav.route?.steps[nav.currentStepIndex + 1] ?? nav.route?.steps[nav.currentStepIndex];
  const instr =
    nav.status === 'off-route'
      ? 'Recalculating…'
      : nav.status === 'arrived'
        ? 'You have arrived'
        : next
          ? next.maneuver.instruction
          : 'Tap Simulate drive';

  return (
    <View style={[styles.wrap, { backgroundColor: `${p.surface}ee`, borderColor: p.routeLine }]}>
      <View style={styles.row}>
        <Text style={[styles.k, { color: p.textMuted }]}>STATUS</Text>
        <Text style={[styles.v, { color: nav.status === 'off-route' ? p.danger : p.routeLine }]}>
          {nav.status.toUpperCase()}
        </Text>
      </View>
      <View style={styles.grid}>
        <Stat label="SPEED" value={`${mph} mph`} p={p} />
        <Stat label="TO TURN" value={nav.status === 'navigating' ? fmtM(nav.distanceToNextTurn) : '—'} p={p} />
        <Stat label="ETA" value={`${Math.max(0, Math.round(nav.etaSeconds))}s`} p={p} />
      </View>
      <Text style={[styles.instr, { color: p.text }]} numberOfLines={1}>
        {instr}
      </Text>
      <Pressable style={[styles.btn, { backgroundColor: p.routeLine }]} onPress={onStart}>
        <Text style={[styles.btnText, { color: p.background }]}>SIMULATE DRIVE</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, bottom: 24, borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1 },
  k: { fontSize: 10, letterSpacing: 1.5, fontWeight: '700' },
  v: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  sv: { fontSize: 18, fontWeight: '800' },
  instr: { fontSize: 13, fontWeight: '600' },
  btn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  btnText: { fontWeight: '800', letterSpacing: 1 },
});
