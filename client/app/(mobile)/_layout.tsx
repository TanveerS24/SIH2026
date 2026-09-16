import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { colors, typography, OfflineIndicator } from '@pramaan/ui';
import { useAuthStore } from '../../stores/authStore';
import { useSyncStore } from '../../stores/syncStore';

export default function MobileLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { isOffline, toggleOffline, queue, triggerSync, isSyncing } = useSyncStore();

  const queuedCount = queue.filter((i) => i.status === 'QUEUED' || i.status === 'FAILED').length;

  return (
    <View style={styles.container}>
      {/* Mobile Field Header */}
      <View style={styles.topHeader}>
        <View style={styles.brandCol}>
          <Text style={styles.title}>PRAMAAN FIELD</Text>
          <Text style={styles.badge}>{user?.badgeNumber} ({user?.role.replace(/_/g, ' ')})</Text>
        </View>

        {/* Offline Mode Switcher & Sync */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            onPress={toggleOffline}
            style={[styles.offlineToggle, isOffline && styles.offlineToggleActive]}
          >
            <Text style={[styles.offlineToggleText, isOffline && styles.offlineToggleTextActive]}>
              {isOffline ? 'OFFLINE' : 'ONLINE'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(mobile)/sync')}
            style={styles.queueBtn}
          >
            <Text style={styles.queueBtnText}>
              QUEUE: {queuedCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(web)/dashboard')} style={styles.webBtn}>
            <Text style={styles.webBtnText}>DESKTOP VIEW</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Offline Alert Bar */}
      <OfflineIndicator
        isOffline={isOffline}
        queuedCount={queuedCount}
        onSyncPress={triggerSync}
        isSyncing={isSyncing}
      />

      {/* Screen Content */}
      <View style={styles.content}>
        <Slot />
      </View>

      {/* Bottom Tab Navigation for Mobile */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          onPress={() => router.push('/(mobile)/home')}
          style={[styles.navItem, pathname === '/home' && styles.navItemActive]}
        >
          <Text style={styles.navLabel}>[HOME]</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(mobile)/new-record/capture')}
          style={styles.captureFab}
        >
          <Text style={styles.captureFabText}>+ CAPTURE EVIDENCE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(mobile)/sync')}
          style={[styles.navItem, pathname === '/sync' && styles.navItemActive]}
        >
          <Text style={styles.navLabel}>[SYNC QUEUE]</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    backgroundColor: colors.primary,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandCol: {
    flex: 1,
  },
  title: {
    fontFamily: typography.fontSerif,
    fontSize: 16,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: 1,
  },
  badge: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.primaryBorder,
    marginTop: 1,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineToggle: {
    backgroundColor: colors.verifiedLight,
    borderWidth: 1,
    borderColor: colors.verifiedBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
  },
  offlineToggleActive: {
    backgroundColor: colors.alertLight,
    borderColor: colors.alertBorder,
  },
  offlineToggleText: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '800',
    color: colors.verifiedDark,
  },
  offlineToggleTextActive: {
    color: colors.alertDark,
  },
  queueBtn: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
  },
  queueBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  webBtn: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
  },
  webBtnText: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    height: 64,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navItemActive: {
    opacity: 1,
  },
  navIcon: {
    fontSize: 18,
  },
  navLabel: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 2,
  },
  captureFab: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  captureFabIcon: {
    fontSize: 18,
    color: colors.textInverse,
  },
  captureFabText: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: 0.5,
  },
});
