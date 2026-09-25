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
import { useQuery } from '@tanstack/react-query';
import { colors, typography, OfficialSeal } from '@pramaan/ui';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';

export default function WebLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isCompact = width < 1120;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: notifData } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => api.getNotifications(),
    enabled: !!user?.id,
    refetchInterval: 15000,
  });
  const unreadCount = notifData?.unreadCount || 0;

  const navItems = [
    { label: 'DASHBOARD', path: '/(web)/dashboard', tag: 'DASH' },
    { label: 'CASE REGISTER', path: '/(web)/cases', tag: 'CASES' },
    { label: 'INTELLIGENCE SEARCH', path: '/(web)/search', tag: 'SEARCH' },
    { label: 'GLOBAL AUDIT TRAIL', path: '/(web)/audit', tag: 'AUDIT' },
    { label: 'NCRB ANALYTICS', path: '/(web)/analytics', tag: 'STATS' },
    { label: 'ACCESS REQUESTS', path: '/(web)/access-requests', tag: 'ACCESS' },
    {
      label: 'NOTIFICATIONS',
      path: '/(web)/notifications',
      tag: 'ALERTS',
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
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
              <Text style={styles.closeDrawerText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {isMobile && user && (
          <View style={styles.drawerOfficerCard}>
            <View style={styles.drawerOfficerAvatar}>
              <OfficialSeal size={28} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.drawerOfficerName}>{user.name}</Text>
              <Text style={styles.drawerOfficerMeta}>
                {user.role.replace(/_/g, ' ')} • {user.badgeNumber}
              </Text>
            </View>
          </View>
        )}

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
              {item.badge ? (
                <View style={styles.navItemBadge}>
                  <Text style={styles.navItemBadgeText}>{item.badge}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      <View>
        {isMobile && (
          <View style={styles.drawerQuickActions}>
            <TouchableOpacity
              onPress={() => handleNav('/(mobile)/home')}
              style={styles.drawerFieldBtn}
            >
              <Text style={styles.drawerFieldText}>SWITCH TO MOBILE FIELD VIEW →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={logout}
              style={styles.drawerLogoutBtn}
            >
              <Text style={styles.drawerLogoutText}>LOGOUT FROM SESSION</Text>
            </TouchableOpacity>
          </View>
        )}

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
              <View style={styles.hamburgerLines}>
                <View style={styles.hamburgerLine} />
                <View style={styles.hamburgerLine} />
                <View style={styles.hamburgerLine} />
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => router.push('/(web)/dashboard')}
            style={styles.brandTouchable}
            activeOpacity={0.8}
          >
            <View style={styles.sealBox}>
              <OfficialSeal size={28} />
            </View>
            <View style={styles.brandTextCol}>
              <Text style={styles.brandTitle}>PRAMAAN</Text>
              <Text style={styles.brandSubtitle} numberOfLines={1}>
                {isMobile ? 'EVIDENCE LEDGER' : 'NATIONAL DIGITAL EVIDENCE & CHAIN-OF-CUSTODY LEDGER'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>



        {/* User Badge & Actions */}
        {isMobile ? (
          <View style={styles.mobileActionsRow}>
            <TouchableOpacity
              onPress={() => router.push('/(web)/notifications')}
              style={[styles.mobileNotifBtn, unreadCount > 0 && styles.mobileNotifBtnUnread]}
              accessibilityLabel="Notifications"
            >
              <Text style={styles.mobileNotifIcon}>🔔</Text>
              {unreadCount > 0 && (
                <View style={styles.mobileNotifBadge}>
                  <Text style={styles.mobileNotifBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(web)/profile')}
              style={styles.mobileCadrePill}
              activeOpacity={0.7}
            >
              <Text style={styles.mobileCadreText} numberOfLines={1}>
                {user?.role ? user.role.replace(/_/g, ' ') : 'OFFICER'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={styles.mobileLogoutBtn}>
              <Text style={styles.mobileLogoutText}>LOGOUT</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.userSection}>
            <TouchableOpacity onPress={() => router.push('/(web)/profile')} style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name || 'Officer'}</Text>
              <Text style={styles.userMeta}>
                {user?.role.replace(/_/g, ' ')} • {user?.badgeNumber}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(web)/notifications')}
              style={[styles.notifBtn, unreadCount > 0 && styles.notifBtnHasUnread]}
            >
              <Text style={styles.notifBtnIcon}>🔔</Text>
              <Text style={[styles.notifBtnText, unreadCount > 0 && styles.notifBtnTextUnread]}>
                {unreadCount > 0 ? `ALERTS (${unreadCount})` : 'ALERTS'}
              </Text>
            </TouchableOpacity>
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
        )}
      </View>



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
    minHeight: 56,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  brandTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  hamburgerBtn: {
    width: 34,
    height: 34,
    borderRadius: 2,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  hamburgerLines: {
    width: 16,
    height: 11,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: 16,
    height: 1.5,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  sealBox: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: typography.fontSerif,
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
    lineHeight: 18,
  },
  brandSubtitle: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 1,
  },

  mobileActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mobileCadrePill: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    maxWidth: 180,
  },
  mobileCadreText: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.4,
  },
  mobileLogoutBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: colors.backgroundSubdued,
  },
  mobileLogoutText: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '800',
    color: colors.alertDark,
    letterSpacing: 0.5,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userInfo: {
    alignItems: 'flex-end',
    marginRight: 4,
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
    marginTop: 1,
  },
  notifBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: colors.surfaceMuted,
    gap: 4,
  },
  notifBtnHasUnread: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  notifBtnIcon: {
    fontSize: 10,
  },
  notifBtnText: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  notifBtnTextUnread: {
    color: '#f59e0b',
    fontWeight: '800',
  },
  mobileNotifBtn: {
    position: 'relative',
    padding: 6,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: colors.surfaceMuted,
  },
  mobileNotifBtnUnread: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  mobileNotifIcon: {
    fontSize: 12,
  },
  mobileNotifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  mobileNotifBadgeText: {
    fontFamily: typography.fontSans,
    fontSize: 8,
    fontWeight: '800',
    color: '#000',
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
    letterSpacing: 0.5,
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
    letterSpacing: 0.5,
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
    color: colors.alertDark,
    letterSpacing: 0.5,
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
    paddingVertical: 14,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  navHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
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
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
  },
  drawerOfficerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    borderRadius: 2,
    marginBottom: 12,
    gap: 8,
  },
  drawerOfficerAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerOfficerName: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  drawerOfficerMeta: {
    fontFamily: typography.fontMono,
    fontSize: 8,
    color: colors.textSecondary,
    marginTop: 2,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 2,
    marginBottom: 3,
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
  navItemBadge: {
    marginLeft: 'auto',
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  navItemBadgeText: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '800',
    color: '#000',
  },
  drawerQuickActions: {
    gap: 6,
    marginBottom: 10,
  },
  drawerFieldBtn: {
    backgroundColor: colors.ledgerGoldLight,
    borderWidth: 1,
    borderColor: colors.ledgerGoldBorder,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 2,
    alignItems: 'center',
  },
  drawerFieldText: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '800',
    color: colors.ledgerGold,
    letterSpacing: 0.4,
  },
  drawerLogoutBtn: {
    backgroundColor: colors.backgroundSubdued,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 2,
    alignItems: 'center',
  },
  drawerLogoutText: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '800',
    color: colors.alertDark,
    letterSpacing: 0.4,
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
    width: 270,
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
  },
});
