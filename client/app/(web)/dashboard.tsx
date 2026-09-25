import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors, typography, Panel, StatusTag, Button, RegisterRow, LoadingScreen } from '@pramaan/ui';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => api.getCases(),
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => api.getAnalytics(),
  });

  if (casesLoading || analyticsLoading) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <LoadingScreen
          message="Loading Dashboard & Evidence Overview..."
          subMessage="Fetching active cases, conviction statistics, and ledger status"
        />
      </ScrollView>
    );
  }

  const role = user?.role;
  const isIO = role === 'INVESTIGATION_OFFICER';
  const isProsecutor = role === 'PROSECUTOR';
  const isJudge = role === 'JUDGE';
  const isAnalyst = role === 'NCRB_ANALYST';

  const metrics = [
    {
      label: 'ACTIVE CASES',
      value: cases.length,
      color: colors.primary,
    },
    {
      label: 'EVIDENCE ANCHORED',
      value: analytics?.totalEvidenceAnchored || 0,
      color: colors.verified,
    },
    {
      label: 'CHARGE SHEET RATE',
      value: `${analytics?.chargeSheetsFiledRate || 0}%`,
      color: colors.primary,
    },
    {
      label: 'TAMPER ALERTS',
      value: analytics?.evidenceTamperAlerts || 0,
      color: colors.alert,
    },
  ];

  const actions: Record<string, { title: string; path: string; variant: any }[]> = {
    INVESTIGATION_OFFICER: [
      { title: 'Register New Case', path: '/(web)/cases', variant: 'primary' },
      { title: 'Search Evidence', path: '/(web)/search', variant: 'secondary' },
      { title: 'Workflows', path: '/(web)/cases', variant: 'outline' },
    ],
    PROSECUTOR: [
      { title: 'Pending Charge Sheets', path: '/(web)/cases', variant: 'verified' },
      { title: 'Verify Document Hashes', path: '/(web)/cases', variant: 'secondary' },
      { title: 'Audit Trail', path: '/(web)/audit', variant: 'outline' },
    ],
    JUDGE: [
      { title: 'Filed Cases', path: '/(web)/cases', variant: 'primary' },
      { title: 'Verify Documents', path: '/(web)/cases', variant: 'secondary' },
      { title: 'Audit Logs', path: '/(web)/audit', variant: 'outline' },
    ],
    NCRB_ANALYST: [
      { title: 'NCRB Statistics', path: '/(web)/analytics', variant: 'primary' },
      { title: 'Request Case Access', path: '/(web)/access-requests', variant: 'secondary' },
      { title: 'Intelligence Search', path: '/(web)/search', variant: 'outline' },
    ],
  };

  const currentActions = actions[role || ''] || [];

  return (
    <ScrollView contentContainerStyle={[styles.container, isMobile && { padding: 12 }]}>
      {/* Officer Banner */}
      <View style={[styles.banner, isMobile && styles.bannerMobile]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.welcomeName}>{user?.name?.toUpperCase()}</Text>
          <Text style={styles.welcomeMeta}>{user?.department} • {user?.jurisdiction}</Text>
        </View>
        <StatusTag label={role?.replace(/_/g, ' ') || ''} variant="info" />
      </View>

      {/* Metrics */}
      <View style={styles.metricsRow}>
        {metrics.map((m, i) => (
          <View key={i} style={[styles.metricCard, { borderLeftColor: m.color }]}>
            <Text style={[styles.metricVal, { color: m.color }]}>{m.value}</Text>
            <Text style={styles.metricLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      {currentActions.length > 0 && (
        <View style={styles.actionsRow}>
          {currentActions.map((a, i) => (
            <Button
              key={i}
              title={a.title}
              onPress={() => router.push(a.path as any)}
              variant={a.variant}
              size="sm"
            />
          ))}
        </View>
      )}

      {/* Recent Cases */}
      <Panel
        title="RECENT CASES"
        action={
          <Button
            title="All cases →"
            onPress={() => router.push('/(web)/cases')}
            variant="ghost"
            size="sm"
          />
        }
      >
        {cases.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No cases registered yet.</Text>
            {isIO && (
              <Button
                title="Register first case →"
                onPress={() => router.push('/(web)/cases')}
                variant="primary"
                size="sm"
                style={{ marginTop: 10 }}
              />
            )}
          </View>
        ) : (
          cases.slice(0, 4).map((c) => (
            <RegisterRow
              key={c.id}
              id={c.id}
              primaryCode={c.caseNumber}
              title={c.title}
              subtitle={`${c.jurisdiction} • ${c.policeStation}`}
              statusLabel={c.status.replace(/_/g, ' ')}
              statusVariant={
                c.status === 'FILED' ? 'filed' :
                c.status === 'CHARGE_SHEET_PREPARED' ? 'gold' : 'info'
              }
              metadataItems={[
                { label: 'DOCS', value: String(c.documentCount) },
                { label: 'CHAIN', value: String(c.custodyCount) },
              ]}
              date={new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              onPress={() => router.push(`/(web)/cases/${c.id}` as any)}
            />
          ))
        )}
      </Panel>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },

  banner: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  bannerMobile: { flexWrap: 'wrap' },
  welcomeName: {
    fontFamily: typography.fontSerif,
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  welcomeMeta: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },

  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  metricCard: {
    flex: 1,
    minWidth: 120,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderRadius: 4,
    padding: 12,
  },
  metricVal: {
    fontFamily: typography.fontMono,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  metricLabel: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.4,
  },

  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 12,
  },

  emptyState: { padding: 28, alignItems: 'center' },
  emptyText: { fontFamily: typography.fontSans, fontSize: 12, color: colors.textMuted },
});
