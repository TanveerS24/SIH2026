import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, Button, Panel } from '@pramaan/ui';

export default function MobileCaptureScreen() {
  const router = useRouter();
  const [captureType, setCaptureType] = useState<'PHOTO_EXHIBIT' | 'WITNESS_STATEMENT' | 'SEIZURE_MEMO'>('PHOTO_EXHIBIT');
  const [isSimulatingCamera, setIsSimulatingCamera] = useState(false);

  const handleCapture = () => {
    setIsSimulatingCamera(true);
    setTimeout(() => {
      setIsSimulatingCamera(false);
      // Proceed to step 2: review
      router.push({
        pathname: '/(mobile)/new-record/review',
        params: {
          captureType,
          capturedAt: new Date().toISOString(),
          location: 'T. Nagar Commercial Area, Chennai (GPS: 13.0418° N, 80.2341° E)',
        },
      });
    }, 600);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Button title="← Cancel" onPress={() => router.back()} variant="secondary" size="sm" />
        <Text style={styles.stepTitle}>STEP 1: FIELD EVIDENCE CAPTURE</Text>
      </View>

      {/* Camera Viewfinder Box */}
      <View style={styles.viewfinderBox}>
        <View style={styles.viewfinderFrame}>
          <Text style={styles.viewfinderTarget}>[ ⛶ ]</Text>
          <Text style={styles.viewfinderText}>
            {isSimulatingCamera ? '⚡ EXPOSING & ENCRYPTING SENSOR CAPTURE...' : 'ALIGN DOCUMENT OR PHYSICAL EXHIBIT IN FRAME'}
          </Text>
          <View style={styles.gpsBadge}>
            <Text style={styles.gpsText}>📍 GPS: 13.0418° N, 80.2341° E (CHENNAI SOUTH)</Text>
          </View>
        </View>

        {/* Capture Trigger Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleCapture}
          disabled={isSimulatingCamera}
          style={styles.shutterBtn}
        >
          <View style={styles.shutterInner} />
        </TouchableOpacity>
        <Text style={styles.shutterLabel}>TAP TO CAPTURE EXHIBIT</Text>
      </View>

      {/* Capture Type Selector */}
      <Panel title="SELECT EVIDENCE TYPE" variant="ledger">
        <View style={styles.typeGrid}>
          {[
            { id: 'PHOTO_EXHIBIT', label: 'PHOTOGRAPHIC EXHIBIT', desc: 'Physical scene or device photo' },
            { id: 'WITNESS_STATEMENT', label: 'WITNESS DEPOSITION (180 BNSS)', desc: 'Recorded spot statement' },
            { id: 'SEIZURE_MEMO', label: 'SEIZURE / PANCHNAMA MEMO', desc: 'On-scene recovery memo' },
          ].map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setCaptureType(t.id as any)}
              style={[styles.typeCard, captureType === t.id && styles.typeCardActive]}
            >
              <Text style={[styles.typeTitle, captureType === t.id && styles.typeTitleActive]}>
                {t.label}
              </Text>
              <Text style={styles.typeDesc}>{t.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Panel>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  stepTitle: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  viewfinderBox: {
    backgroundColor: '#0F1A22',
    borderRadius: 2,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  viewfinderFrame: {
    width: '100%',
    height: 180,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    borderStyle: 'dashed',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  viewfinderTarget: {
    fontSize: 32,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  viewfinderText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textInverse,
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  gpsBadge: {
    position: 'absolute',
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
  },
  gpsText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.verifiedLight,
  },
  shutterBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  shutterInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.alert,
  },
  shutterLabel: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '800',
    color: colors.textInverse,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  typeGrid: {
    gap: 8,
  },
  typeCard: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    borderRadius: 2,
  },
  typeCardActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  typeTitle: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  typeTitleActive: {
    color: colors.primary,
  },
  typeDesc: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
});
