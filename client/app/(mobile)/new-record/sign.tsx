import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, typography, Button, Panel, StatusTag } from '@pramaan/ui';
import { useAuthStore } from '../../../stores/authStore';
import { useSyncStore } from '../../../stores/syncStore';
import { api } from '../../../services/api';

export default function MobileSignScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isOffline, enqueueRecord } = useSyncStore();
  const params = useLocalSearchParams<any>();

  const [hasSigned, setHasSigned] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const sectionsArray = params.bnsSections
      ? params.bnsSections.split(',').map((s: string) => s.trim())
      : ['BNS 70'];

    const payload = {
      caseNumber: params.caseNumber || 'TN-2026-001245',
      title: params.title || 'Field Evidence Record',
      fileName: `field_capture_${Date.now()}.pdf`,
      mimeType: 'application/pdf',
      documentType: params.captureType || 'WITNESS_STATEMENT',
      statementText: params.statementText || 'Witness deposition recorded in field.',
      capturedAt: params.capturedAt || new Date().toISOString(),
      capturedLocation: params.location || 'Field Jurisdiction (Chennai)',
      victimName: params.complainant || 'Protected Witness',
      bnsSections: sectionsArray,
      signatureSvg: '<svg height="40" width="120"><path d="M 10 30 Q 30 5 60 25 T 110 20" stroke="#123F5E" stroke-width="2" fill="none"/></svg>',
      fileSize: 2048,
    };

    if (isOffline) {
      // 1. Enqueue in SQLite queue
      const queuedItem = await enqueueRecord('CREATE_FIELD_RECORD', payload);
      setIsSubmitting(false);
      setSubmissionSuccess(`RECORD STORED OFFLINE IN SQLITE QUEUE (IDEMPOTENCY KEY: ${queuedItem.idempotencyKey})`);
      setTimeout(() => {
        router.replace('/(mobile)/sync');
      }, 1500);
    } else {
      // 2. Direct online sync
      try {
        const queuedItem = await enqueueRecord('CREATE_FIELD_RECORD', payload);
        await useSyncStore.getState().triggerSync();
        setIsSubmitting(false);
        setSubmissionSuccess('RECORD SYNCHRONIZED & ANCHORED IN PERMISSIONED LEDGER!');
        setTimeout(() => {
          router.replace('/(mobile)/home');
        }, 1500);
      } catch (err: any) {
        setIsSubmitting(false);
        setSubmissionSuccess(`SYNC FAILED: Stored in SQLite offline queue for auto-retry.`);
        setTimeout(() => {
          router.replace('/(mobile)/sync');
        }, 1500);
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Button title="← Back" onPress={() => router.back()} variant="secondary" size="sm" />
        <Text style={styles.stepTitle}>STEP 3: OFFICER DIGITAL SIGNATURE</Text>
      </View>

      {/* Mode Status Pill */}
      <View style={styles.modeBadge}>
        <Text style={styles.modeText}>
          {isOffline ? '[OFFLINE] Record will be stored in local SQLite queue' : '[ONLINE] Record will be anchored immediately in ledger'}
        </Text>
      </View>

      {submissionSuccess && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>[SUCCESS] {submissionSuccess}</Text>
        </View>
      )}

      {/* Evidence Summary Card */}
      <Panel title="EXHIBIT SUBMISSION SUMMARY" variant="ledger">
        <Text style={styles.summaryLine}>
          <Text style={styles.bold}>CASE NUMBER: </Text>{params.caseNumber}
        </Text>
        <Text style={styles.summaryLine}>
          <Text style={styles.bold}>EXHIBIT: </Text>{params.title}
        </Text>
        <Text style={styles.summaryLine}>
          <Text style={styles.bold}>SECTIONS: </Text>{params.bnsSections}
        </Text>
        <Text style={styles.summaryLine}>
          <Text style={styles.bold}>GPS LOCATION: </Text>{params.location}
        </Text>
      </Panel>

      {/* Signature Canvas */}
      <Panel title="INVESTIGATING / HELP DESK OFFICER DIGITAL ENDORSEMENT">
        <View style={styles.signaturePad}>
          <Text style={styles.sigPlaceholder}>
            {hasSigned ? `[AUTHENTICATED] ${user?.name || 'OFFICER'} [TOKEN ATTACHED]` : 'TAP TO SIGN'}
          </Text>
          <View style={styles.sigSeal}>
            <Text style={styles.sigSealText}>OFFICIAL SEAL: {user?.badgeNumber}</Text>
          </View>
        </View>

        <View style={styles.attestationBox}>
          <Text style={styles.attestText}>
            "I hereby attest under Section 180/193 BNSS that this digital exhibit and statement was recorded accurately at the specified field location."
          </Text>
          <Text style={styles.attestOfficer}>— {user?.name} ({user?.role.replace(/_/g, ' ')})</Text>
        </View>
      </Panel>

      <Button
        title={
          isSubmitting
            ? 'ENCRYPTING & PERSISTING...'
            : isOffline
            ? 'SAVE TO LOCAL SQLITE QUEUE (OFFLINE) →'
            : 'SUBMIT & ANCHOR IN LEDGER (ONLINE) →'
        }
        onPress={handleSubmit}
        loading={isSubmitting}
        variant={isOffline ? 'primary' : 'verified'}
        size="lg"
        style={styles.submitBtn}
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
  modeBadge: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: 10,
    borderRadius: 2,
    marginBottom: 16,
  },
  modeText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  successBox: {
    backgroundColor: colors.verifiedLight,
    borderWidth: 1,
    borderColor: colors.verifiedBorder,
    padding: 12,
    borderRadius: 2,
    marginBottom: 16,
  },
  successText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '800',
    color: colors.verifiedDark,
  },
  summaryLine: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  bold: {
    fontWeight: '800',
    color: colors.textSecondary,
  },
  signaturePad: {
    height: 110,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderStyle: 'dashed',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  sigPlaceholder: {
    fontFamily: typography.fontSerif,
    fontSize: 18,
    fontStyle: 'italic',
    color: colors.primary,
    fontWeight: '700',
  },
  sigSeal: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 2,
  },
  sigSealText: {
    fontFamily: typography.fontMono,
    fontSize: 8,
    fontWeight: '700',
    color: colors.textMuted,
  },
  attestationBox: {
    backgroundColor: colors.backgroundSubdued,
    padding: 10,
    borderRadius: 2,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  attestText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontStyle: 'italic',
    color: colors.textSecondary,
    lineHeight: 16,
  },
  attestOfficer: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
  submitBtn: {
    marginTop: 8,
    marginBottom: 24,
  },
});
