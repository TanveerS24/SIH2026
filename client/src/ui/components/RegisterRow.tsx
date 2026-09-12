import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, typography } from '../tokens';
import { StatusTag, StatusVariant } from './StatusTag';

export interface RegisterRowProps {
  id: string;
  primaryCode: string;
  title: string;
  subtitle?: string;
  statusLabel: string;
  statusVariant?: StatusVariant;
  metadataItems?: { label: string; value: string }[];
  date?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export const RegisterRow: React.FC<RegisterRowProps> = ({
  primaryCode,
  title,
  subtitle,
  statusLabel,
  statusVariant = 'neutral',
  metadataItems = [],
  date,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.container, style]}
    >
      <View style={styles.leftBorder} />
      <View style={styles.mainContent}>
        <View style={styles.headerLine}>
          <Text style={styles.codeText}>{primaryCode}</Text>
          <StatusTag label={statusLabel} variant={statusVariant} size="sm" />
        </View>

        <Text style={styles.titleText}>{title}</Text>
        {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}

        {metadataItems.length > 0 && (
          <View style={styles.metaRow}>
            {metadataItems.map((meta, i) => (
              <View key={i} style={styles.metaBadge}>
                <Text style={styles.metaLabel}>{meta.label}:</Text>
                <Text style={styles.metaVal}>{meta.value}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {date && (
        <View style={styles.dateCol}>
          <Text style={styles.dateText}>{date}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    marginBottom: 8,
    padding: 12,
    alignItems: 'center',
  },
  leftBorder: {
    width: 3,
    backgroundColor: colors.primary,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  mainContent: {
    flex: 1,
    paddingLeft: 6,
  },
  headerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  codeText: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  titleText: {
    fontFamily: typography.fontSerif,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  subtitleText: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 6,
  },
  metaBadge: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSubdued,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaLabel: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginRight: 4,
  },
  metaVal: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: colors.textPrimary,
  },
  dateCol: {
    marginLeft: 12,
    alignItems: 'flex-end',
  },
  dateText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textMuted,
  },
});
