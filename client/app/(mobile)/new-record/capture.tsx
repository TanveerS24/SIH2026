import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, Button, Panel } from '@pramaan/ui';

const EVIDENCE_TYPES = [
  { id: 'PHOTO_EXHIBIT', icon: '📸', label: 'PHOTO EXHIBIT', desc: 'Physical scene or device' },
  { id: 'WITNESS_STATEMENT', icon: '📝', label: 'WITNESS STATEMENT', desc: 'Spot deposition (Sec. 180 BNSS)' },
  { id: 'SEIZURE_MEMO', icon: '📦', label: 'SEIZURE MEMO', desc: 'On-scene recovery record' },
] as const;

type CaptureType = typeof EVIDENCE_TYPES[number]['id'];

export default function MobileCaptureScreen() {
  const router = useRouter();
  const [captureType, setCaptureType] = useState<CaptureType>('PHOTO_EXHIBIT');
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = () => {
    setIsCapturing(true);
    setTimeout(() => {
      setIsCapturing(false);
      router.push({
        pathname: '/(mobile)/new-record/review',
        params: {
          captureType,
          capturedAt: new Date().toISOString(),
          location: 'T. Nagar, Chennai (13.0418°N 80.2341°E)',
        },
      });
    }, 600);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Button title="← Back" onPress={() => router.back()} variant="secondary" size="sm" />
        <Text style={styles.stepLabel}>STEP 1 OF 3 — CAPTURE</Text>
      </View>

      {/* Viewfinder */}
      <View style={styles.viewfinder}>
        {/* Corner brackets */}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />

        <View style={styles.viewfinderCenter}>
          <Text style={styles.crosshair}>⊕</Text>
          <Text style={styles.viewfinderText}>
            {isCapturing ? 'PROCESSING...' : 'ALIGN EXHIBIT IN FRAME'}
          </Text>
        </View>

        <View style={styles.gpsBadge}>
          <Text style={styles.gpsText}>📍 13.0418°N 80.2341°E</Text>
        </View>

        {/* Shutter */}
        <TouchableOpacity
          style={[styles.shutter, isCapturing && styles.shutterCapturing]}
          onPress={handleCapture}
          disabled={isCapturing}
          activeOpacity={0.8}
        >
          <View style={styles.shutterInner} />
        </TouchableOpacity>
        <Text style={styles.shutterLabel}>{isCapturing ? 'PROCESSING...' : 'TAP TO CAPTURE'}</Text>
      </View>

      {/* Evidence Type Selector */}
      <Panel title="EVIDENCE TYPE">
        <View style={styles.typeGrid}>
          {EVIDENCE_TYPES.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setCaptureType(t.id)}
              style={[styles.typeCard, captureType === t.id && styles.typeCardActive]}
            >
              <Text style={styles.typeIcon}>{t.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.typeLabel, captureType === t.id && styles.typeLabelActive]}>
                  {t.label}
                </Text>
                <Text style={styles.typeDesc}>{t.desc}</Text>
              </View>
              {captureType === t.id && <Text style={styles.typeCheck}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </Panel>
    </ScrollView>
  );
}

const CORNER_SIZE = 18;
const CORNER_THICKNESS = 2;

const styles = StyleSheet.create({
  container: { padding: 14 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  stepLabel: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },

  viewfinder: {
    backgroundColor: '#0B1520',
    borderRadius: 8,
    height: 240,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    paddingBottom: 70,
  },

  // Corner brackets
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 16,
    left: 16,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  cornerTR: {
    top: 16,
    right: 16,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  cornerBL: {
    bottom: 80,
    left: 16,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  cornerBR: {
    bottom: 80,
    right: 16,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: 'rgba(255,255,255,0.7)',
  },

  viewfinderCenter: { alignItems: 'center' },
  crosshair: {
    fontSize: 28,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 6,
  },
  viewfinderText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.8,
  },

  gpsBadge: {
    position: 'absolute',
    bottom: 68,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  gpsText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: 'rgba(255,255,255,0.8)',
  },

  shutter: {
    position: 'absolute',
    bottom: 14,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterCapturing: { backgroundColor: 'rgba(255,255,255,0.4)' },
  shutterInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.alert,
  },
  shutterLabel: {
    position: 'absolute',
    bottom: 2,
    fontFamily: typography.fontSans,
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },

  // Type Grid
  typeGrid: { gap: 6 },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 10,
    gap: 10,
  },
  typeCardActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  typeIcon: { fontSize: 20 },
  typeLabel: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  typeLabelActive: { color: colors.primary },
  typeDesc: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  typeCheck: {
    fontFamily: typography.fontSans,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
});
