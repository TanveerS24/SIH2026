import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography } from '../tokens';

interface OfficialSealProps {
  size?: number;
  showText?: boolean;
  style?: ViewStyle;
}

export const OfficialSeal: React.FC<OfficialSealProps> = ({
  size = 48,
  showText = false,
  style,
}) => {
  const outerSize = size;
  const innerSize = Math.round(size * 0.76);

  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[
          styles.outerCircle,
          {
            width: outerSize,
            height: outerSize,
            borderRadius: outerSize / 2,
            borderColor: colors.primary,
          },
        ]}
      >
        <View
          style={[
            styles.innerCircle,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
              borderColor: colors.primaryHover,
            },
          ]}
        >
          {/* Institutional geometric pillar / emblem */}
          <View style={styles.pillarEmblem}>
            <View style={styles.pediment} />
            <View style={styles.columnsRow}>
              <View style={styles.column} />
              <View style={styles.column} />
              <View style={styles.column} />
            </View>
            <View style={styles.baseLine} />
          </View>
        </View>
      </View>
      {showText && (
        <Text style={styles.sealLabel}>GOVT OF INDIA • DIGITAL EVIDENCE LEDGER</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerCircle: {
    borderWidth: 2,
    borderStyle: 'solid',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  innerCircle: {
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  pillarEmblem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pediment: {
    width: 14,
    height: 3,
    backgroundColor: colors.primary,
    marginBottom: 1,
    borderRadius: 1,
  },
  columnsRow: {
    flexDirection: 'row',
    gap: 2,
    height: 7,
    alignItems: 'center',
  },
  column: {
    width: 2,
    height: '100%',
    backgroundColor: colors.primary,
  },
  baseLine: {
    width: 16,
    height: 2,
    backgroundColor: colors.primary,
    marginTop: 1,
  },
  sealLabel: {
    fontFamily: typography.fontSans,
    fontSize: 8,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
    marginTop: 4,
    textTransform: 'uppercase',
  },
});
