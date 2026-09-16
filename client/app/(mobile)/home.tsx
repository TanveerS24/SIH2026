import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, Panel, Button, StatusTag } from '@pramaan/ui';
import { useAuthStore } from '../../stores/authStore';
import { useSyncStore } from '../../stores/syncStore';

export default function MobileHomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { queue, isOffline } = useSyncStore();

  const recentQueue = queue.slice(0, 3);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Officer ID Header */}
      <View style={styles.officerCard}>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>ID</Text>
        </View>
        <View style={styles.officerDetails}>
          <Text style={styles.officerName}>{user?.name}</Text>
          <Text style={styles.officerBadge}>
            BADGE: {user?.badgeNumber} • {user?.jurisdiction}
          </Text>
          <Text style={styles.officerDept}>{user?.department}</Text>
        </View>
      </View>

      {/* Big Action Button: Capture Evidence */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push('/(mobile)/new-record/capture')}
        style={styles.primaryActionCard}
      >
        <View style={styles.primaryActionIconBox}>
          <Text style={styles.primaryActionIcon}>[REC]</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.primaryActionTitle}>CAMERA-FIRST EVIDENCE CAPTURE</Text>
          <Text style={styles.primaryActionSub}>
            Capture photo exhibit, run live OCR classification, record digital witness statement
          </Text>
        </View>
        <Text style={styles.primaryActionArrow}>→</Text>
      </TouchableOpacity>

      {/* Quick Status Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>LOCAL QUEUE (SQLITE)</Text>
          <Text style={styles.statVal}>{queue.length}</Text>
          <Text style={styles.statSub}>
            {isOffline ? 'Queued offline' : 'Pending server sync'}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>DEVICE STATUS</Text>
          <Text style={[styles.statVal, { color: isOffline ? colors.alert : colors.verified }]}>
            {isOffline ? 'OFFLINE' : 'ONLINE'}
          </Text>
          <Text style={styles.statSub}>
            {isOffline ? 'Local storage active' : 'API connected'}
          </Text>
        </View>
      </View>

      {/* Recent Local Records */}
      <Panel
        title="RECENT LOCAL SUBMISSIONS"
        subtitle="Records captured on this handset"
        action={
          <Button
            title="VIEW QUEUE →"
            onPress={() => router.push('/(mobile)/sync')}
            variant="ghost"
            size="sm"
          />
        }
      >
        {recentQueue.map((item) => (
          <View key={item.localId} style={styles.recordItem}>
            <View style={styles.recHeader}>
              <Text style={styles.recTitle}>{item.payload.title || item.payload.fileName}</Text>
              <StatusTag
                label={item.status}
                variant={item.status === 'SYNCED' ? 'verified' : item.status === 'FAILED' ? 'alert' : 'neutral'}
                size="sm"
              />
            </View>
            <Text style={styles.recMeta}>
              {item.payload.documentType} • {new Date(item.createdAt).toLocaleTimeString()}
            </Text>
            <Text style={styles.recKey}>KEY: {item.idempotencyKey}</Text>
          </View>
        ))}

        {recentQueue.length === 0 && (
          <Text style={styles.emptyText}>No field records captured yet on this device.</Text>
        )}
      </Panel>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  officerCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 2,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontFamily: typography.fontMono,
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  officerDetails: {
    flex: 1,
  },
  officerName: {
    fontFamily: typography.fontSerif,
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  officerBadge: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  officerDept: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: colors.textMuted,
  },
  primaryActionCard: {
    backgroundColor: colors.primary,
    borderRadius: 2,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  primaryActionIconBox: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionIcon: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    fontWeight: '800',
    color: colors.textInverse,
  },
  primaryActionTitle: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: 0.5,
  },
  primaryActionSub: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.primaryLight,
    marginTop: 2,
  },
  primaryActionArrow: {
    fontSize: 20,
    color: colors.textInverse,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    borderRadius: 2,
  },
  statLabel: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: 4,
  },
  statVal: {
    fontFamily: typography.fontMono,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statSub: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  recordItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recTitle: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  recMeta: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  recKey: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.primary,
    marginTop: 2,
  },
  emptyText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
