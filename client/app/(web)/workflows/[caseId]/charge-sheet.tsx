import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  colors,
  typography,
  Panel,
  Button,
  Input,
  WorkflowChecklist,
  StatusTag,
  LoadingScreen,
} from '@pramaan/ui';
import { api } from '../../../../services/api';
import { useAuthStore } from '../../../../stores/authStore';

export default function ChargeSheetWorkflowScreen() {
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const isIO = user?.role === 'INVESTIGATION_OFFICER';
  const isProsecutor = user?.role === 'PROSECUTOR';

  const [filingNotes, setFilingNotes] = useState('Final police report prepared under Section 173 CrPC / 193 BNSS for judicial scrutiny.');
  const [designatedCourt, setDesignatedCourt] = useState('Special Fast Track Sessions Court for Women & Children, Chennai');
  const [serverBlockMessage, setServerBlockMessage] = useState<string | null>(null);

  const { data: workflow, isLoading, refetch } = useQuery({
    queryKey: ['workflow', caseId],
    queryFn: () => api.getWorkflowStatus(caseId as string),
    enabled: !!caseId,
  });

  const satisfyMutation = useMutation({
    mutationFn: (requirementId: string) =>
      api.satisfyWorkflowRequirement(caseId as string, requirementId, 'Digital endorsement verified and sealed.'),
    onSuccess: () => {
      setServerBlockMessage(null);
      refetch();
    },
  });

  const fileMutation = useMutation({
    mutationFn: () =>
      api.fileChargeSheet(caseId as string, {
        filingNotes,
        designatedCourt,
        prosecutorConfirmation: true,
      }),
    onSuccess: () => {
      setServerBlockMessage(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
    },
    onError: (err: any) => {
      setServerBlockMessage(err.message || 'Filing blocked by server enforcement.');
    },
  });

  if (isLoading || !workflow) {
    return (
      <View style={styles.centerWrap}>
        <LoadingScreen
          message="Evaluating Statutory Workflow Prerequisites..."
          subMessage="Inspecting Sections 173 CrPC / 193 BNSS filing criteria & forensic checks"
        />
      </View>
    );
  }

  const unsatisfiedItems = workflow.requirements.filter((r) => !r.isSatisfied);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Button title="← Return to Case File" onPress={() => router.back()} variant="secondary" size="sm" />
        <View style={styles.headerTitles}>
          <Text style={styles.title}>CHARGE-SHEET WORKFLOW SCRUTINY</Text>
          <Text style={styles.subtitle}>
            Section 173 Cr.P.C / Section 193 BNSS Formal Filing Gatekeeper
          </Text>
        </View>
      </View>

      {/* Progress & Status Card */}
      <View style={styles.statusBar}>
        <View>
          <Text style={styles.caseBadge}>CASE: {workflow.caseNumber}</Text>
          <Text style={styles.progressText}>
            Statutory Completion: {workflow.progressPercentage}% ({workflow.requirements.length - unsatisfiedItems.length}/{workflow.requirements.length} Satisfied)
          </Text>
        </View>
        <StatusTag
          label={workflow.isFiled ? 'FILED IN COURT' : workflow.canFile ? 'READY TO FILE' : 'FILING BLOCKED'}
          variant={workflow.isFiled ? 'filed' : workflow.canFile ? 'verified' : 'alert'}
          size="md"
        />
      </View>

      {/* Server-Side Block Alert */}
      {serverBlockMessage && (
        <View style={styles.serverBlockAlert}>
          <Text style={styles.blockIcon}>[RESTRICTED]</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.blockTitle}>BACKEND GATEWAY REJECTION (HTTP 409 CONFLICT)</Text>
            <Text style={styles.blockDesc}>{serverBlockMessage}</Text>
          </View>
        </View>
      )}

      {/* Checklist Component */}
      <WorkflowChecklist
        requirements={workflow.requirements}
        canFile={workflow.canFile}
      />

      {/* Action to Satisfy Missing Requirement */}
      {unsatisfiedItems.length > 0 && !workflow.isFiled && (
        <Panel
          title="STATUTORY DEFICIENCY RESOLUTION"
          subtitle="Resolve pending prerequisites to satisfy server-side filing gates"
          variant="ledger"
        >
          <Text style={styles.satisfyDesc}>
            The following prerequisite is currently incomplete. Provide the required supervisory endorsement signature below:
          </Text>

          {unsatisfiedItems.map((item) => (
            <View key={item.id} style={styles.satisfyRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.satisfyItemTitle}>{item.title}</Text>
                <Text style={styles.satisfyItemDesc}>{item.description}</Text>
              </View>
              <Button
                title={satisfyMutation.isPending ? 'SIGNING...' : 'APPLY DIGITAL ENDORSEMENT'}
                onPress={() => satisfyMutation.mutate(item.id)}
                loading={satisfyMutation.isPending}
                variant="verified"
                size="sm"
              />
            </View>
          ))}
        </Panel>
      )}

      {/* Charge Sheet Filing Form */}
      <Panel
        title="JUDICIAL FILING SUBMISSION"
        subtitle={workflow.isFiled ? 'Charge sheet filed and anchored in ledger' : 'Formal electronic submission to designated court'}
        variant={workflow.isFiled ? 'verified' : 'default'}
      >
        {workflow.isFiled ? (
          <View style={styles.filedSuccessBox}>
            <Text style={styles.filedSuccessTitle}>[CONFIRMED] CHARGE SHEET FILED IN COMPETENT SESSIONS COURT</Text>
            <Text style={styles.filedSuccessDetail}>
              LODGED ON: {new Date(workflow.filedAt || '').toLocaleString()}
            </Text>
            <Text style={styles.filedSuccessTx}>
              BLOCKCHAIN LEDGER ANCHOR TX: {workflow.filingLedgerTxId}
            </Text>
          </View>
        ) : isIO ? (
          <View style={styles.filingForm}>
            <Input
              label="DESIGNATED JURISDICTIONAL COURT"
              value={designatedCourt}
              onChangeText={setDesignatedCourt}
            />
            <Input
              label="STATUTORY POLICE REPORT / FILING MEMO"
              value={filingNotes}
              onChangeText={setFilingNotes}
              multiline
              numberOfLines={3}
            />

            <Button
              title={
                fileMutation.isPending
                  ? 'COMMITTING FILING TO LEDGER...'
                  : workflow.canFile
                  ? 'LODGE FORMAL CHARGE SHEET IN COURT →'
                  : 'SUBMIT FOR STATUTORY FILING REVIEW →'
              }
              onPress={() => fileMutation.mutate()}
              loading={fileMutation.isPending}
              variant={workflow.canFile ? 'verified' : 'danger'}
              size="lg"
            />
          </View>
        ) : (
          <View style={styles.prosecutorNoticeBox}>
            <Text style={styles.prosecutorNoticeTitle}>STATUTORY NOTICE — BNSS SECTION 193</Text>
            <Text style={styles.prosecutorNoticeText}>
              Formal lodging of the police report (charge sheet) in court is strictly reserved for the assigned Investigating Officer (IO).
            </Text>
            <Text style={styles.prosecutorNoticeSubText}>
              {isProsecutor
                ? 'As Public Prosecutor, your statutory remit is pre-trial scrutiny and endorsing mandatory legal requirements above.'
                : 'Judges and Analysts hold supervisory scrutiny rights over filed records only.'}
            </Text>
          </View>
        )}
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
    flexWrap: 'wrap',
  },
  headerTitles: {
    flex: 1,
    minWidth: 200,
  },
  title: {
    fontFamily: typography.fontSerif,
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    flexWrap: 'wrap',
  },
  subtitle: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBar: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 2,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 10,
  },
  caseBadge: {
    fontFamily: typography.fontMono,
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  progressText: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  serverBlockAlert: {
    flexDirection: 'row',
    backgroundColor: colors.alertLight,
    borderWidth: 1,
    borderColor: colors.alertBorder,
    padding: 12,
    borderRadius: 2,
    marginBottom: 16,
    gap: 12,
    alignItems: 'center',
  },
  blockIcon: {
    fontSize: 20,
  },
  blockTitle: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '800',
    color: colors.alertDark,
    letterSpacing: 0.5,
  },
  blockDesc: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textPrimary,
    marginTop: 2,
  },
  satisfyDesc: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  satisfyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    borderRadius: 2,
    gap: 12,
    flexWrap: 'wrap',
  },
  satisfyItemTitle: {
    fontFamily: typography.fontSans,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  satisfyItemDesc: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  filingForm: {
    marginTop: 4,
  },
  filedSuccessBox: {
    backgroundColor: colors.verifiedLight,
    borderWidth: 1,
    borderColor: colors.verifiedBorder,
    padding: 16,
    borderRadius: 2,
  },
  filedSuccessTitle: {
    fontFamily: typography.fontSerif,
    fontSize: 15,
    fontWeight: '700',
    color: colors.verifiedDark,
  },
  filedSuccessDetail: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.verifiedDark,
    marginTop: 4,
  },
  filedSuccessTx: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.verifiedDark,
    marginTop: 6,
    fontWeight: '700',
  },
  prosecutorNoticeBox: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: 16,
    borderRadius: 2,
  },
  prosecutorNoticeTitle: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  prosecutorNoticeText: {
    fontFamily: typography.fontSans,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 18,
    marginBottom: 4,
  },
  prosecutorNoticeSubText: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
