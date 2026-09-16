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
  const scale = size / 48;
  const pedimentWidth = Math.max(10, Math.round(16 * scale));
  const pedimentHeight = Math.max(2, Math.round(3 * scale));
  const colHeight = Math.max(5, Math.round(8 * scale));
  const colWidth = Math.max(1.5, Math.round(2 * scale));
  const colGap = Math.max(1.5, Math.round(2.5 * scale));
  const baseWidth = Math.max(12, Math.round(18 * scale));
  const baseHeight = Math.max(1.5, Math.round(2 * scale));

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
            <View
              style={[
                styles.pediment,
                { width: pedimentWidth, height: pedimentHeight },
              ]}
            />
            <View style={[styles.columnsRow, { height: colHeight, gap: colGap }]}>
              <View style={[styles.column, { width: colWidth }]} />
              <View style={[styles.column, { width: colWidth }]} />
              <View style={[styles.column, { width: colWidth }]} />
            </View>
            <View
              style={[
                styles.baseLine,
                { width: baseWidth, height: baseHeight },
              ]}
            />
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
    borderWidth: 1.5,
    borderStyle: 'solid',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 1,
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
    backgroundColor: colors.primary,
    marginBottom: 1,
    borderRadius: 0.5,
  },
  columnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  column: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  baseLine: {
    backgroundColor: colors.primary,
    marginTop: 1,
    borderRadius: 0.5,
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
