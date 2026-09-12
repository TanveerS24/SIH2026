import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography } from '../tokens';
import { CustodyEvent } from '@pramaan/shared-types';

export interface TimelineProps {
  events: CustodyEvent[];
  style?: ViewStyle;
}

export const Timeline: React.FC<TimelineProps> = ({ events, style }) => {
  if (!events || events.length === 0) {
    return (
      <View style={[styles.emptyContainer, style]}>
        <Text style={styles.emptyText}>No custody transactions recorded</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const isAlert =
          event.action === 'INTEGRITY_CHECK_FAILED' ||
          event.action === 'ACCESS_DENIED';
        const isSuccess =
          event.action === 'VERIFIED' ||
          event.action === 'FILED' ||
          event.action === 'SIGNED';

        const dotColor = isAlert
          ? colors.alert
          : isSuccess
          ? colors.verified
          : colors.primary;

        return (
          <View key={event.id || index} style={styles.itemRow}>
            {/* Timeline track & node */}
            <View style={styles.trackCol}>
              <View style={[styles.nodeDot, { backgroundColor: dotColor, borderColor: dotColor }]} />
              {!isLast && <View style={styles.trackLine} />}
            </View>

            {/* Event content box */}
            <View style={styles.contentBox}>
              <View style={styles.topRow}>
                <View style={styles.actionBadge}>
                  <Text style={[styles.actionText, { color: dotColor }]}>
                    {event.action.replace(/_/g, ' ')}
                  </Text>
                </View>
                <Text style={styles.timestampText}>
                  {new Date(event.timestamp).toLocaleString()}
                </Text>
              </View>

              <View style={styles.actorRow}>
                <Text style={styles.actorName}>{event.actorName}</Text>
                <Text style={styles.actorRole}> • {event.actorRole.replace(/_/g, ' ')}</Text>
                {event.actorBadge && (
                  <Text style={styles.actorBadge}> [ID: {event.actorBadge}]</Text>
                )}
              </View>

              {event.documentHash && (
                <View style={styles.hashWrap}>
                  <Text style={styles.hashLabel}>HASH:</Text>
                  <Text style={styles.hashVal} numberOfLines={1}>
                    {event.documentHash}
                  </Text>
                </View>
              )}

              {event.ledgerTxId && (
                <View style={styles.ledgerWrap}>
                  <Text style={styles.ledgerLabel}>LEDGER TX:</Text>
                  <Text style={styles.ledgerVal}>{event.ledgerTxId}</Text>
                </View>
              )}

              {event.metadata && Object.keys(event.metadata).length > 0 && (
                <View style={styles.metaWrap}>
                  {Object.entries(event.metadata).map(([k, v]) => (
                    <Text key={k} style={styles.metaLine}>
                      {k}: {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: typography.fontSans,
    color: colors.textMuted,
    fontSize: 13,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  trackCol: {
    width: 24,
    alignItems: 'center',
    paddingTop: 4,
  },
  nodeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    zIndex: 2,
  },
  trackLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.borderDark,
    marginTop: 4,
    marginBottom: -8,
  },
  contentBox: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    padding: 12,
    marginLeft: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  actionBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timestampText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textMuted,
  },
  actorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    flexWrap: 'wrap',
  },
  actorName: {
    fontFamily: typography.fontSans,
    fontWeight: '700',
    fontSize: 13,
    color: colors.textPrimary,
  },
  actorRole: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textSecondary,
  },
  actorBadge: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textMuted,
  },
  hashWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: colors.surface,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hashLabel: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    marginRight: 6,
  },
  hashVal: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.primary,
    flex: 1,
  },
  ledgerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ledgerLabel: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '700',
    color: colors.ledgerGold,
    marginRight: 6,
  },
  ledgerVal: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.ledgerGold,
  },
  metaWrap: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaLine: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
});
