import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors, typography, Panel, DataTable, StatusTag, LoadingScreen, Button } from '@pramaan/ui';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

export default function AuditTrailScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isPermitted = user?.role === 'JUDGE' || user?.role === 'PROSECUTOR' || user?.role === 'NCRB_ANALYST';

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => api.getAuditLogs(),
    enabled: isPermitted,
  });

  const columns = [
    {
      key: 'timestamp',
      header: 'TIME',
      width: 120,
      render: (item: any) => (
        <Text style={styles.monoText}>
          {new Date(item.timestamp).toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })}
        </Text>
      ),
    },
    {
      key: 'actor',
      header: 'OFFICER',
      width: 140,
      render: (item: any) => (
        <Text style={styles.actorName} numberOfLines={1}>{item.actorName}</Text>
      ),
    },
    {
      key: 'action',
      header: 'ACTION',
      width: 150,
      render: (item: any) => (
        <View style={styles.actionBadge}>
          <Text style={styles.actionText} numberOfLines={1}>{item.action.replace(/_/g, ' ')}</Text>
        </View>
      ),
    },
    {
      key: 'resource',
      header: 'RESOURCE',
      width: 120,
      render: (item: any) => (
        <View>
          <Text style={styles.resName} numberOfLines={1}>{item.resource}</Text>
          {item.caseNumber && <Text style={styles.caseNum} numberOfLines={1}>{item.caseNumber}</Text>}
        </View>
      ),
    },
    {
      key: 'result',
      header: 'RESULT',
      width: 80,
      render: (item: any) => (
        <StatusTag
          label={item.result}
          variant={item.result === 'SUCCESS' ? 'verified' : item.result === 'BLOCKED' ? 'alert' : 'warning'}
          size="sm"
        />
      ),
    },
  ];

  if (!isPermitted) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.restrictedCard}>
          <Text style={styles.restrictedBadge}>[RBAC POLICY ENFORCEMENT]</Text>
          <Text style={styles.restrictedTitle}>GLOBAL AUDIT TRAIL ACCESS RESTRICTED</Text>
          <Text style={styles.restrictedText}>
            Access to cross-jurisdictional system audit telemetry is strictly restricted to Judicial Magistrates, State Prosecutors, and NCRB Compliance Analysts.
          </Text>
          <Text style={styles.restrictedSubText}>
            Field Officers ({user?.role ? user.role.replace(/_/g, ' ') : 'OFFICER'}) may inspect case-specific chain of custody and evidentiary audit logs directly within their assigned case files under the Case Register.
          </Text>
          <Button
            title="← Return to Case Register"
            onPress={() => router.push('/(web)/cases')}
            variant="primary"
            style={{ marginTop: 14, alignSelf: 'flex-start' }}
          />
        </View>
      </ScrollView>
    );
  }

  if (isLoading) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <LoadingScreen
          message="Loading Immutable Audit Logs..."
          subMessage="Fetching tamper-evident ledger activity records"
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AUDIT TRAIL</Text>
        <Text style={styles.subtitle}>{logs.length} events • Append-only immutable log</Text>
      </View>

      <Panel
        title={`LOG (${logs.length})`}
        contentStyle={styles.panelContent}
        style={styles.panelWrap}
      >
        <DataTable
          columns={columns}
          data={logs}
          keyExtractor={(item) => item.id}
          emptyMessage="No audit events recorded yet."
        />
      </Panel>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    maxWidth: '100%',
  },
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
  panelWrap: {
    maxWidth: '100%',
    overflow: 'hidden',
  },
  panelContent: {
    padding: 0,
    overflow: 'hidden',
  },
  monoText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textSecondary,
  },
  actorName: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actionBadge: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 6,
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
  resName: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  caseNum: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.primary,
  },
  restrictedCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 3,
    padding: 24,
    marginTop: 20,
    maxWidth: 720,
  },
  restrictedBadge: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    fontWeight: '800',
    color: colors.alertDark,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  restrictedTitle: {
    fontFamily: typography.fontSerif,
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  restrictedText: {
    fontFamily: typography.fontSans,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  restrictedSubText: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
