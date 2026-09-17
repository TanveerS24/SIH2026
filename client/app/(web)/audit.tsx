import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, typography, Panel, DataTable, StatusTag } from '@pramaan/ui';
import { api } from '../../services/api';

export default function AuditTrailScreen() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => api.getAuditLogs(),
  });

  const columns = [
    {
      key: 'timestamp',
      header: 'TIME',
      width: 130,
      render: (item: any) => (
        <Text style={styles.monoText}>
          {new Date(item.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
        </Text>
      ),
    },
    {
      key: 'actor',
      header: 'OFFICER',
      width: 150,
      render: (item: any) => (
        <View>
          <Text style={styles.actorName} numberOfLines={1}>{item.actorName}</Text>
          <Text style={styles.actorRole}>{item.actorRole.replace(/_/g, ' ')}</Text>
        </View>
      ),
    },
    {
      key: 'action',
      header: 'ACTION',
      width: 180,
      render: (item: any) => (
        <View style={styles.actionBadge}>
          <Text style={styles.actionText}>{item.action.replace(/_/g, ' ')}</Text>
        </View>
      ),
    },
    {
      key: 'resource',
      header: 'RESOURCE',
      width: 140,
      render: (item: any) => (
        <View>
          <Text style={styles.resName} numberOfLines={1}>{item.resource}</Text>
          {item.caseNumber && <Text style={styles.caseNum}>{item.caseNumber}</Text>}
        </View>
      ),
    },
    {
      key: 'result',
      header: 'RESULT',
      width: 90,
      render: (item: any) => (
        <StatusTag
          label={item.result}
          variant={item.result === 'SUCCESS' ? 'verified' : item.result === 'BLOCKED' ? 'alert' : 'warning'}
          size="sm"
        />
      ),
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AUDIT TRAIL</Text>
        <Text style={styles.subtitle}>{logs.length} events • Append-only immutable log</Text>
      </View>

      <Panel title={`LOG (${logs.length})`}>
        <DataTable
          columns={columns}
          data={logs}
          keyExtractor={(item) => item.id}
          emptyMessage="No audit events yet."
        />
      </Panel>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  header: { marginBottom: 14 },
  title: {
    fontFamily: typography.fontSerif,
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  subtitle: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  monoText: { fontFamily: typography.fontMono, fontSize: 10, color: colors.textSecondary },
  actorName: { fontFamily: typography.fontSans, fontSize: 11, fontWeight: '700', color: colors.textPrimary },
  actorRole: { fontFamily: typography.fontSans, fontSize: 9, color: colors.textMuted },
  actionBadge: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
  actionText: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  resName: { fontFamily: typography.fontSans, fontSize: 11, fontWeight: '700', color: colors.textPrimary },
  caseNum: { fontFamily: typography.fontMono, fontSize: 9, color: colors.primary },
});
