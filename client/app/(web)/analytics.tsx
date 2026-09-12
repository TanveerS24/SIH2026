import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, typography, Panel, DataTable, StatusTag } from '@pramaan/ui';
import { api } from '../../services/api';

export default function AnalyticsScreen() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['analytics-full'],
    queryFn: () => api.getAnalytics(),
  });

  const stateColumns = [
    { key: 'stateName', header: 'STATE / UT', width: 140 },
    { key: 'totalRegistered', header: 'REGISTERED CASES', width: 150 },
    { key: 'underInvestigation', header: 'INVESTIGATION', width: 140 },
    { key: 'chargeSheetsFiled', header: 'CHARGE SHEETS FILED', width: 160 },
    {
      key: 'convictionRatePercent',
      header: 'CONVICTION RATE',
      width: 140,
      render: (item: any) => (
        <Text style={{ fontWeight: '700', color: colors.verified }}>
          {item.convictionRatePercent}%
        </Text>
      ),
    },
    { key: 'avgDaysToChargeSheet', header: 'AVG DAYS TO FILE', flex: 1 },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Official Heading */}
      <View style={styles.header}>
        <Text style={styles.title}>NATIONAL CRIME RECORDS AGGREGATE ANALYTICS</Text>
        <Text style={styles.subtitle}>
          De-identified crime disposal statistics, statutory disposal metrics, and cross-state trends
        </Text>
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            ⚠ {stats?.disclaimer || 'DEMONSTRATION DATA — NOT OFFICIAL NCRB STATISTICS'}
          </Text>
        </View>
      </View>

      {/* Aggregate Overview Metrics */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>TOTAL RECORDED CASES (NATIONAL)</Text>
          <Text style={styles.metricVal}>{stats?.totalCases || 8582}</Text>
          <Text style={styles.metricSub}>Aggregate synthetic dataset</Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>NATIONAL CHARGE SHEET RATE</Text>
          <Text style={[styles.metricVal, { color: colors.verified }]}>
            {stats?.chargeSheetsFiledRate || 78.4}%
          </Text>
          <Text style={styles.metricSub}>Statutory compliance benchmark</Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>AVERAGE DAYS TO CHARGE SHEET</Text>
          <Text style={[styles.metricVal, { color: colors.primary }]}>
            {stats?.avgChargeSheetDays || 54} Days
          </Text>
          <Text style={styles.metricSub}>Under 60-day statutory limit</Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>BLOCKCHAIN LEDGER BLOCKS</Text>
          <Text style={[styles.metricVal, { color: colors.ledgerGold }]}>
            {stats?.totalEvidenceAnchored || 14}
          </Text>
          <Text style={styles.metricSub}>Immutable audit anchors</Text>
        </View>
      </View>

      {/* State-Level Breakdown */}
      <Panel
        title="STATE / UNION TERRITORY STATISTICAL BREAKDOWN"
        subtitle="De-identified case progression and forensic turnaround by state jurisdiction"
      >
        <DataTable
          columns={stateColumns}
          data={stats?.states || []}
          keyExtractor={(item) => item.stateCode}
        />
      </Panel>

      {/* Category Breakdown & Monthly Trends */}
      <View style={styles.twoColRow}>
        <View style={styles.halfCol}>
          <Panel title="CASES BY STATUTORY CATEGORY" subtitle="BNS & IT Act Section Distribution">
            {stats?.categories?.map((cat: any, i: number) => (
              <View key={i} style={styles.catRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.catName}>{cat.category}</Text>
                  <Text style={styles.catSec}>{cat.bnsSection}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.catCount}>{cat.caseCount} cases</Text>
                  <Text style={styles.catRate}>{cat.chargeSheetRate}% Filed</Text>
                </View>
              </View>
            ))}
          </Panel>
        </View>

        <View style={styles.halfCol}>
          <Panel title="MONTHLY DISPOSAL TRENDS (2026)" subtitle="Reported vs Charge-Sheeted vs Disposed">
            {stats?.monthlyTrends?.map((m: any, i: number) => (
              <View key={i} style={styles.trendRow}>
                <Text style={styles.trendMonth}>{m.month}</Text>
                <View style={styles.trendValues}>
                  <Text style={styles.trendReported}>Reported: {m.reported}</Text>
                  <Text style={styles.trendFiled}>Filed: {m.chargeSheeted}</Text>
                  <Text style={styles.trendDisposed}>Disposed: {m.disposed}</Text>
                </View>
              </View>
            ))}
          </Panel>
        </View>
      </View>
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
  disclaimerBox: {
    backgroundColor: colors.alertLight,
    borderWidth: 1,
    borderColor: colors.alertBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 2,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  disclaimerText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '800',
    color: colors.alertDark,
    letterSpacing: 0.5,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  metricBox: {
    flex: 1,
    minWidth: 200,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    borderRadius: 2,
  },
  metricLabel: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: 6,
  },
  metricVal: {
    fontFamily: typography.fontMono,
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  metricSub: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textSecondary,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  halfCol: {
    flex: 1,
    minWidth: 320,
  },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  catName: {
    fontFamily: typography.fontSans,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  catSec: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textMuted,
  },
  catCount: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  catRate: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.verified,
    fontWeight: '600',
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  trendMonth: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  trendValues: {
    flexDirection: 'row',
    gap: 8,
  },
  trendReported: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textMuted,
  },
  trendFiled: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  trendDisposed: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.verified,
    fontWeight: '600',
  },
});
