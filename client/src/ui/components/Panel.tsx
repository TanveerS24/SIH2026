import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography } from '../tokens';

export interface PanelProps {
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
  headerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  variant?: 'default' | 'ledger' | 'verified' | 'alert';
}

export const Panel: React.FC<PanelProps> = ({
  title,
  subtitle,
  badge,
  action,
  children,
  style,
  headerStyle,
  contentStyle,
  variant = 'default',
}) => {
  const getBorderColor = () => {
    switch (variant) {
      case 'ledger':
        return colors.ledgerGoldBorder;
      case 'verified':
        return colors.verifiedBorder;
      case 'alert':
        return colors.alertBorder;
      default:
        return colors.border;
    }
  };

  return (
    <View style={[styles.panel, { borderColor: getBorderColor() }, style]}>
      {(title || subtitle || action || badge) && (
        <View style={[styles.header, headerStyle]}>
          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              {title && <Text style={styles.title}>{title}</Text>}
              {badge && <View style={styles.badgeWrap}>{badge}</View>}
            </View>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {action && <View style={styles.actionWrap}>{action}</View>}
        </View>
      )}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    flexWrap: 'wrap',
    gap: 8,
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    fontFamily: typography.fontSerif,
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  badgeWrap: {
    marginLeft: 0,
  },
  subtitle: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  actionWrap: {
    marginLeft: 12,
  },
  content: {
    padding: 16,
  },
});
