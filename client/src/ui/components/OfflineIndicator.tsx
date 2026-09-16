import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, typography } from '../tokens';
import { SyncItem } from '@pramaan/shared-types';

export interface OfflineIndicatorProps {
  isOffline: boolean;
  queuedCount: number;
  onSyncPress?: () => void;
  isSyncing?: boolean;
  style?: ViewStyle;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOffline,
  queuedCount,
  onSyncPress,
  isSyncing = false,
  style,
}) => {
  if (!isOffline && queuedCount === 0 && !isSyncing) {
    return null;
  }

  const bgColor = isOffline ? colors.alertLight : colors.ledgerGoldLight;
  const borderColor = isOffline ? colors.alertBorder : colors.ledgerGoldBorder;
  const textColor = isOffline ? colors.alertDark : colors.ledgerGold;

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor }, style]}>
      <View style={styles.textWrap}>
        <Text style={[styles.statusText, { color: textColor }]}>
          {isOffline ? '[OFFLINE] FIELD SENSOR MODE' : isSyncing ? '[SYNCING] PROCESSING QUEUE...' : '[ONLINE] PENDING SYNC'}
        </Text>
        <Text style={[styles.detailText, { color: textColor }]}>
          {queuedCount} record{queuedCount !== 1 ? 's' : ''} in local encrypted SQLite queue
        </Text>
      </View>
      {!isOffline && queuedCount > 0 && onSyncPress && (
        <TouchableOpacity
          onPress={onSyncPress}
          disabled={isSyncing}
          style={styles.syncBtn}
        >
          <Text style={styles.syncBtnText}>{isSyncing ? 'SYNCING...' : 'SYNC NOW'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export interface SyncQueueViewProps {
  items: SyncItem[];
  onTriggerSync?: () => void;
  isSyncing?: boolean;
  style?: ViewStyle;
}

export const SyncQueueView: React.FC<SyncQueueViewProps> = ({
  items,
  onTriggerSync,
  isSyncing = false,
  style,
}) => {
  return (
    <View style={[styles.queueContainer, style]}>
      <View style={styles.queueHeader}>
        <Text style={styles.queueTitle}>OFFLINE LOCAL QUEUE (SQLITE)</Text>
        {onTriggerSync && (
          <TouchableOpacity
            onPress={onTriggerSync}
            disabled={isSyncing || items.length === 0}
            style={[styles.syncBtn, (isSyncing || items.length === 0) && { opacity: 0.5 }]}
          >
            <Text style={styles.syncBtnText}>{isSyncing ? 'SYNCING...' : 'SYNC ALL'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyQueue}>
          <Text style={styles.emptyQueueText}>All local records synchronized with server</Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.localId} style={styles.queueItem}>
            <View style={styles.itemMain}>
              <View style={styles.itemHeader}>
                <Text style={styles.opText}>{item.operation}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'SYNCED'
                      ? styles.badgeSynced
                      : item.status === 'FAILED'
                      ? styles.badgeFailed
                      : styles.badgeQueued,
                  ]}
                >
                  <Text style={styles.statusBadgeText}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.itemTitle}>{item.payload.title || item.payload.fileName}</Text>
              <Text style={styles.idempotencyText}>KEY: {item.idempotencyKey}</Text>
              {item.errorMessage && (
                <Text style={styles.errorText}>Error: {item.errorMessage}</Text>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 2,
    marginBottom: 12,
  },
  textWrap: {
    flex: 1,
  },
  statusText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  detailText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    marginTop: 2,
  },
  syncBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 2,
    marginLeft: 8,
  },
  syncBtnText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textInverse,
  },
  queueContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors.surfaceMuted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  queueTitle: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  emptyQueue: {
    padding: 24,
    alignItems: 'center',
  },
  emptyQueueText: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  queueItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemMain: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  opText: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    borderWidth: 1,
  },
  badgeQueued: {
    backgroundColor: colors.backgroundSubdued,
    borderColor: colors.borderDark,
  },
  badgeSynced: {
    backgroundColor: colors.verifiedLight,
    borderColor: colors.verifiedBorder,
  },
  badgeFailed: {
    backgroundColor: colors.alertLight,
    borderColor: colors.alertBorder,
  },
  statusBadgeText: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  itemTitle: {
    fontFamily: typography.fontSans,
    fontSize: 13,
    color: colors.textPrimary,
  },
  idempotencyText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  errorText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.alert,
    marginTop: 2,
  },
});
