import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography } from '../tokens';

export interface RedactedFieldProps {
  label: string;
  value?: string | null;
  isRedacted?: boolean;
  redactionReason?: string;
  style?: ViewStyle;
}

export const RedactedField: React.FC<RedactedFieldProps> = ({
  label,
  value,
  isRedacted = true,
  redactionReason = 'PROTECTED WITNESS / VICTIM IDENTITY',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      {isRedacted || !value ? (
        <View style={styles.redactedBox}>
          <Text style={styles.redactedChars}>████████████████</Text>
          <Text style={styles.reasonText}>[{redactionReason}]</Text>
        </View>
      ) : (
        <Text style={styles.valueText}>{value}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  label: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  redactedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  redactedChars: {
    fontFamily: typography.fontMono,
    fontSize: 13,
    color: colors.textPrimary,
    letterSpacing: 1,
    backgroundColor: colors.textPrimary,
  },
  reasonText: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '700',
    color: colors.alert,
  },
  valueText: {
    fontFamily: typography.fontSans,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
