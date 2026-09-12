import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography } from '../tokens';

export type StatusVariant =
  | 'verified'
  | 'alert'
  | 'warning'
  | 'info'
  | 'neutral'
  | 'gold'
  | 'filed';

export interface StatusTagProps {
  label: string;
  variant?: StatusVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const StatusTag: React.FC<StatusTagProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  style,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'verified':
      case 'filed':
        return {
          bg: colors.verifiedLight,
          border: colors.verifiedBorder,
          text: colors.verifiedDark,
        };
      case 'alert':
        return {
          bg: colors.alertLight,
          border: colors.alertBorder,
          text: colors.alertDark,
        };
      case 'warning':
      case 'gold':
        return {
          bg: colors.ledgerGoldLight,
          border: colors.ledgerGoldBorder,
          text: colors.ledgerGold,
        };
      case 'info':
        return {
          bg: colors.primaryLight,
          border: colors.primaryBorder,
          text: colors.primary,
        };
      case 'neutral':
      default:
        return {
          bg: colors.backgroundSubdued,
          border: colors.borderDark,
          text: colors.textSecondary,
        };
    }
  };

  const c = getColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: c.bg,
          borderColor: c.border,
          paddingVertical: size === 'sm' ? 2 : 4,
          paddingHorizontal: size === 'sm' ? 6 : 8,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: c.text,
            fontSize: size === 'sm' ? 10 : 11,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 2,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: typography.fontSans,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
