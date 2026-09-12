import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, typography, Panel, StatusTag, DataTable } from '@pramaan/ui';
import { api } from '../../services/api';

export default function AuditTrailScreen() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => api.getAuditLogs(),
  });

  const columns = [
    {
      key: 'timestamp',
      header: 'TIMESTAMP (UTC)',
      width: 170,
      render: (item: any) => (
        <Text style={styles.monoText}>{new Date(item.timestamp).toLocaleString()}</Text>
      ),
    },
    {
      key: 'actor',
      header: 'OFFICER / ACTOR',
      width: 180,
      render: (item: any) => (
        <View>
          <Text style={styles.actorName}>{item.actorName}</Text>
          <Text style={styles.actorRole}>{item.actorRole.replace(/_/g, ' ')}</Text>
        </View>
      ),
    },
    {
      key: 'action',
      header: 'ACTION TRIGGERED',
      width: 220,
      render: (item: any) => (
        <View style={styles.actionBadge}>
          <Text style={styles.actionText}>{item.action.replace(/_/g, ' ')}</Text>
        </View>
      ),
    },
    {
      key: 'resource',
      header: 'RESOURCE & CASE',
      width: 160,
      render: (item: any) => (
        <View>
          <Text style={styles.resName}>{item.resource}</Text>
          {item.caseNumber && <Text style={styles.caseNum}>CASE: {item.caseNumber}</Text>}
        </View>
      ),
    },
    {
      key: 'result',
      header: 'RESULT',
      width: 110,
      render: (item: any) => (
        <StatusTag
          label={item.result}
          variant={item.result === 'SUCCESS' ? 'verified' : item.result === 'BLOCKED' ? 'alert' : 'warning'}
          size="sm"
        />
      ),
    },
    {
      key: 'reason',
      header: 'AUDIT DETAIL & JUSTIFICATION',
      flex: 1,
      render: (item: any) => (
        <Text style={styles.reasonText}>{item.reason || '—'}</Text>
      ),
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>GLOBAL IMMUTABLE AUDIT TRAIL</Text>
        <Text style={styles.subtitle}>
          Append-only security log recording every authentication, case view, upload, signature, and judicial action
        </Text>
      </View>

      <Panel
        title={`AUDIT LOG TRANSACTIONS (${logs.length})`}
        subtitle="Cryptographically verified cross-cutting security event log"
      >
        <DataTable
          columns={columns}
          data={logs}
          keyExtractor={(item) => item.id}
          emptyMessage="No audit records found"
        />
      </Panel>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontFamily: typography.fontSerif,
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  subtitle: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  monoText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textSecondary,
  },
  actorName: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actorRole: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: colors.textMuted,
  },
  actionBadge: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    alignSelf: 'flex-start',
  },
  actionText: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  resName: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  caseNum: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.primary,
  },
  reasonText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textSecondary,
  },
});
