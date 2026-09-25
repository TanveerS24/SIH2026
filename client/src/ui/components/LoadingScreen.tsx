import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { colors, typography } from '../tokens';

export interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
  inline?: boolean;
  size?: 'small' | 'large';
  style?: ViewStyle;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading Evidence Ledger Records...',
  subMessage = 'Querying cryptographic state & verifying permissioned node',
  inline = false,
  size = 'large',
  style,
}) => {
  return (
    <View style={[inline ? styles.inlineContainer : styles.fullContainer, style]}>
      <View style={styles.spinnerCard}>
        <ActivityIndicator size={size} color={colors.primary} />
        <View style={styles.textWrap}>
          <Text style={styles.titleText}>{message}</Text>
          {subMessage ? <Text style={styles.subText}>{subMessage}</Text> : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    minHeight: 280,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  inlineContainer: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  spinnerCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 4,
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    maxWidth: 420,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  textWrap: {
    alignItems: 'center',
    gap: 4,
  },
  titleText: {
    fontFamily: typography.fontSans,
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subText: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
