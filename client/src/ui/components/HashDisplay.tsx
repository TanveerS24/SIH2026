import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, typography } from '../tokens';

export interface HashDisplayProps {
  label?: string;
  hash: string;
  truncate?: boolean;
  copyable?: boolean;
  verified?: boolean;
  style?: ViewStyle;
}

export const HashDisplay: React.FC<HashDisplayProps> = ({
  label = 'SHA-256 HASH',
  hash,
  truncate = false,
  copyable = true,
  verified,
  style,
}) => {
  const [copied, setCopied] = useState(false);

  const displayHash = truncate && hash.length > 20
    ? `${hash.substring(0, 10)}...${hash.substring(hash.length - 10)}`
    : hash;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={copyable ? handleCopy : undefined}
        style={[
          styles.hashBox,
          verified === true && styles.verifiedBox,
          verified === false && styles.mismatchBox,
        ]}
      >
        <Text
          style={[
            styles.hashText,
            verified === true && styles.verifiedText,
            verified === false && styles.mismatchText,
          ]}
          selectable
        >
          {displayHash}
        </Text>
        {copyable && (
          <Text style={styles.copyBadge}>{copied ? 'COPIED' : 'COPY'}</Text>
        )}
      </TouchableOpacity>
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
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  hashBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundSubdued,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  verifiedBox: {
    backgroundColor: colors.verifiedLight,
    borderColor: colors.verifiedBorder,
  },
  mismatchBox: {
    backgroundColor: colors.alertLight,
    borderColor: colors.alertBorder,
  },
  hashText: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    color: colors.textPrimary,
    letterSpacing: 0.5,
    flex: 1,
    flexShrink: 1,
    ...({ wordBreak: 'break-all' } as any),
  },
  verifiedText: {
    color: colors.verifiedDark,
    fontWeight: '600',
  },
  mismatchText: {
    color: colors.alertDark,
    fontWeight: '600',
  },
  copyBadge: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
