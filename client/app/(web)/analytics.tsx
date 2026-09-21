import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, typography, Panel, DataTable } from '@pramaan/ui';
import { api } from '../../services/api';

export default function AnalyticsScreen() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['analytics-full'],
    queryFn: () => api.getAnalytics(),
  });

  const stateColumns = [
    { key: 'stateName', header: 'STATE', width: 130 },
    { key: 'totalRegistered', header: 'CASES', width: 90 },
    { key: 'underInvestigation', header: 'ACTIVE', width: 90 },
    { key: 'chargeSheetsFiled', header: 'FILED', width: 90 },
    {
      key: 'convictionRatePercent',
      header: 'CONVICTION',
      width: 100,
      render: (item: any) => (
        <Text style={[styles.convRate, { color: item.convictionRatePercent >= 60 ? colors.verified : colors.alert }]}>
          {item.convictionRatePercent}%
        </Text>
      ),
    },
    { key: 'avgDaysToChargeSheet', header: 'AVG DAYS', flex: 1 },
  ];

  const keyMetrics = [
    { label: 'TOTAL CASES', value: stats?.totalCases ?? 0, color: colors.primary },
    { label: 'CHARGE SHEET RATE', value: `${stats?.chargeSheetsFiledRate ?? 0}%`, color: colors.verified },
    { label: 'AVG DAYS TO FILE', value: `${stats?.avgChargeSheetDays ?? 0}d`, color: colors.primary },
    { label: 'LEDGER BLOCKS', value: stats?.totalEvidenceAnchored ?? 0, color: colors.ledgerGold },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>NCRB ANALYTICS</Text>
        <Text style={styles.subtitle}>National crime disposal statistics • De-identified</Text>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsRow}>
        {keyMetrics.map((m, i) => (
          <View key={i} style={[styles.metricCard, { borderLeftColor: m.color }]}>
            <Text style={[styles.metricVal, { color: m.color }]}>{m.value}</Text>
            <Text style={styles.metricLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* State Breakdown Table */}
      <Panel title="STATE BREAKDOWN">
        {stats?.states && stats.states.length > 0 ? (
          <DataTable
            columns={stateColumns}
            data={stats.states}
            keyExtractor={(item) => item.stateCode}
          />
        ) : (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>Statistics will populate as cases are registered.</Text>
          </View>
        )}
      </Panel>

      {/* 2-col: Categories + Monthly */}
      <View style={styles.twoCol}>
        <View style={styles.halfCol}>
          <Panel title="BY CATEGORY">
            {stats?.categories && stats.categories.length > 0 ? (
              stats.categories.map((cat: any, i: number) => (
                <View key={i} style={styles.catRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.catName} numberOfLines={1}>{cat.category}</Text>
                    <Text style={styles.catSec}>{cat.bnsSection}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.catCount}>{cat.caseCount}</Text>
                    <Text style={styles.catRate}>{cat.chargeSheetRate}%</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No category data.</Text>
              </View>
            )}
          </Panel>
        </View>
        <View style={styles.halfCol}>
          <Panel title="MONTHLY TRENDS">
            {stats?.monthlyTrends && stats.monthlyTrends.length > 0 ? (
              stats.monthlyTrends.map((m: any, i: number) => (
                <View key={i} style={styles.trendRow}>
                  <Text style={styles.trendMonth}>{m.month}</Text>
                  <View style={styles.trendValues}>
                    <Text style={styles.trendReported}>{m.reported}</Text>
                    <Text style={styles.trendFiled}>{m.chargeSheeted}</Text>
                    <Text style={styles.trendDisposed}>{m.disposed}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No trend data.</Text>
              </View>
            )}
            {stats?.monthlyTrends && stats.monthlyTrends.length > 0 && (
              <View style={styles.trendLegend}>
                <Text style={styles.trendReported}>■ Reported</Text>
                <Text style={styles.trendFiled}>■ Filed</Text>
                <Text style={styles.trendDisposed}>■ Disposed</Text>
              </View>
            )}
          </Panel>
        </View>
      </View>
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
  convRate: { fontFamily: typography.fontMono, fontSize: 12, fontWeight: '700' },

  twoCol: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  halfCol: { flex: 1, minWidth: 280 },

  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  catName: { fontFamily: typography.fontSans, fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  catSec: { fontFamily: typography.fontMono, fontSize: 9, color: colors.textMuted },
  catCount: { fontFamily: typography.fontMono, fontSize: 12, fontWeight: '700', color: colors.primary },
  catRate: { fontFamily: typography.fontSans, fontSize: 10, color: colors.verified, fontWeight: '600' },

  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  trendMonth: { fontFamily: typography.fontMono, fontSize: 11, fontWeight: '700', color: colors.textPrimary },
  trendValues: { flexDirection: 'row', gap: 10 },
  trendReported: { fontFamily: typography.fontSans, fontSize: 10, color: colors.textMuted },
  trendFiled: { fontFamily: typography.fontSans, fontSize: 10, color: colors.primary, fontWeight: '600' },
  trendDisposed: { fontFamily: typography.fontSans, fontSize: 10, color: colors.verified, fontWeight: '600' },
  trendLegend: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  emptyWrap: { padding: 24, alignItems: 'center' },
  emptyText: { fontFamily: typography.fontSans, fontSize: 11, color: colors.textMuted, textAlign: 'center' },
});
