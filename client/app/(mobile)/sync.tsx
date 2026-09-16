import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, typography, Panel, Button, StatusTag } from '@pramaan/ui';
import { useSyncStore } from '../../stores/syncStore';

export default function MobileSyncScreen() {
  const { queue, isOffline, isSyncing, triggerSync, clearSynced, toggleOffline } = useSyncStore();

  const pendingCount = queue.filter((i) => i.status === 'QUEUED' || i.status === 'FAILED').length;
  const syncedCount = queue.filter((i) => i.status === 'SYNCED').length;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>SQLITE OFFLINE QUEUE MANAGER</Text>
          <Text style={styles.subtitle}>
            Local encrypted persistence with idempotent background sync
          </Text>
        </View>
      </View>

      {/* Network Status Card & Switcher */}
      <View style={[styles.networkCard, isOffline ? styles.netCardOffline : styles.netCardOnline]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.netTitle, { color: isOffline ? colors.alertDark : colors.verifiedDark }]}>
            {isOffline ? '[OFFLINE] FIELD SENSOR MODE: DISCONNECTED' : '[ONLINE] NETWORK: CONNECTED TO PRAMAAN API'}
          </Text>
          <Text style={styles.netSub}>
            {isOffline
              ? 'New captures are securely persisted in local SQLite with idempotent keys.'
              : 'Queue can be synchronized directly with central ledger.'}
          </Text>
        </View>
        <Button
          title={isOffline ? 'GO ONLINE (RECONNECT)' : 'SIMULATE OFFLINE'}
          onPress={toggleOffline}
          variant={isOffline ? 'verified' : 'secondary'}
          size="sm"
        />
      </View>

      {/* Sync Control Actions */}
      <View style={styles.actionRow}>
        <Button
          title={isSyncing ? 'SYNCHRONIZING...' : `SYNC PENDING RECORDS (${pendingCount}) →`}
          onPress={triggerSync}
          loading={isSyncing}
          disabled={isOffline || pendingCount === 0}
          variant="primary"
          style={{ flex: 2 }}
        />
        {syncedCount > 0 && (
          <Button
            title="CLEAR SYNCED"
            onPress={clearSynced}
            variant="secondary"
            style={{ flex: 1 }}
          />
        )}
      </View>

      {/* Queue Items */}
      <Panel
        title={`ENCRYPTED SQLITE LOCAL QUEUE (${queue.length})`}
        subtitle="Idempotency-protected records stored on this device"
      >
        {queue.map((item) => (
          <View key={item.localId} style={styles.queueCard}>
            <View style={styles.qHeader}>
              <Text style={styles.qOp}>{item.operation}</Text>
              <StatusTag
                label={item.status}
                variant={
                  item.status === 'SYNCED'
                    ? 'verified'
                    : item.status === 'FAILED'
                    ? 'alert'
                    : 'warning'
                }
                size="sm"
              />
            </View>

            <Text style={styles.qTitle}>{item.payload.title || item.payload.fileName}</Text>
            <Text style={styles.qMeta}>
              TYPE: {item.payload.documentType} • RETRIES: {item.retryCount} • RECORDED: {new Date(item.createdAt).toLocaleTimeString()}
            </Text>
            <Text style={styles.qKey}>IDEMPOTENCY KEY: {item.idempotencyKey}</Text>

            {item.serverRecordId && (
              <Text style={styles.qServerId}>SERVER RECORD ID: {item.serverRecordId}</Text>
            )}

            {item.errorMessage && (
              <Text style={styles.qError}>ERROR: {item.errorMessage}</Text>
            )}
          </View>
        ))}

        {queue.length === 0 && (
          <Text style={styles.emptyText}>SQLite offline queue is currently empty.</Text>
        )}
      </Panel>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontFamily: typography.fontSerif,
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  subtitle: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  networkCard: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 2,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  netCardOffline: {
    backgroundColor: colors.alertLight,
    borderColor: colors.alertBorder,
  },
  netCardOnline: {
    backgroundColor: colors.verifiedLight,
    borderColor: colors.verifiedBorder,
  },
  netTitle: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  netSub: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  queueCard: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    borderRadius: 2,
    marginBottom: 10,
  },
  qHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  qOp: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  qTitle: {
    fontFamily: typography.fontSans,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  qMeta: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  qKey: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.primary,
    marginTop: 4,
  },
  qServerId: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.verifiedDark,
    marginTop: 2,
    fontWeight: '700',
  },
  qError: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: colors.alert,
    marginTop: 2,
    fontWeight: '600',
  },
  emptyText: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
