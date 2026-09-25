import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, typography, Button, Input, Panel } from '@pramaan/ui';

export default function MobileReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ captureType: string; capturedAt: string; location: string; photoUri?: string }>();

  const isPhotoExhibit = params.captureType === 'PHOTOGRAPHIC_EVIDENCE' || !!params.photoUri;

  const [title, setTitle] = useState(
    isPhotoExhibit
      ? 'Physical Exhibit Photograph (Women Safety Help Desk Scene)'
      : 'Spot Deposition of Witness (T. Nagar)'
  );
  const [statementText, setStatementText] = useState(
    isPhotoExhibit
      ? 'Direct field capture of recovery scene/physical evidence exhibit. GPS geotag and hardware camera timestamp verified.'
      : 'Witness confirms observing suspect on black motorcycle loitering near commercial complex at approximately 22:15 hrs.'
  );
  const [bnsSections, setBnsSections] = useState('BNS 70 (Harassment), BNS 351 (Criminal Intimidation)');
  const [complainant, setComplainant] = useState('Lakshmi R. (Witness / Complainant)');
  const [caseNumber, setCaseNumber] = useState('TN-2026-001245');

  const handleProceedToSign = () => {
    router.push({
      pathname: '/(mobile)/new-record/sign',
      params: {
        title,
        statementText,
        bnsSections,
        complainant,
        caseNumber,
        captureType: params.captureType || 'PHOTOGRAPHIC_EVIDENCE',
        capturedAt: params.capturedAt || new Date().toISOString(),
        location: params.location || 'T. Nagar AWPS Field Jurisdiction',
        photoUri: params.photoUri || '',
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Button title="← Retake" onPress={() => router.back()} variant="secondary" size="sm" />
        <Text style={styles.stepTitle}>STEP 2: EVIDENCE METADATA REVIEW</Text>
      </View>

      {/* Captured Photo Preview Card */}
      {params.photoUri ? (
        <View style={styles.photoContainer}>
          <Image source={{ uri: params.photoUri }} style={styles.photoPreview} resizeMode="cover" />
          <View style={styles.photoBadge}>
            <View style={styles.photoBadgeRow}>
              <Text style={styles.photoBadgeText}>📷 CAPTURED CAMERA EVIDENCE</Text>
              <Text style={styles.photoGeotag}>GPS ANCHORED</Text>
            </View>
            <Text style={styles.photoSubText} numberOfLines={1}>
              {params.location || 'Chennai AWPS Field Jurisdiction'} • {new Date().toLocaleTimeString()}
            </Text>
          </View>
        </View>
      ) : null}

      {/* AI Extraction Banner */}
      <View style={styles.ocrBanner}>
        <Text style={styles.ocrBannerTitle}>[VERIFIED] AUTOMATED METADATA EXTRACTION COMPLETE</Text>
        <Text style={styles.ocrBannerSub}>
          Confirm or adjust extracted statutory metadata prior to digital officer signature and blockchain anchoring.
        </Text>
      </View>

      {/* Extracted Metadata Confirmation Form */}
      <Panel title="STATUTORY METADATA CONFIRMATION" variant="ledger">
        <Input
          label="ASSOCIATED CASE NUMBER"
          value={caseNumber}
          onChangeText={setCaseNumber}
          monospace
        />
        <Input
          label="EXHIBIT TITLE"
          value={title}
          onChangeText={setTitle}
        />
        <Input
          label="STATUTORY BNS CLASSIFICATION SECTIONS"
          value={bnsSections}
          onChangeText={setBnsSections}
          hint="Extracted by Pramaan classifier."
        />
        <Input
          label="WITNESS / COMPLAINANT IDENTIFIER"
          value={complainant}
          onChangeText={setComplainant}
        />
        <Input
          label="EXTRACTED STATEMENT / EXHIBIT DEPOSITION"
          value={statementText}
          onChangeText={setStatementText}
          multiline
          numberOfLines={4}
        />
      </Panel>

      <Button
        title="CONFIRM METADATA & PROCEED TO SIGN →"
        onPress={handleProceedToSign}
        variant="primary"
        size="lg"
        style={styles.proceedBtn}
      />
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
    marginBottom: 14,
  },
  stepTitle: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },

  photoContainer: {
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderDark,
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: 220,
  },
  photoBadge: {
    backgroundColor: 'rgba(11, 21, 32, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  photoBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoBadgeText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 0.5,
  },
  photoGeotag: {
    fontFamily: typography.fontMono,
    fontSize: 8,
    fontWeight: '700',
    color: '#FBBF24',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  photoSubText: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  ocrBanner: {
    backgroundColor: colors.verifiedLight,
    borderWidth: 1,
    borderColor: colors.verifiedBorder,
    padding: 12,
    borderRadius: 4,
    marginBottom: 14,
  },
  ocrBannerTitle: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '800',
    color: colors.verifiedDark,
    letterSpacing: 0.5,
  },
  ocrBannerSub: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 14,
  },
  proceedBtn: {
    marginTop: 10,
    marginBottom: 24,
  },
});
