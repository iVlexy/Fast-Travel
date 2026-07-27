import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet, View } from 'react-native';
import { useNavStore } from '@/state/navStore';
import { listSkins, SkinId } from '@/theme/skinRegistry';

export function SkinSwitcher() {
  const active = useNavStore((s) => s.activeSkinId);
  const setActiveSkin = useNavStore((s) => s.setActiveSkin);
  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {listSkins().map((s) => {
          const on = s.id === active;
          const p = s.tokens.palette;
          return (
            <Pressable
              key={s.id}
              onPress={() => setActiveSkin(s.id as SkinId)}
              style={[styles.chip, on && { backgroundColor: p.routeLine, borderColor: p.routeLine }]}
            >
              <Text style={[styles.txt, on && { color: p.background }]}>{s.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 48, paddingBottom: 8, backgroundColor: '#00000055' },
  row: { paddingHorizontal: 12, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#ffffff55', backgroundColor: '#0008' },
  txt: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
