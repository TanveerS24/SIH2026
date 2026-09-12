import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  colors,
  typography,
  Panel,
  Button,
  Input,
  CaseHeader,
  Timeline,
  HashDisplay,
  StatusTag,
  DataTable,
  RedactedField,
} from '@pramaan/ui';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../stores/authStore';

export default function CaseFileDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'documents' | 'custody' | 'workflow' | 'audit' | 'relationships'>('documents');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload modal state
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('FORENSIC_REPORT');
  const [docFileName, setDocFileName] = useState('Forensic_Digital_Extraction_001.pdf');
  const [docContentText, setDocContentText] = useState('FORENSIC EXAMINATION REPORT: Corroborates timestamps and digital communications log.');

  const { data: caseRecord, isLoading, error } = useQuery({
    queryKey: ['case', id],
    queryFn: () => api.getCaseById(id as string),
    enabled: !!id,
  });

  const { data: custodyEvents = [] } = useQuery({
    queryKey: ['custody', id],
    queryFn: () => api.getCustodyTimeline(id as string),
    enabled: !!id,
  });

  const { data: relationships } = useQuery({
    queryKey: ['relationships', id],
    queryFn: () => api.getCaseRelationships(id as string),
    enabled: !!id,
  });

  const uploadMutation = useMutation({
    mutationFn: (payload: any) => api.uploadDocument(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
      queryClient.invalidateQueries({ queryKey: ['custody', id] });
      setShowUploadModal(false);
      setDocTitle('');
    },
  });

  const handleUpload = () => {
    if (!docTitle) return;
    const base64Content = btoa(docContentText);
    uploadMutation.mutate({
      caseId: id,
      title: docTitle,
      fileName: docFileName,
      documentType: docType,
      mimeType: 'application/pdf',
      fileBase64: base64Content,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centerWrap}>
        <Text style={styles.loadingText}>Retrieving Cryptographically Anchored Case File...</Text>
      </View>
    );
  }

  if (error || !caseRecord) {
    return (
      <View style={styles.centerWrap}>
        <Text style={styles.errorText}>
          {error ? (error as any).message : 'Access Restricted: You do not possess clearance for this case record.'}
        </Text>
        <Button title="← Return to Register" onPress={() => router.push('/(web)/cases')} variant="secondary" style={{ marginTop: 12 }} />
      </View>
    );
  }

  const isJudicial = user?.role === 'JUDGE';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Case Header */}
      <CaseHeader
        caseNumber={caseRecord.caseNumber}
        title={caseRecord.title}
        status={caseRecord.status}
        priority={caseRecord.priority}
        jurisdiction={caseRecord.jurisdiction}
        policeStation={caseRecord.policeStation}
        bnsSections={caseRecord.bnsSections}
        assignedOfficerName={caseRecord.assignments?.[0]?.user?.name}
        createdAt={caseRecord.createdAt}
      />

      {/* Cross-Case Intelligence Lead Notice (if relationships exist) */}
      {relationships && relationships.relationshipsCount > 0 && (
        <View style={styles.leadAlertBox}>
          <Text style={styles.leadIcon}>⚡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.leadTitle}>
              CROSS-CASE INTELLIGENCE CORRELATION DETECTED ({relationships.relationshipsCount} LINK)
            </Text>
            <Text style={styles.leadDesc}>
              Automated pattern matching detected shared suspects/locations with Case {relationships.relationships[0]?.targetCaseNumber}.
            </Text>
          </View>
          <Button
            title="VIEW INTELLIGENCE LEADS"
            onPress={() => setActiveTab('relationships')}
            variant="outline"
            size="sm"
          />
        </View>
      )}

      {/* Tabs Bar */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          onPress={() => setActiveTab('documents')}
          style={[styles.tabBtn, activeTab === 'documents' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, activeTab === 'documents' && styles.tabTextActive]}>
            📄 EVIDENCE DOCUMENTS ({caseRecord.documents?.length || 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('custody')}
          style={[styles.tabBtn, activeTab === 'custody' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, activeTab === 'custody' && styles.tabTextActive]}>
            ⛓️ CHAIN OF CUSTODY ({custodyEvents.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('workflow')}
          style={[styles.tabBtn, activeTab === 'workflow' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, activeTab === 'workflow' && styles.tabTextActive]}>
            ⚖️ CHARGE SHEET WORKFLOW
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('relationships')}
          style={[styles.tabBtn, activeTab === 'relationships' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, activeTab === 'relationships' && styles.tabTextActive]}>
            🔗 CROSS-CASE LEADS ({relationships?.relationshipsCount || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab 1: Documents & Evidence */}
      {activeTab === 'documents' && (
        <Panel
          title="EVIDENTIARY EXHIBITS & DOCUMENT REPOSITORY"
          subtitle="All files are cryptographically hashed (SHA-256) and anchored in the permissioned ledger"
          action={
            !isJudicial ? (
              <Button
                title="+ INGEST / UPLOAD NEW EVIDENCE"
                onPress={() => setShowUploadModal(true)}
                variant="primary"
                size="sm"
              />
            ) : undefined
          }
        >
          {caseRecord.documents?.map((doc: any) => (
            <View key={doc.id} style={styles.docItemCard}>
              <View style={styles.docTopLine}>
                <View style={styles.docTypeBadge}>
                  <Text style={styles.docTypeText}>{doc.documentType.replace(/_/g, ' ')}</Text>
                </View>
                <View style={styles.docActions}>
                  <Button
                    title="🔍 VERIFY INTEGRITY (LEDGER)"
                    onPress={() => router.push(`/(web)/documents/${doc.id}/verify` as any)}
                    variant="verified"
                    size="sm"
                  />
                </View>
              </View>

              <Text style={styles.docTitle}>{doc.title}</Text>
              <Text style={styles.docMeta}>
                FILE: {doc.originalFileName} • UPLOADED BY: {doc.uploadedByName || 'Officer'} ({doc.uploadedByRole}) • DATE: {new Date(doc.createdAt).toLocaleString()}
              </Text>

              {/* Extracted OCR Sections */}
              {doc.detectedBnsSections && doc.detectedBnsSections.length > 0 && (
                <View style={styles.ocrTagRow}>
                  <Text style={styles.ocrLabel}>OCR DETECTED SECTIONS:</Text>
                  {doc.detectedBnsSections.map((sec: string, i: number) => (
                    <View key={i} style={styles.ocrTag}>
                      <Text style={styles.ocrText}>{sec}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Authoritative Hash & Ledger Tx */}
              <HashDisplay hash={doc.sha256Hash} label="AUTHORITATIVE SHA-256 EVIDENCE HASH" verified />
              {doc.ledgerTxId && (
                <Text style={styles.ledgerTxText}>LEDGER ANCHOR TX: {doc.ledgerTxId}</Text>
              )}
            </View>
          ))}
        </Panel>
      )}

      {/* Tab 2: Chain of Custody */}
      {activeTab === 'custody' && (
        <Panel
          title="IMMUTABLE CHAIN OF CUSTODY TIMELINE"
          subtitle="Chronological transaction log tracking every upload, OCR processing, officer signature, and judicial verification"
        >
          <Timeline events={custodyEvents} />
        </Panel>
      )}

      {/* Tab 3: Charge-Sheet Workflow */}
      {activeTab === 'workflow' && (
        <Panel
          title="CHARGE-SHEET FILING GATEWAY"
          subtitle="Statutory validation engine enforcing prerequisite completeness before judicial submission"
        >
          <View style={styles.workflowGatewayBox}>
            <Text style={styles.workflowGateTitle}>
              Status: {caseRecord.isFiled ? 'FILED IN COMPETENT COURT' : 'PRE-FILING SCRUTINY IN PROGRESS'}
            </Text>
            <Text style={styles.workflowGateDesc}>
              {caseRecord.isFiled
                ? `Charge sheet formally lodged with court on ${new Date(caseRecord.filedAt).toLocaleString()}. Ledger Tx: ${caseRecord.filingLedgerTxId}`
                : 'Charge sheet requires mandatory forensic laboratory reports, BNSS Section 180 witness depositions, and officer digital endorsement before filing is unlocked.'}
            </Text>
            <Button
              title="OPEN INTERACTIVE WORKFLOW SCRUTINY PANEL →"
              onPress={() => router.push(`/(web)/workflows/${caseRecord.id}/charge-sheet` as any)}
              variant="primary"
              style={{ marginTop: 12 }}
            />
          </View>
        </Panel>
      )}

      {/* Tab 4: Cross-Case Leads */}
      {activeTab === 'relationships' && (
        <Panel
          title="CROSS-CASE INTELLIGENCE & PATTERN MATCHES"
          subtitle="Correlations across suspect identities, geographical locations, and modus-operandi signatures"
        >
          {relationships?.relationships?.map((rel: any, idx: number) => (
            <View key={idx} style={styles.leadCard}>
              <View style={styles.leadHeader}>
                <Text style={styles.leadTargetCase}>{rel.targetCaseNumber}</Text>
                <StatusTag label={rel.correlationType.replace(/_/g, ' ')} variant="gold" size="sm" />
              </View>
              <Text style={styles.leadTargetTitle}>{rel.targetTitle}</Text>
              <Text style={styles.leadDetail}>
                {rel.correlationType === 'SUSPECT_MATCH'
                  ? `Identified shared suspect: ${rel.sharedAttributes.suspects.join(', ')}`
                  : 'Shared geographical radius in T. Nagar zone'}
              </Text>
              <Text style={styles.leadDisclaimer}>{rel.investigativeNotice}</Text>
            </View>
          ))}
          {(!relationships?.relationships || relationships.relationships.length === 0) && (
            <Text style={styles.emptyText}>No cross-case linkages detected for this record.</Text>
          )}
        </Panel>
      )}

      {/* Ingest Document Modal */}
      <Modal visible={showUploadModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>INGEST & ANCHOR NEW EVIDENCE DOCUMENT</Text>
              <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Input label="EXHIBIT / DOCUMENT TITLE" value={docTitle} onChangeText={setDocTitle} placeholder="e.g. State FSL Cyber Examination Report" />
              <Input label="DOCUMENT TYPE (FIR, WITNESS_STATEMENT, FORENSIC_REPORT, SEIZURE_MEMO)" value={docType} onChangeText={setDocType} />
              <Input label="ORIGINAL FILE NAME" value={docFileName} onChangeText={setDocFileName} monospace />
              <Input label="DOCUMENT TEXT CONTENT (SIMULATED PAYLOAD FOR OCR & HASHING)" value={docContentText} onChangeText={setDocContentText} multiline numberOfLines={4} />

              <View style={styles.modalActions}>
                <Button title="CANCEL" onPress={() => setShowUploadModal(false)} variant="secondary" />
                <Button
                  title={uploadMutation.isPending ? 'CALCULATING SHA-256 & ANCHORING...' : 'UPLOAD, HASH & ANCHOR IN LEDGER →'}
                  onPress={handleUpload}
                  loading={uploadMutation.isPending}
                  variant="primary"
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  errorText: {
    fontFamily: typography.fontSans,
    fontSize: 13,
    color: colors.alert,
    textAlign: 'center',
  },
  leadAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ledgerGoldLight,
    borderWidth: 1,
    borderColor: colors.ledgerGoldBorder,
    padding: 12,
    borderRadius: 2,
    marginBottom: 16,
    gap: 12,
  },
  leadIcon: {
    fontSize: 20,
    color: colors.ledgerGold,
  },
  leadTitle: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '800',
    color: colors.ledgerGold,
    letterSpacing: 0.5,
  },
  leadDesc: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    marginRight: 8,
  },
  tabBtnActive: {
    borderBottomColor: colors.primary,
    backgroundColor: colors.surfaceSelected,
  },
  tabText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.4,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  docItemCard: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    padding: 14,
    marginBottom: 12,
  },
  docTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  docTypeBadge: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  docTypeText: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  docActions: {
    flexDirection: 'row',
    gap: 6,
  },
  docTitle: {
    fontFamily: typography.fontSerif,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  docMeta: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 6,
  },
  ocrTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 6,
    flexWrap: 'wrap',
  },
  ocrLabel: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
  },
  ocrTag: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 2,
  },
  ocrText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  ledgerTxText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.ledgerGold,
    marginTop: 4,
  },
  workflowGatewayBox: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    borderRadius: 2,
  },
  workflowGateTitle: {
    fontFamily: typography.fontSerif,
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  workflowGateDesc: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  leadCard: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    padding: 12,
    marginBottom: 10,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  leadTargetCase: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  leadTargetTitle: {
    fontFamily: typography.fontSerif,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  leadDetail: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  leadDisclaimer: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    color: colors.alert,
    marginTop: 4,
    fontWeight: '700',
  },
  emptyText: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(19, 32, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 620,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 2,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.surfaceMuted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontFamily: typography.fontSerif,
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  closeBtn: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMuted,
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
});
