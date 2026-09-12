import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography } from '../tokens';
import { StatusTag, StatusVariant } from './StatusTag';

export interface CaseHeaderProps {
  caseNumber: string;
  title: string;
  status: string;
  statusVariant?: StatusVariant;
  priority: string;
  jurisdiction: string;
  policeStation: string;
  bnsSections: string[];
  assignedOfficerName?: string | null;
  createdAt: string;
  style?: ViewStyle;
}

export const CaseHeader: React.FC<CaseHeaderProps> = ({
  caseNumber,
  title,
  status,
  statusVariant = 'neutral',
  priority,
  jurisdiction,
  policeStation,
  bnsSections,
  assignedOfficerName,
  createdAt,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.topBar}>
        <View style={styles.caseBadge}>
          <Text style={styles.caseLabel}>CASE RECORD</Text>
          <Text style={styles.caseNumber}>{caseNumber}</Text>
        </View>
        <View style={styles.statusRow}>
          <StatusTag label={`PRIORITY: ${priority}`} variant={priority === 'CRITICAL_URGENT' || priority === 'HIGH' ? 'alert' : 'neutral'} size="sm" style={{ marginRight: 6 }} />
          <StatusTag label={status.replace(/_/g, ' ')} variant={statusVariant} size="sm" />
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>JURISDICTION</Text>
          <Text style={styles.metaValue}>{jurisdiction} ({policeStation})</Text>
        </View>

        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>STATUTORY SECTIONS</Text>
          <View style={styles.sectionBadges}>
            {bnsSections.map((s, idx) => (
              <View key={idx} style={styles.secTag}>
                <Text style={styles.secText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>ASSIGNED INVESTIGATOR</Text>
          <Text style={styles.metaValue}>{assignedOfficerName || 'Unassigned / General Registry'}</Text>
        </View>

        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>REGISTERED DATE</Text>
          <Text style={styles.metaValue}>{new Date(createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 2,
    padding: 16,
    marginBottom: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  caseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  caseLabel: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: 6,
    letterSpacing: 0.5,
  },
  caseNumber: {
    fontFamily: typography.fontMono,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontFamily: typography.fontSerif,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginVertical: 6,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    marginTop: 6,
    gap: 16,
  },
  metaItem: {
    minWidth: 160,
  },
  metaLabel: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  sectionBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  secTag: {
    backgroundColor: colors.ledgerGoldLight,
    borderWidth: 1,
    borderColor: colors.ledgerGoldBorder,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 2,
  },
  secText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    fontWeight: '700',
    color: colors.ledgerGold,
  },
});
