import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, typography, Button, Input, Panel, StatusTag } from '@pramaan/ui';

export default function MobileReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ captureType: string; capturedAt: string; location: string }>();

  const [title, setTitle] = useState('Spot Deposition of Witness (T. Nagar)');
  const [statementText, setStatementText] = useState('Witness confirms observing suspect on black motorcycle loitering near commercial complex at approximately 22:15 hrs.');
  const [bnsSections, setBnsSections] = useState('BNS 70 (Harassment), BNS 351 (Criminal Intimidation)');
  const [complainant, setComplainant] = useState('Lakshmi R. (Witness / Shop Owner)');
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
        captureType: params.captureType || 'WITNESS_STATEMENT',
        capturedAt: params.capturedAt || new Date().toISOString(),
        location: params.location || 'T. Nagar AWPS Field Jurisdiction',
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Button title="← Retake" onPress={() => router.back()} variant="secondary" size="sm" />
        <Text style={styles.stepTitle}>STEP 2: OCR & METADATA REVIEW</Text>
      </View>

      {/* AI Extraction Banner */}
      <View style={styles.ocrBanner}>
        <Text style={styles.ocrBannerTitle}>[VERIFIED] AUTOMATED OCR & METADATA EXTRACTION COMPLETE</Text>
        <Text style={styles.ocrBannerSub}>
          Confirm or adjust extracted statutory metadata prior to digital officer signature.
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
          hint="Extracted by Pramaan OCR classifier."
        />
        <Input
          label="WITNESS / COMPLAINANT IDENTIFIER"
          value={complainant}
          onChangeText={setComplainant}
        />
        <Input
          label="EXTRACTED STATEMENT / DEPOSITION TEXT"
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
    marginBottom: 16,
  },
  stepTitle: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  ocrBanner: {
    backgroundColor: colors.verifiedLight,
    borderWidth: 1,
    borderColor: colors.verifiedBorder,
    padding: 12,
    borderRadius: 2,
    marginBottom: 16,
  },
  ocrBannerTitle: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '800',
    color: colors.verifiedDark,
    letterSpacing: 0.5,
  },
  ocrBannerSub: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  proceedBtn: {
    marginTop: 8,
    marginBottom: 24,
  },
});
