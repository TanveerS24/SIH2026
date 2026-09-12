import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { colors, typography, StatusTag, Button } from '@pramaan/ui';
import { useAuthStore, DEMO_ACCOUNTS } from '../../stores/authStore';
import { Role } from '@pramaan/shared-types';

export default function WebLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, switchDemoRole } = useAuthStore();

  const navItems = [
    { label: 'DASHBOARD', path: '/(web)/dashboard', icon: '📊' },
    { label: 'CASE REGISTER', path: '/(web)/cases', icon: '📁' },
    { label: 'INTELLIGENCE SEARCH', path: '/(web)/search', icon: '🔍' },
    { label: 'GLOBAL AUDIT TRAIL', path: '/(web)/audit', icon: '📜' },
    { label: 'NCRB ANALYTICS', path: '/(web)/analytics', icon: '📈' },
    { label: 'ACCESS REQUESTS', path: '/(web)/access-requests', icon: '🛡️' },
  ];

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topbar}>
        <View style={styles.brandRow}>
          <View style={styles.sealBox}>
            <Text style={styles.sealIcon}>⚖</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>PRAMAAN</Text>
            <Text style={styles.brandSubtitle}>NATIONAL EVIDENCE & CUSTODY LEDGER</Text>
          </View>
        </View>

        {/* Role Preset Switcher in Header */}
        <View style={styles.roleSwitcherBar}>
          <Text style={styles.switcherLabel}>SWITCH ACTIVE ROLE:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rolePillsScroll}>
            {DEMO_ACCOUNTS.map((acc) => {
              const isCurrent = user?.role === acc.role;
              return (
                <TouchableOpacity
                  key={acc.role}
                  onPress={() => switchDemoRole(acc.role)}
                  style={[
                    styles.rolePill,
                    isCurrent && styles.rolePillActive,
                  ]}
                >
                  <Text style={[styles.rolePillText, isCurrent && styles.rolePillTextActive]}>
                    {acc.role.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* User Badge & Actions */}
        <View style={styles.userSection}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Officer'}</Text>
            <Text style={styles.userMeta}>
              {user?.role.replace(/_/g, ' ')} • {user?.badgeNumber}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(mobile)/home')} style={styles.fieldViewBtn}>
            <Text style={styles.fieldViewText}>📱 FIELD APP</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>LOGOUT</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Area: Sidebar + Content */}
      <View style={styles.body}>
        <View style={styles.sidebar}>
          <Text style={styles.navSectionHeader}>REGISTRY NAVIGATION</Text>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.path.replace('/(web)', '')) || pathname === item.path;
            return (
              <TouchableOpacity
                key={item.path}
                onPress={() => router.push(item.path as any)}
                style={[styles.navBtn, isActive && styles.navBtnActive]}
              >
                <Text style={styles.navIcon}>{item.icon}</Text>
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          <View style={styles.sidebarFooter}>
            <Text style={styles.nodeStatusTitle}>LEDGER NODE STATUS</Text>
            <View style={styles.nodeStatusRow}>
              <View style={styles.nodeDot} />
              <Text style={styles.nodeStatusText}>PRIMARY VALIDATOR: SYNCED</Text>
            </View>
            <Text style={styles.nodeSub}>BLOCKCHAIN SIMULATION ACTIVE</Text>
          </View>
        </View>

        {/* Main Content View */}
        <View style={styles.content}>
          <Slot />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topbar: {
    height: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sealBox: {
    width: 36,
    height: 36,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sealIcon: {
    fontSize: 18,
    color: colors.primary,
  },
  brandTitle: {
    fontFamily: typography.fontSerif,
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontFamily: typography.fontSans,
    fontSize: 8,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  roleSwitcherBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    flex: 1,
    maxWidth: 640,
  },
  switcherLabel: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    marginRight: 8,
  },
  rolePillsScroll: {
    flexDirection: 'row',
  },
  rolePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    marginRight: 6,
  },
  rolePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rolePillText: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  rolePillTextActive: {
    color: colors.textInverse,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userInfo: {
    alignItems: 'flex-end',
  },
  userName: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  userMeta: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.primary,
  },
  fieldViewBtn: {
    backgroundColor: colors.ledgerGoldLight,
    borderWidth: 1,
    borderColor: colors.ledgerGoldBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
  },
  fieldViewText: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '800',
    color: colors.ledgerGold,
  },
  logoutBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: colors.backgroundSubdued,
  },
  logoutText: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 220,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  navSectionHeader: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 2,
    marginBottom: 4,
  },
  navBtnActive: {
    backgroundColor: colors.primaryLight,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  navIcon: {
    fontSize: 14,
    marginRight: 10,
  },
  navLabel: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  navLabelActive: {
    color: colors.primary,
  },
  sidebarFooter: {
    backgroundColor: colors.backgroundSubdued,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    borderRadius: 2,
  },
  nodeStatusTitle: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  nodeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  nodeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.verified,
    marginRight: 6,
  },
  nodeStatusText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    fontWeight: '700',
    color: colors.verifiedDark,
  },
  nodeSub: {
    fontFamily: typography.fontSans,
    fontSize: 8,
    color: colors.textMuted,
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
});
