import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography } from '../tokens';

export interface VerificationSealProps {
  status: 'VERIFIED' | 'MISMATCH' | 'PENDING' | 'TAMPERED';
  timestamp?: string;
  txId?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const VerificationSeal: React.FC<VerificationSealProps> = ({
  status,
  timestamp,
  txId,
  size = 'md',
  style,
}) => {
  const isVerified = status === 'VERIFIED';
  const isMismatch = status === 'MISMATCH' || status === 'TAMPERED';

  const borderColor = isVerified
    ? colors.verified
    : isMismatch
    ? colors.alert
    : colors.borderDark;

  const bgColor = isVerified
    ? colors.verifiedLight
    : isMismatch
    ? colors.alertLight
    : colors.backgroundSubdued;

  const textColor = isVerified
    ? colors.verifiedDark
    : isMismatch
    ? colors.alertDark
    : colors.textSecondary;

  return (
    <View
      style={[
        styles.sealContainer,
        {
          borderColor,
          backgroundColor: bgColor,
          padding: size === 'sm' ? 8 : size === 'lg' ? 20 : 14,
        },
        style,
      ]}
    >
      <View style={[styles.innerRing, { borderColor }]}>
        <Text style={[styles.sealHeader, { color: textColor }]}>
          {isVerified
            ? 'DIGITAL INTEGRITY SEAL'
            : isMismatch
            ? 'TAMPER / INTEGRITY ALERT'
            : 'VERIFICATION PENDING'}
        </Text>

        <Text
          style={[
            styles.statusText,
            {
              color: textColor,
              fontSize: size === 'sm' ? 14 : size === 'lg' ? 22 : 18,
            },
          ]}
        >
          {isVerified ? '✓ CRYPTOGRAPHICALLY VERIFIED' : isMismatch ? '✗ HASH MISMATCH DETECTED' : '◯ UNANCHORED'}
        </Text>

        <Text style={[styles.detailText, { color: textColor }]}>
          {isVerified
            ? 'Authoritative SHA-256 matches Immutable Ledger Anchor'
            : isMismatch
            ? 'Document payload has been altered since ledger anchoring'
            : 'Document awaiting blockchain anchor verification'}
        </Text>

        {txId && (
          <Text style={[styles.metaText, { color: textColor }]}>
            LEDGER TX: {txId}
          </Text>
        )}
        {timestamp && (
          <Text style={[styles.metaText, { color: textColor }]}>
            ANCHORED: {new Date(timestamp).toLocaleString()}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sealContainer: {
    borderWidth: 2,
    borderStyle: 'solid',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  innerRing: {
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 12,
    width: '100%',
    alignItems: 'center',
  },
  sealHeader: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statusText: {
    fontFamily: typography.fontSerif,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginVertical: 4,
    textAlign: 'center',
  },
  detailText: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  metaText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    marginTop: 4,
  },
});
