import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  colors,
  typography,
  Panel,
  Button,
  VerificationSeal,
  HashDisplay,
  StatusTag,
} from '@pramaan/ui';
import { api } from '../../../../services/api';

export default function DocumentVerificationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: doc, isLoading: docLoading } = useQuery({
    queryKey: ['doc', id],
    queryFn: () => api.getDocument(id as string),
    enabled: !!id,
  });

  const { data: verifyResult, isLoading: verifyLoading, refetch } = useQuery({
    queryKey: ['verify-doc', id],
    queryFn: () => api.verifyDocument(id as string),
    enabled: !!id,
  });

  const tamperMutation = useMutation({
    mutationFn: () => api.simulateTamper(id as string),
    onSuccess: () => {
      refetch();
    },
  });

  if (docLoading || verifyLoading) {
    return (
      <View style={styles.centerWrap}>
        <Text style={styles.loadingText}>Executing Cryptographic Verification against Permissioned Ledger...</Text>
      </View>
    );
  }

  const isVerified = verifyResult?.status === 'VERIFIED';
  const isMismatch = verifyResult?.status === 'MISMATCH' || verifyResult?.isTampered;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Button title="← Return to Case File" onPress={() => router.back()} variant="secondary" size="sm" />
        <View style={styles.headerTitles}>
          <Text style={styles.title}>CRYPTOGRAPHIC EVIDENCE VERIFICATION</Text>
          <Text style={styles.subtitle}>
            Independent Hash Audit & Blockchain Ledger Authenticity Proof
          </Text>
        </View>
      </View>

      {/* Verification Seal Motif */}
      <VerificationSeal
        status={isVerified ? 'VERIFIED' : 'MISMATCH'}
        timestamp={verifyResult?.ledgerTimestamp ?? undefined}
        txId={verifyResult?.ledgerTxId ?? undefined}
        size="lg"
      />

      {/* Side-by-Side Cryptographic Proof Comparison */}
      <Panel
        title="CRYPTOGRAPHIC AUDIT BREAKDOWN"
        subtitle="Comparing active object storage byte payload against authoritative immutable ledger anchor"
        variant={isVerified ? 'verified' : 'alert'}
      >
        <View style={styles.hashComparisonGrid}>
          <View style={styles.hashCard}>
            <Text style={styles.hashCardLabel}>1. ACTIVE OBJECT STORAGE SHA-256 (COMPUTED LIVE)</Text>
            <HashDisplay hash={verifyResult?.computedHash || '—'} verified={isVerified} />
            <Text style={styles.hashCardNote}>
              Generated via Node.js SHA-256 hash calculation over active binary object in MinIO storage.
            </Text>
          </View>

          <View style={styles.hashCard}>
            <Text style={styles.hashCardLabel}>2. AUTHORITATIVE METADATA RECORD HASH</Text>
            <HashDisplay hash={verifyResult?.storedHash || '—'} verified={isVerified} />
            <Text style={styles.hashCardNote}>
              Stored in secure database registry upon initial ingestion by investigating officer.
            </Text>
          </View>

          <View style={styles.hashCard}>
            <Text style={styles.hashCardLabel}>3. PERMISSIONED LEDGER ANCHOR BLOCK PROOF</Text>
            <HashDisplay hash={verifyResult?.ledgerHash || '—'} verified={isVerified} />
            <Text style={styles.hashCardNote}>
              Anchored in cryptographically chained blockchain block with immutable validator signature.
            </Text>
          </View>
        </View>

        {/* Verification Status Summary Callout */}
        <View style={[styles.summaryBox, isVerified ? styles.summaryBoxVerified : styles.summaryBoxMismatch]}>
          <Text style={[styles.summaryTitle, isVerified ? styles.summaryTitleVerified : styles.summaryTitleMismatch]}>
            {isVerified ? '[AUTHENTICATED] CRYPTOGRAPHIC INTEGRITY AFFIRMED' : '[TAMPER ALERT] CRITICAL INTEGRITY MISMATCH DETECTED'}
          </Text>
          <Text style={styles.summaryDesc}>
            {verifyResult?.verificationMessage}
          </Text>
          <Text style={styles.auditedMeta}>
            Audited on {verifyResult?.auditedAt ? new Date(verifyResult.auditedAt).toLocaleString() : new Date().toLocaleString()} by Pramaan Verification Node
          </Text>
        </View>
      </Panel>

      {/* Live Demonstration: Tampering Simulator */}
      <Panel
        title="TAMPER VERIFICATION CONTROLS"
        subtitle="Verification engine live detection of evidence alteration"
        variant="ledger"
      >
        <Text style={styles.demoExplanation}>
          This verification tool tests active detection when an exhibit is altered in binary storage. The verification engine checks the active SHA-256 digest against the ledger anchor and triggers an integrity mismatch alert upon discrepancy.
        </Text>

        <View style={styles.demoActionRow}>
          <Button
            title={tamperMutation.isPending ? 'APPLYING CORRUPTION...' : 'SIMULATE TAMPERED DOCUMENT TEST'}
            onPress={() => tamperMutation.mutate()}
            loading={tamperMutation.isPending}
            variant="danger"
          />
          <Button
            title="RE-RUN LEDGER VERIFICATION"
            onPress={() => refetch()}
            variant="secondary"
          />
        </View>
      </Panel>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  centerWrap: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: typography.fontSans,
    fontSize: 14,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  headerTitles: {
    flex: 1,
  },
  title: {
    fontFamily: typography.fontSerif,
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  subtitle: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  hashComparisonGrid: {
    gap: 12,
    marginBottom: 16,
  },
  hashCard: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    borderRadius: 2,
  },
  hashCardLabel: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  hashCardNote: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  summaryBox: {
    borderWidth: 1,
    borderRadius: 2,
    padding: 14,
  },
  summaryBoxVerified: {
    backgroundColor: colors.verifiedLight,
    borderColor: colors.verifiedBorder,
  },
  summaryBoxMismatch: {
    backgroundColor: colors.alertLight,
    borderColor: colors.alertBorder,
  },
  summaryTitle: {
    fontFamily: typography.fontSans,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  summaryTitleVerified: {
    color: colors.verifiedDark,
  },
  summaryTitleMismatch: {
    color: colors.alertDark,
  },
  summaryDesc: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textPrimary,
    marginTop: 4,
    lineHeight: 18,
  },
  auditedMeta: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 6,
  },
  demoExplanation: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  demoActionRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
});
