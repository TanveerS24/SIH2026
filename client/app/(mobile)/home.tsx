import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, Panel, Button, StatusTag } from '@pramaan/ui';
import { useAuthStore } from '../../stores/authStore';
import { useSyncStore } from '../../stores/syncStore';

export default function MobileHomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { queue, isOffline } = useSyncStore();

  const pendingCount = queue.filter((q) => q.status !== 'SYNCED').length;
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'OF';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Officer Card */}
      <View style={styles.officerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.officerName} numberOfLines={1}>{user?.name}</Text>
          <Text style={styles.officerMeta}>{user?.badgeNumber} • {user?.jurisdiction}</Text>
        </View>
        <View style={[styles.onlineDot, isOffline && styles.offlineDot]} />
      </View>

      {/* Primary CTA */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/(mobile)/new-record/capture')}
        style={styles.captureBtn}
      >
        <Text style={styles.captureBtnBadge}>[RECORD]</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.captureBtnTitle}>CAPTURE EVIDENCE</Text>
          <Text style={styles.captureBtnSub}>Photo • Witness statement • Seizure memo</Text>
        </View>
        <Text style={styles.captureBtnArrow}>→</Text>
      </TouchableOpacity>

      {/* Status Bar */}
      <View style={styles.statusRow}>
        <View style={styles.statusCard}>
          <Text style={[styles.statusVal, { color: isOffline ? colors.alert : colors.verified }]}>
            {isOffline ? 'OFFLINE' : 'ONLINE'}
          </Text>
          <Text style={styles.statusLabel}>DEVICE</Text>
        </View>
        <View style={styles.statusCard}>
          <Text style={[styles.statusVal, { color: pendingCount > 0 ? colors.ledgerGold : colors.textPrimary }]}>
            {queue.length}
          </Text>
          <Text style={styles.statusLabel}>QUEUE</Text>
        </View>
        {pendingCount > 0 && (
          <TouchableOpacity style={styles.syncBtn} onPress={() => router.push('/(mobile)/sync')}>
            <Text style={styles.syncBtnText}>SYNC {pendingCount} →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Recent Records */}
      {queue.length > 0 && (
        <Panel
          title="RECENT"
          action={
            <Button title="All →" onPress={() => router.push('/(mobile)/sync')} variant="ghost" size="sm" />
          }
        >
          {queue.slice(0, 3).map((item) => (
            <View key={item.localId} style={styles.recordItem}>
              <View style={styles.recRow}>
                <Text style={styles.recTitle} numberOfLines={1}>
                  {item.payload.title || item.payload.fileName || 'Record'}
                </Text>
                <StatusTag
                  label={item.status}
                  variant={item.status === 'SYNCED' ? 'verified' : item.status === 'FAILED' ? 'alert' : 'neutral'}
                  size="sm"
                />
              </View>
              <Text style={styles.recMeta}>
                {item.payload.documentType} • {new Date(item.createdAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
              </Text>
            </View>
          ))}
        </Panel>
      )}

      {/* Session Sign-Out */}
      <View style={styles.logoutSection}>
        <Button
          title="LOGOUT FROM FIELD SESSION"
          onPress={logout}
          variant="secondary"
          size="md"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 14 },
  logoutSection: {
    marginTop: 20,
    marginBottom: 24,
  },

  officerCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: typography.fontSans,
    fontSize: 14,
    fontWeight: '800',
    color: colors.textInverse,
  },
  officerName: {
    fontFamily: typography.fontSans,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  officerMeta: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 1,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.verified,
  },
  offlineDot: { backgroundColor: colors.alert },

  captureBtn: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  captureBtnBadge: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
  },
  captureBtnTitle: {
    fontFamily: typography.fontSans,
    fontSize: 14,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: 0.4,
  },
  captureBtnSub: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  captureBtnArrow: {
    fontSize: 20,
    color: colors.textInverse,
    fontWeight: '700',
  },

  statusRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    alignItems: 'center',
  },
  statusCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 10,
    alignItems: 'center',
  },
  statusVal: {
    fontFamily: typography.fontMono,
    fontSize: 14,
    fontWeight: '700',
  },
  statusLabel: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.4,
  },
  syncBtn: {
    backgroundColor: colors.ledgerGoldLight,
    borderWidth: 1,
    borderColor: colors.ledgerGoldBorder,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  syncBtnText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '800',
    color: colors.ledgerGold,
    letterSpacing: 0.3,
  },

  recordItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  recTitle: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  recMeta: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },
});
