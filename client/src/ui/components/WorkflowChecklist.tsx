import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography } from '../tokens';
import { WorkflowRequirement } from '@pramaan/shared-types';

export interface WorkflowChecklistProps {
  requirements: WorkflowRequirement[];
  canFile: boolean;
  style?: ViewStyle;
}

export const WorkflowChecklist: React.FC<WorkflowChecklistProps> = ({
  requirements,
  canFile,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CHARGE SHEET FILING STATUTORY PREREQUISITES</Text>
        <View
          style={[
            styles.statusPill,
            canFile ? styles.statusPillReady : styles.statusPillBlocked,
          ]}
        >
          <Text
            style={[
              styles.statusPillText,
              canFile ? styles.statusPillTextReady : styles.statusPillTextBlocked,
            ]}
          >
            {canFile ? '[COMPLIANT] READY FOR JUDICIAL FILING' : '[RESTRICTED] STATUTORY PREREQUISITES INCOMPLETE'}
          </Text>
        </View>
      </View>

      <View style={styles.list}>
        {requirements.map((req, idx) => (
          <View
            key={req.id || idx}
            style={[
              styles.reqRow,
              req.isSatisfied ? styles.reqRowSatisfied : styles.reqRowPending,
            ]}
          >
            <View style={styles.checkCol}>
              <Text
                style={[
                  styles.checkIcon,
                  req.isSatisfied ? styles.checkIconGreen : styles.checkIconRed,
                ]}
              >
                {req.isSatisfied ? 'PASSED' : 'PENDING'}
              </Text>
            </View>
            <View style={styles.contentCol}>

              <View style={styles.reqTitleRow}>
                <Text style={styles.reqTitle}>{req.title}</Text>
                {req.mandatoryForFiling && (
                  <Text style={styles.mandatoryBadge}>MANDATORY</Text>
                )}
              </View>
              <Text style={styles.reqDesc}>{req.description}</Text>
              {req.satisfiedAt && (
                <Text style={styles.satisfiedMeta}>
                  Satisfied on {new Date(req.satisfiedAt).toLocaleString()} by {req.satisfiedBy || 'Authorized Officer'}
                </Text>
              )}
            </View>
          </View>
        ))}
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
    overflow: 'hidden',
    marginBottom: 16,
  },
  header: {
    padding: 12,
    backgroundColor: colors.surfaceSelected,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  headerTitle: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.6,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
    borderWidth: 1,
  },
  statusPillReady: {
    backgroundColor: colors.verifiedLight,
    borderColor: colors.verifiedBorder,
  },
  statusPillBlocked: {
    backgroundColor: colors.alertLight,
    borderColor: colors.alertBorder,
  },
  statusPillText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusPillTextReady: {
    color: colors.verifiedDark,
  },
  statusPillTextBlocked: {
    color: colors.alertDark,
  },
  list: {
    padding: 12,
  },
  reqRow: {
    flexDirection: 'row',
    padding: 10,
    borderWidth: 1,
    borderRadius: 2,
    marginBottom: 8,
  },
  reqRowSatisfied: {
    backgroundColor: colors.verifiedLight,
    borderColor: colors.verifiedBorder,
  },
  reqRowPending: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  checkCol: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkIcon: {
    fontSize: 16,
    fontWeight: '900',
  },
  checkIconGreen: {
    color: colors.verified,
  },
  checkIconRed: {
    color: colors.alert,
  },
  contentCol: {
    flex: 1,
  },
  reqTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reqTitle: {
    fontFamily: typography.fontSans,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  mandatoryBadge: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '800',
    color: colors.alert,
    backgroundColor: colors.alertLight,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.alertBorder,
  },
  reqDesc: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  satisfiedMeta: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.verifiedDark,
    marginTop: 4,
  },
});
