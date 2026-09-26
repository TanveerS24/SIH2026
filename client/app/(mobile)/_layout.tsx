import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, OfflineIndicator } from '@pramaan/ui';
import { useAuthStore } from '../../stores/authStore';
import { useSyncStore } from '../../stores/syncStore';

export default function MobileLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { isOffline, toggleOffline, queue, triggerSync, isSyncing } = useSyncStore();

  const queuedCount = queue.filter((i) => i.status === 'QUEUED' || i.status === 'FAILED').length;

  const isHome = pathname === '/(mobile)/home' || pathname === '/home' || pathname === '/' || pathname === '';
  const isCapture = pathname.includes('capture') || pathname.includes('new-record');
  // Strict Cadre RBAC: Restrict mobile field view exclusively to WOMEN_HELP_DESK_OFFICER
  if (user && user.role !== 'WOMEN_HELP_DESK_OFFICER') {
    return (
      <View style={styles.accessDeniedContainer}>
        <View style={styles.accessDeniedCard}>
          <Text style={styles.accessDeniedIcon}>🛡️</Text>
          <View style={styles.accessDeniedBadgeWrap}>
            <Text style={styles.accessDeniedBadge}>[RBAC RESTRICTION • 403 FORBIDDEN]</Text>
          </View>
          <Text style={styles.accessDeniedTitle}>MOBILE FIELD ACCESS RESTRICTED</Text>
          <Text style={styles.accessDeniedDesc}>
            The Mobile Field Terminal (Offline SQLite Queue & On-Scene Spot Ingestion) is strictly restricted to frontline field response cadres (Women Help Desk Officer - WHDO) under Section 180 BNSS.
          </Text>

          <View style={styles.accessDeniedCadreBox}>
            <Text style={styles.accessDeniedCadreLabel}>YOUR AUTHENTICATED CADRE:</Text>
            <Text style={styles.accessDeniedCadreValue}>
              {user.badgeNumber} • {user.role.replace(/_/g, ' ')}
            </Text>
            <Text style={styles.accessDeniedCadreSub}>
              Authorized Surface: Desktop Case Register & Judicial Scrutiny Portal
            </Text>
          </View>

          <TouchableOpacity
            style={styles.returnBtn}
            onPress={() => router.replace('/(web)/dashboard')}
            activeOpacity={0.8}
          >
            <Text style={styles.returnBtnText}>RETURN TO AUTHORIZED DESKTOP PORTAL →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutSecondaryBtn}
            onPress={logout}
          >
            <Text style={styles.logoutSecondaryText}>LOGOUT FROM SESSION</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isSync = pathname.includes('sync');

  return (
    <View style={styles.container}>
      {/* Mobile Field Header */}
      <View style={styles.topHeader}>
        <View style={styles.brandCol}>
          <Text style={styles.title}>PRAMAAN FIELD</Text>
          <Text style={styles.badge}>{user?.badgeNumber} ({user?.role.replace(/_/g, ' ')})</Text>
        </View>

        {/* Offline Mode Switcher & Sync & Logout */}
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
            <Text style={styles.webBtnText}>DESKTOP</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={logout} style={styles.logoutBtn} accessibilityLabel="Logout">
            <Text style={styles.logoutBtnText}>LOGOUT</Text>
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
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TouchableOpacity
          onPress={() => router.push('/(mobile)/home')}
          style={[styles.navItem, isHome && styles.navItemActive]}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, isHome && styles.navIconActive]}>📋</Text>
          <Text style={[styles.navLabel, isHome && styles.navLabelActive]}>Field Records</Text>
          {isHome && <View style={styles.activeBar} />}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(mobile)/new-record/capture')}
          style={[styles.captureFab, isCapture && styles.captureFabActive]}
          activeOpacity={0.8}
        >
          <Text style={styles.captureFabIcon}>📷</Text>
          <Text style={styles.captureFabText}>Capture Evidence</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(mobile)/sync')}
          style={[styles.navItem, isSync && styles.navItemActive]}
          activeOpacity={0.7}
        >
          <View style={styles.iconBadgeWrap}>
            <Text style={[styles.navIcon, isSync && styles.navIconActive]}>🔄</Text>
            {queuedCount > 0 && (
              <View style={styles.queueBadge}>
                <Text style={styles.queueBadgeText}>{queuedCount}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.navLabel, isSync && styles.navLabelActive]}>Sync Queue</Text>
          {isSync && <View style={styles.activeBar} />}
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
  logoutBtn: {
    backgroundColor: colors.alertLight,
    borderWidth: 1,
    borderColor: colors.alertBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
  },
  logoutBtnText: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '800',
    color: colors.alertDark,
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    minHeight: 64,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
    position: 'relative',
    borderRadius: 4,
  },
  navItemActive: {
    backgroundColor: colors.primaryLight,
  },
  activeBar: {
    position: 'absolute',
    top: -6,
    left: '20%',
    right: '20%',
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  navIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  navLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  iconBadgeWrap: {
    position: 'relative',
  },
  queueBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: colors.alert,
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  queueBadgeText: {
    fontFamily: typography.fontSans,
    fontSize: 8,
    fontWeight: '800',
    color: colors.textInverse,
  },
  captureFab: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  captureFabActive: {
    backgroundColor: colors.primaryHover,
    borderColor: colors.ledgerGold,
    borderWidth: 2,
  },
  captureFabIcon: {
    fontSize: 18,
    color: colors.textInverse,
    marginBottom: 1,
  },
  captureFabText: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: 0.4,
  },

  // RBAC Access Denied Screen
  accessDeniedContainer: {
    flex: 1,
    backgroundColor: '#070D12',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  accessDeniedCard: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: 24,
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    gap: 12,
  },
  accessDeniedIcon: {
    fontSize: 40,
    marginBottom: 4,
  },
  accessDeniedBadgeWrap: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  accessDeniedBadge: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    fontWeight: '800',
    color: '#F87171',
    letterSpacing: 0.5,
  },
  accessDeniedTitle: {
    fontFamily: typography.fontSans,
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  accessDeniedDesc: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 18,
  },
  accessDeniedCadreBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    padding: 12,
    width: '100%',
    alignItems: 'center',
    gap: 4,
    marginVertical: 4,
  },
  accessDeniedCadreLabel: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  accessDeniedCadreValue: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  accessDeniedCadreSub: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  returnBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  returnBtnText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: 0.5,
  },
  logoutSecondaryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  logoutSecondaryText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
});
