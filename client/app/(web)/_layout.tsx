import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { colors, typography, OfficialSeal } from '@pramaan/ui';
import { useAuthStore, DEMO_ACCOUNTS } from '../../stores/authStore';

export default function WebLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, switchDemoRole } = useAuthStore();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const navItems = [
    { label: 'DASHBOARD', path: '/(web)/dashboard', tag: 'DASH' },
    { label: 'CASE REGISTER', path: '/(web)/cases', tag: 'CASES' },
    { label: 'INTELLIGENCE SEARCH', path: '/(web)/search', tag: 'SEARCH' },
    { label: 'GLOBAL AUDIT TRAIL', path: '/(web)/audit', tag: 'AUDIT' },
    { label: 'NCRB ANALYTICS', path: '/(web)/analytics', tag: 'STATS' },
    { label: 'ACCESS REQUESTS', path: '/(web)/access-requests', tag: 'ACCESS' },
    { label: 'OFFICER PROFILE', path: '/(web)/profile', tag: 'PROFILE' },
  ];

  const handleNav = (path: string) => {
    setIsDrawerOpen(false);
    router.push(path as any);
  };

  const renderNavContent = () => (
    <View style={styles.sidebarInner}>
      <View>
        <View style={styles.navHeaderRow}>
          <Text style={styles.navSectionHeader}>REGISTRY NAVIGATION</Text>
          {isMobile && (
            <TouchableOpacity onPress={() => setIsDrawerOpen(false)} style={styles.closeDrawerBtn}>
              <Text style={styles.closeDrawerText}>CLOSE</Text>
            </TouchableOpacity>
          )}
        </View>

        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.path.replace('/(web)', '')) || pathname === item.path;
          return (
            <TouchableOpacity
              key={item.path}
              onPress={() => handleNav(item.path)}
              style={[styles.navBtn, isActive && styles.navBtnActive]}
            >
              <Text style={[styles.navTag, isActive && styles.navTagActive]}>[{item.tag}]</Text>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.sidebarFooter}>
        <Text style={styles.nodeStatusTitle}>LEDGER NODE STATUS</Text>
        <View style={styles.nodeStatusRow}>
          <View style={styles.nodeDot} />
          <Text style={styles.nodeStatusText}>PRIMARY VALIDATOR: SYNCED</Text>
        </View>
        <Text style={styles.nodeSub}>SHA-256 IMMUTABLE LEDGER ACTIVE</Text>

        <TouchableOpacity onPress={() => router.push('/(web)/terms')} style={styles.termsLinkWrap}>
          <Text style={styles.sidebarTermsText}>TERMS & LEGAL GOVERNANCE →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topbar}>
        <View style={styles.brandRow}>
          {isMobile && (
            <TouchableOpacity
              onPress={() => setIsDrawerOpen(true)}
              style={styles.hamburgerBtn}
              accessibilityLabel="Open Navigation Menu"
            >
              <Text style={styles.hamburgerIcon}>MENU</Text>
            </TouchableOpacity>
          )}
          <View style={styles.sealBox}>
            <OfficialSeal size={28} />
          </View>
          <View>
            <Text style={styles.brandTitle}>PRAMAAN</Text>
            <Text style={styles.brandSubtitle}>
              {isMobile ? 'EVIDENCE LEDGER' : 'NATIONAL DIGITAL EVIDENCE & CHAIN-OF-CUSTODY LEDGER'}
            </Text>
          </View>
        </View>

        {/* Desktop Role Preset Switcher in Header */}
        {!isMobile && (
          <View style={styles.roleSwitcherBar}>
            <Text style={styles.switcherLabel}>ACTIVE ROLE:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rolePillsScroll}>
              {DEMO_ACCOUNTS.map((acc) => {
                const isCurrent = user?.role === acc.role;
                return (
                  <TouchableOpacity
                    key={acc.role}
                    onPress={() => switchDemoRole(acc.role)}
                    style={[styles.rolePill, isCurrent && styles.rolePillActive]}
                  >
                    <Text style={[styles.rolePillText, isCurrent && styles.rolePillTextActive]}>
                      {acc.role.replace(/_/g, ' ')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* User Badge & Actions */}
        <View style={styles.userSection}>
          {!isMobile && (
            <TouchableOpacity onPress={() => router.push('/(web)/profile')} style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name || 'Officer'}</Text>
              <Text style={styles.userMeta}>
                {user?.role.replace(/_/g, ' ')} • {user?.badgeNumber}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => router.push('/(web)/profile')} style={styles.profileBtn}>
            <Text style={styles.profileBtnText}>PROFILE</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(mobile)/home')} style={styles.fieldViewBtn}>
            <Text style={styles.fieldViewText}>MOBILE VIEW</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>LOGOUT</Text>
          </TouchableOpacity>
        </View>
      </View>


      {/* Mobile Sub-header: Role Switcher Bar */}
      {isMobile && (
        <View style={styles.mobileRoleBar}>
          <Text style={styles.mobileRoleLabel}>ROLE:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rolePillsScroll}>
            {DEMO_ACCOUNTS.map((acc) => {
              const isCurrent = user?.role === acc.role;
              return (
                <TouchableOpacity
                  key={acc.role}
                  onPress={() => switchDemoRole(acc.role)}
                  style={[styles.rolePill, isCurrent && styles.rolePillActive]}
                >
                  <Text style={[styles.rolePillText, isCurrent && styles.rolePillTextActive]}>
                    {acc.role.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Main Area: Sidebar + Content */}
      <View style={styles.body}>
        {/* Desktop Sidebar */}
        {!isMobile && <View style={styles.sidebar}>{renderNavContent()}</View>}

        {/* Mobile Navigation Drawer Modal */}
        {isMobile && (
          <Modal
            visible={isDrawerOpen}
            animationType="fade"
            transparent
            onRequestClose={() => setIsDrawerOpen(false)}
          >
            <View style={styles.modalOverlay}>
              <TouchableOpacity
                style={styles.backdrop}
                activeOpacity={1}
                onPress={() => setIsDrawerOpen(false)}
              />
              <View style={styles.drawerSidebar}>{renderNavContent()}</View>
            </View>
          </Modal>
        )}

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
    height: 56,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    zIndex: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hamburgerBtn: {
    padding: 6,
    marginRight: 6,
  },
  hamburgerIcon: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '800',
  },
  sealBox: {
    width: 32,
    height: 32,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sealIcon: {
    fontSize: 16,
    color: colors.primary,
  },
  brandTitle: {
    fontFamily: typography.fontSerif,
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
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
    maxWidth: 580,
  },
  mobileRoleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  mobileRoleLabel: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    marginRight: 6,
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
    paddingVertical: 3,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: 6,
  },
  rolePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rolePillText: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  rolePillTextActive: {
    color: colors.textInverse,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userInfo: {
    alignItems: 'flex-end',
  },
  userName: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  userMeta: {
    fontFamily: typography.fontMono,
    fontSize: 9,
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
  },
  sidebarInner: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  navHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  navSectionHeader: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  closeDrawerBtn: {
    padding: 4,
  },
  closeDrawerText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMuted,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 2,
    marginBottom: 4,
  },
  navBtnActive: {
    backgroundColor: colors.primaryLight,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  navTag: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    marginRight: 8,
  },
  navTagActive: {
    color: colors.primary,
  },
  navLabel: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  navLabelActive: {
    color: colors.primary,
  },
  profileBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: colors.surfaceMuted,
  },
  profileBtnText: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  termsLinkWrap: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sidebarTermsText: {
    fontFamily: typography.fontSans,
    fontSize: 8,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },

  sidebarFooter: {
    backgroundColor: colors.backgroundSubdued,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    borderRadius: 2,
    marginTop: 16,
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
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  drawerSidebar: {
    width: 260,
    height: '100%',
    backgroundColor: colors.surface,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 100,
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
});
