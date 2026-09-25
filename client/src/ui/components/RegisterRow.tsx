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
  const subLines = subtitle ? subtitle.split(' • ').map((s) => s.trim()).filter(Boolean) : [];

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.container, style]}
    >
      <View style={styles.leftBorder} />
      <View style={styles.mainContent}>
        {/* Top Header: Code and Date on left, Status box on FAR RIGHT */}
        <View style={styles.headerLine}>
          <View style={styles.codeAndDateRow}>
            <Text style={styles.codeText}>{primaryCode}</Text>
            {date && <Text style={styles.dateInline}>• {date}</Text>}
          </View>
          <View style={styles.statusBoxWrap}>
            <StatusTag label={statusLabel} variant={statusVariant} size="sm" />
          </View>
        </View>

        <Text style={styles.titleText}>{title}</Text>

        {/* Content below title split into 2 lines */}
        {subLines.length > 1 ? (
          <View style={styles.subLinesWrap}>
            {subLines.map((line, idx) => (
              <Text key={idx} style={styles.subLine}>{line}</Text>
            ))}
          </View>
        ) : subtitle ? (
          <Text style={styles.subtitleText}>{subtitle}</Text>
        ) : null}

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
    width: '100%',
  },
  codeAndDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  codeText: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  dateInline: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textMuted,
  },
  statusBoxWrap: {
    marginLeft: 'auto',
  },
  titleText: {
    fontFamily: typography.fontSerif,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subLinesWrap: {
    marginBottom: 6,
    gap: 2,
  },
  subLine: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  subtitleText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 16,
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
});
