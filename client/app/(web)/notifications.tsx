import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  colors,
  typography,
  Panel,
  Button,
  StatusTag,
  OfficialSeal,
  LoadingScreen,
} from '@pramaan/ui';
import { api, NotificationItem } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'PROFILE' | 'SECURITY' | 'CLEARANCE'>('ALL');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => api.getNotifications(),
    enabled: !!user?.id,
    refetchInterval: 15000, // Poll every 15s for fresh notifications
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'UNREAD') return !item.isRead;
    if (activeTab === 'PROFILE') return item.type === 'PROFILE';
    if (activeTab === 'SECURITY') return item.type === 'SECURITY';
    if (activeTab === 'CLEARANCE') return item.type === 'CLEARANCE';
    return true;
  });

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getTypeVariant = (type: NotificationItem['type']): 'verified' | 'alert' | 'warning' | 'neutral' => {
    switch (type) {
      case 'PROFILE':
        return 'verified';
      case 'SECURITY':
        return 'warning';
      case 'CLEARANCE':
        return 'neutral';
      case 'ASSIGNMENT':
        return 'alert';
      default:
        return 'neutral';
    }
  };

  if (isLoading) {
    return (
      <ScrollView contentContainerStyle={[styles.container, isMobile && styles.containerMobile]}>
        <LoadingScreen
          message="Loading Confidential Notifications..."
          subMessage="Fetching encrypted profile activity logs and security alerts"
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, isMobile && styles.containerMobile]}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <OfficialSeal size={isMobile ? 32 : 40} />
          <View style={styles.headerTextWrap}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>OFFICER ACTIVITY & PROFILE NOTIFICATIONS</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount} NEW</Text>
                </View>
              )}
            </View>
            <Text style={styles.subtitle}>
              Restricted alerts & statutory profile ledger events for{' '}
              <Text style={styles.highlightOfficer}>
                {user?.name} ({user?.badgeNumber})
              </Text>{' '}
              alone
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <Button
              title="MARK ALL AS READ"
              onPress={() => markAllMutation.mutate()}
              variant="outline"
              size="sm"
              loading={markAllMutation.isPending}
            />
          )}
          <Button
            title="VIEW PROFILE →"
            onPress={() => router.push('/(web)/profile')}
            variant="ghost"
            size="sm"
          />
        </View>
      </View>

      {/* Strict Isolation Notice Box */}
      <View style={styles.privacyBox}>
        <View style={styles.privacyIconWrap}>
          <Text style={styles.privacyIcon}>🔒</Text>
        </View>
        <View style={styles.privacyTextWrap}>
          <Text style={styles.privacyTitle}>
            INDIVIDUAL PRIVACY ENCLAVE • DPDPA & SEC 72 IT ACT ENFORCED
          </Text>
          <Text style={styles.privacyBody}>
            These notifications are cryptographically scoped exclusively to your authenticated identity.
            No other officer, supervisor, or cadre has access to this individual activity ledger.
          </Text>
        </View>
      </View>

      {/* Tabs Filter Bar */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'ALL' && styles.tabBtnActive]}
            onPress={() => setActiveTab('ALL')}
          >
            <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive]}>
              ALL ({notifications.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'UNREAD' && styles.tabBtnActive]}
            onPress={() => setActiveTab('UNREAD')}
          >
            <Text style={[styles.tabText, activeTab === 'UNREAD' && styles.tabTextActive]}>
              UNREAD ({unreadCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'PROFILE' && styles.tabBtnActive]}
            onPress={() => setActiveTab('PROFILE')}
          >
            <Text style={[styles.tabText, activeTab === 'PROFILE' && styles.tabTextActive]}>
              PROFILE UPDATES ({notifications.filter((n) => n.type === 'PROFILE').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'SECURITY' && styles.tabBtnActive]}
            onPress={() => setActiveTab('SECURITY')}
          >
            <Text style={[styles.tabText, activeTab === 'SECURITY' && styles.tabTextActive]}>
              SECURITY & SESSIONS ({notifications.filter((n) => n.type === 'SECURITY').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'CLEARANCE' && styles.tabBtnActive]}
            onPress={() => setActiveTab('CLEARANCE')}
          >
            <Text style={[styles.tabText, activeTab === 'CLEARANCE' && styles.tabTextActive]}>
              CLEARANCES ({notifications.filter((n) => n.type === 'CLEARANCE').length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Notification Stream Panel */}
      <Panel
        title={`PERSONAL NOTIFICATION LOG (${filteredNotifications.length})`}
        subtitle="Chronological sequence of credential modifications, logins, and authorizations"
        variant="ledger"
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>NO NOTIFICATIONS RECORDED</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'UNREAD'
                ? 'All official notifications have been marked as read.'
                : 'Any new updates to your profile, security credentials, or access clearances will appear here.'}
            </Text>
          </View>
        ) : (
          <View style={styles.cardList}>
            {filteredNotifications.map((n) => {
              const variant = getTypeVariant(n.type);
              return (
                <TouchableOpacity
                  key={n.id}
                  style={[
                    styles.notifCard,
                    !n.isRead && styles.notifCardUnread,
                  ]}
                  onPress={() => {
                    if (!n.isRead) markReadMutation.mutate(n.id);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.tagGroup}>
                      {!n.isRead && <View style={styles.unreadDot} />}
                      <StatusTag label={n.type} variant={variant} size="sm" />
                      <Text style={styles.cardTitle}>{n.title}</Text>
                    </View>
                    <Text style={styles.cardTime}>{formatTimestamp(n.createdAt)}</Text>
                  </View>

                  <Text style={styles.cardMessage}>{n.message}</Text>

                  {n.metadata && (
                    <View style={styles.metadataBox}>
                      {n.metadata.caseNumber && (
                        <Text style={styles.metadataItem}>
                          <Text style={styles.metaKey}>CASE REF: </Text>
                          {n.metadata.caseNumber}
                        </Text>
                      )}
                      {n.metadata.status && (
                        <Text style={styles.metadataItem}>
                          <Text style={styles.metaKey}>STATUS: </Text>
                          {n.metadata.status}
                        </Text>
                      )}
                    </View>
                  )}

                  {!n.isRead && (
                    <View style={styles.cardFooter}>
                      <Text style={styles.markReadPrompt}>
                        [CLICK TO MARK AS ACKNOWLEDGED]
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </Panel>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    maxWidth: '100%',
  },
  containerMobile: {
    padding: 12,
  },
  header: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 260,
  },
  headerTextWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  unreadBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  highlightOfficer: {
    color: colors.primary,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  privacyBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  privacyIconWrap: {
    marginTop: 1,
  },
  privacyIcon: {
    fontSize: 16,
  },
  privacyTextWrap: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  privacyBody: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  tabBar: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabScroll: {
    flexDirection: 'row',
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 6,
  },
  tabBtnActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  cardList: {
    gap: 12,
  },
  notifCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    borderRadius: 4,
  },
  notifCardUnread: {
    borderColor: 'rgba(245, 158, 11, 0.5)',
    backgroundColor: 'rgba(245, 158, 11, 0.03)',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardTime: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: typography.fontMono,
  },
  cardMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 6,
  },
  metadataBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 8,
    borderRadius: 4,
    marginTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metadataItem: {
    fontSize: 11,
    color: colors.textPrimary,
    fontFamily: typography.fontMono,
  },
  metaKey: {
    color: colors.textMuted,
  },
  cardFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  markReadPrompt: {
    fontSize: 10,
    color: '#f59e0b',
    fontWeight: '600',
    fontFamily: typography.fontMono,
  },
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 400,
    lineHeight: 18,
  },
});
