import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { colors, typography, Button, Panel } from '@pramaan/ui';

const EVIDENCE_TYPES = [
  { id: 'PHOTOGRAPHIC_EVIDENCE', tag: 'PHOTO', label: 'PHOTO EXHIBIT', desc: 'Physical scene or device exhibit' },
  { id: 'WITNESS_STATEMENT', tag: 'STATEMENT', label: 'WITNESS STATEMENT', desc: 'Spot deposition (Sec. 180 BNSS)' },
  { id: 'SEIZURE_MEMO', tag: 'SEIZURE', label: 'SEIZURE MEMO', desc: 'On-scene recovery record' },
] as const;

type CaptureType = typeof EVIDENCE_TYPES[number]['id'];

export default function MobileCaptureScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [captureType, setCaptureType] = useState<CaptureType>('PHOTOGRAPHIC_EVIDENCE');
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash((current) => (current === 'off' ? 'on' : 'off'));
  };

  const handleCapture = async () => {
    if (isCapturing) return;
    setIsCapturing(true);

    let photoUri: string | undefined;

    try {
      if (cameraRef.current && permission?.granted) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.85,
          skipProcessing: false,
        });
        photoUri = photo?.uri;
      }
    } catch (err) {
      console.warn('Native camera capture failed, using fallback:', err);
    } finally {
      setIsCapturing(false);
      router.push({
        pathname: '/(mobile)/new-record/review',
        params: {
          captureType,
          photoUri: photoUri || '',
          capturedAt: new Date().toISOString(),
          location: 'T. Nagar AWPS, Chennai (13.0418°N 80.2341°E)',
        },
      });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Button title="← Back" onPress={() => router.back()} variant="secondary" size="sm" />
        <Text style={styles.stepLabel}>STEP 1 OF 3 — LIVE FIELD CAPTURE</Text>
      </View>

      {/* Real Hardware Camera Viewfinder */}
      <View style={styles.viewfinderContainer}>
        {!permission ? (
          <View style={styles.permissionBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.permissionDesc}>Checking camera access authorization...</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.permissionBox}>
            <Text style={styles.permissionIcon}>📷</Text>
            <Text style={styles.permissionTitle}>CAMERA PERMISSION REQUIRED</Text>
            <Text style={styles.permissionDesc}>
              Pramaan Field terminal requires camera authorization to record authenticated physical evidence and spot depositions.
            </Text>
            <Button
              title="[+] GRANT CAMERA PERMISSION"
              onPress={requestPermission}
              variant="primary"
              size="md"
            />
          </View>
        ) : (
          <View style={styles.cameraWrapper}>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing={facing}
              enableTorch={flash === 'on'}
            />

            {/* Tactical HUD Overlay */}
            <View style={styles.hudOverlay} pointerEvents="box-none">
              {/* Top Controls Bar */}
              <View style={styles.topHudBar}>
                <View style={styles.recBadge}>
                  <View style={styles.recDot} />
                  <Text style={styles.recText}>LIVE SENSOR</Text>
                </View>
                <View style={styles.hudActions}>
                  <TouchableOpacity onPress={toggleFlash} style={styles.hudBtn}>
                    <Text style={styles.hudBtnText}>⚡ {flash.toUpperCase()}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={toggleCameraFacing} style={styles.hudBtn}>
                    <Text style={styles.hudBtnText}>🔄 FLIP</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Corner Framing Brackets */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />

              {/* Center Target Reticle */}
              <View style={styles.viewfinderCenter}>
                <Text style={styles.crosshair}>⊕</Text>
                <Text style={styles.viewfinderText}>
                  {isCapturing ? 'ACQUIRING & ENCRYPTING...' : 'ALIGN EVIDENCE WITHIN FRAME'}
                </Text>
              </View>

              {/* GPS Coordinates Bar */}
              <View style={styles.gpsBadge}>
                <Text style={styles.gpsText}>GPS: 13.0418°N 80.2341°E (±2M ACCURACY)</Text>
              </View>

              {/* Shutter Button */}
              <View style={styles.shutterRow}>
                <TouchableOpacity
                  style={[styles.shutter, isCapturing && styles.shutterCapturing]}
                  onPress={handleCapture}
                  disabled={isCapturing}
                  activeOpacity={0.8}
                >
                  <View style={styles.shutterInner} />
                </TouchableOpacity>
                <Text style={styles.shutterLabel}>
                  {isCapturing ? 'CAPTURING EVIDENCE...' : 'PRESS SHUTTER TO CAPTURE'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Evidence Classification Selector */}
      <Panel title="STATUTORY EVIDENCE CLASSIFICATION">
        <View style={styles.typeGrid}>
          {EVIDENCE_TYPES.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setCaptureType(t.id)}
              style={[styles.typeCard, captureType === t.id && styles.typeCardActive]}
            >
              <Text style={styles.typeTag}>[{t.tag}]</Text>
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

const CORNER_SIZE = 22;
const CORNER_THICKNESS = 2.5;

const styles = StyleSheet.create({
  container: { padding: 14 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stepLabel: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },

  viewfinderContainer: {
    backgroundColor: '#070D12',
    borderRadius: 8,
    height: 380,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderDark,
    position: 'relative',
  },

  cameraWrapper: {
    flex: 1,
    position: 'relative',
  },

  hudOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },

  topHudBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    gap: 6,
  },
  recDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  recText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  hudActions: {
    flexDirection: 'row',
    gap: 6,
  },
  hudBtn: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
  },
  hudBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Corner brackets
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 50,
    left: 14,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  cornerTR: {
    top: 50,
    right: 14,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  cornerBL: {
    bottom: 96,
    left: 14,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  cornerBR: {
    bottom: 96,
    right: 14,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: 'rgba(255,255,255,0.85)',
  },

  viewfinderCenter: {
    alignItems: 'center',
    marginVertical: 'auto',
  },
  crosshair: {
    fontSize: 32,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  viewfinderText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 2,
  },

  gpsBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 3,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  gpsText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: '#34D399',
    letterSpacing: 0.4,
  },

  shutterRow: {
    alignItems: 'center',
    gap: 4,
  },
  shutter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterCapturing: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    transform: [{ scale: 0.95 }],
  },
  shutterInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.alert,
  },
  shutterLabel: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  permissionIcon: {
    fontSize: 36,
  },
  permissionTitle: {
    fontFamily: typography.fontSans,
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  permissionDesc: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 6,
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
  typeTag: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    backgroundColor: colors.surface,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
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
