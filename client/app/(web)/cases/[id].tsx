import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Platform } from 'react-native';
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
  LoadingScreen,
} from '@pramaan/ui';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../stores/authStore';

const DOC_TYPES = [
  { value: 'FORENSIC_REPORT', label: 'Forensic Report' },
  { value: 'FIR', label: 'FIR' },
  { value: 'WITNESS_STATEMENT', label: 'Witness Statement' },
  { value: 'VICTIM_STATEMENT', label: 'Victim Statement' },
  { value: 'SEIZURE_MEMO', label: 'Seizure Memo' },
  { value: 'PANCHNAMA', label: 'Panchnama' },
  { value: 'PHOTOGRAPHIC_EVIDENCE', label: 'Photo Evidence' },
  { value: 'CHARGE_SHEET', label: 'Charge Sheet' },
  { value: 'MEDICAL_EXAM_REPORT', label: 'Medical Report' },
];

export default function CaseFileDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const fileInputRef = useRef<any>(null);

  const [activeTab, setActiveTab] = useState<'documents' | 'custody' | 'workflow' | 'relationships'>('documents');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'manual'>('file');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // File upload mode
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; base64: string; type: string } | null>(null);

  // Shared / manual mode fields
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('FORENSIC_REPORT');
  const [docContentText, setDocContentText] = useState('');

  // Expanded hashes
  const [expandedHashes, setExpandedHashes] = useState<Set<string>>(new Set());
  // Expanded justifications (access requests)
  const [expandedRels, setExpandedRels] = useState<Set<number>>(new Set());

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
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setShowUploadModal(false);
      resetUpload();
    },
    onError: (err: any) => {
      setUploadError(err?.message || 'Failed to ingest exhibit document. Please check the file and try again.');
    },
  });

  const resetUpload = () => {
    setUploadedFile(null);
    setDocTitle('');
    setDocContentText('');
    setUploadError(null);
  };

  const processSelectedFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      setUploadedFile({
        name: file.name,
        size: file.size,
        base64,
        type: file.type || 'application/pdf',
      });
      setUploadError(null);
      if (!docTitle) setDocTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    };
    reader.readAsDataURL(file);
  };

  const triggerFilePicker = () => {
    if (typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.jpg,.jpeg,.png,.webp,.txt';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) processSelectedFile(file);
      };
      input.click();
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (e: any) => {
    const file = e.target?.files?.[0];
    if (file) processSelectedFile(file);
  };

  const safeBase64 = (str: string): string => {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch {
      return '';
    }
  };

  const handleUpload = () => {
    setUploadError(null);
    if (!docTitle.trim()) {
      setUploadError('Please provide an Exhibit Title.');
      return;
    }
    if (uploadMode === 'file' && !uploadedFile) {
      setUploadError('Please select a file to ingest.');
      return;
    }
    if (uploadMode === 'manual' && !docContentText.trim()) {
      setUploadError('Please type or paste document content.');
      return;
    }

    const payload = uploadMode === 'file'
      ? {
          caseId: id,
          title: docTitle.trim(),
          fileName: uploadedFile!.name,
          documentType: docType,
          mimeType: uploadedFile!.type || 'application/octet-stream',
          fileBase64: uploadedFile!.base64,
        }
      : {
          caseId: id,
          title: docTitle.trim(),
          fileName: `${docTitle.trim().replace(/\s+/g, '_')}.txt`,
          documentType: docType,
          mimeType: 'text/plain',
          fileBase64: safeBase64(docContentText),
        };

    uploadMutation.mutate(payload);
  };

  const toggleHash = (docId: string) => {
    setExpandedHashes((prev) => {
      const next = new Set(prev);
      next.has(docId) ? next.delete(docId) : next.add(docId);
      return next;
    });
  };

  const toggleRel = (idx: number) => {
    setExpandedRels((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centerWrap}>
        <LoadingScreen
          message="Loading Case Record & Evidentiary Chain..."
          subMessage="Fetching digital exhibits, hash manifests, and custody records"
        />
      </View>
    );
  }

  if (error || !caseRecord) {
    return (
      <View style={styles.centerWrap}>
        <Text style={styles.errorText}>
          {error ? (error as any).message : 'Access restricted or case not found.'}
        </Text>
        <Button title="← Back to Register" onPress={() => router.push('/(web)/cases')} variant="secondary" style={{ marginTop: 12 }} />
      </View>
    );
  }

  const canIngest = user?.role === 'INVESTIGATION_OFFICER' || user?.role === 'WOMEN_HELP_DESK_OFFICER';

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

      {/* Cross-Case Alert (compact) */}
      {relationships && relationships.relationshipsCount > 0 && (
        <TouchableOpacity style={styles.leadAlertBox} onPress={() => setActiveTab('relationships')} activeOpacity={0.8}>
          <Text style={styles.leadBadge}>[INTEL]</Text>
          <Text style={styles.leadTitle}>
            {relationships.relationshipsCount} cross-case intelligence link{relationships.relationshipsCount > 1 ? 's' : ''} detected
          </Text>
          <Text style={styles.leadArrow}>›</Text>
        </TouchableOpacity>
      )}

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {([
          { key: 'documents', label: 'EXHIBITS', count: caseRecord.documents?.length || 0 },
          { key: 'custody', label: 'CUSTODY', count: custodyEvents.length },
          { key: 'workflow', label: 'WORKFLOW', count: null },
          { key: 'relationships', label: 'LINKS', count: relationships?.relationshipsCount || 0 },
        ] as const).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
              {tab.count !== null && <Text style={styles.tabCount}> {tab.count}</Text>}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab: Documents */}
      {activeTab === 'documents' && (
        <Panel
          title={`EXHIBITS (${caseRecord.documents?.length || 0})`}
          action={
            canIngest ? (
              <Button title="+ INGEST" onPress={() => setShowUploadModal(true)} variant="primary" size="sm" />
            ) : undefined
          }
        >
          {(!caseRecord.documents || caseRecord.documents.length === 0) ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No exhibits ingested yet.</Text>
            </View>
          ) : caseRecord.documents.map((doc: any) => {
            const hashExpanded = expandedHashes.has(doc.id);
            return (
              <View key={doc.id} style={styles.docCard}>
                <View style={styles.docTopRow}>
                  <View style={styles.docTypePill}>
                    <Text style={styles.docTypeText}>{doc.documentType.replace(/_/g, ' ')}</Text>
                  </View>
                  <View style={styles.docActions}>
                    <TouchableOpacity onPress={() => toggleHash(doc.id)} style={styles.hashToggleBtn}>
                      <Text style={styles.hashToggleText}>{hashExpanded ? 'HIDE HASH' : 'SHOW HASH'}</Text>
                    </TouchableOpacity>
                    <Button
                      title="VERIFY"
                      onPress={() => router.push(`/(web)/documents/${doc.id}/verify` as any)}
                      variant="verified"
                      size="sm"
                    />
                  </View>
                </View>

                <Text style={styles.docTitle}>{doc.title}</Text>
                <Text style={styles.docMeta} numberOfLines={1}>
                  {doc.originalFileName} • {doc.uploadedByName || 'Officer'} • {new Date(doc.createdAt).toLocaleDateString('en-IN')}
                </Text>

                {/* BNS tags */}
                {doc.detectedBnsSections && doc.detectedBnsSections.length > 0 && (
                  <View style={styles.ocrTagRow}>
                    {doc.detectedBnsSections.slice(0, 3).map((sec: string, i: number) => (
                      <View key={i} style={styles.ocrTag}>
                        <Text style={styles.ocrText}>{sec}</Text>
                      </View>
                    ))}
                    {doc.detectedBnsSections.length > 3 && (
                      <Text style={styles.ocrMore}>+{doc.detectedBnsSections.length - 3} more</Text>
                    )}
                  </View>
                )}

                {/* Expandable Hash */}
                {hashExpanded && (
                  <View style={styles.hashExpanded}>
                    <HashDisplay hash={doc.sha256Hash} label="SHA-256" verified />
                    {doc.ledgerTxId && (
                      <Text style={styles.ledgerTxText} numberOfLines={1}>TX: {doc.ledgerTxId}</Text>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </Panel>
      )}

      {/* Tab: Chain of Custody */}
      {activeTab === 'custody' && (
        <Panel title={`CHAIN OF CUSTODY (${custodyEvents.length})`}>
          {custodyEvents.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No custody transactions recorded.</Text>
            </View>
          ) : (
            <Timeline events={custodyEvents} />
          )}
        </Panel>
      )}

      {/* Tab: Workflow */}
      {activeTab === 'workflow' && (
        <Panel title="CHARGE-SHEET WORKFLOW">
          <View style={styles.workflowBox}>
            <View style={styles.workflowStatusRow}>
              <View style={[styles.workflowDot, caseRecord.isFiled && styles.workflowDotFiled]} />
              <Text style={styles.workflowStatus}>
                {caseRecord.isFiled ? 'FILED IN COURT' : 'PRE-FILING — IN PROGRESS'}
              </Text>
            </View>
            {caseRecord.isFiled ? (
              <Text style={styles.workflowMeta}>
                Filed: {new Date(caseRecord.filedAt).toLocaleString('en-IN')}
              </Text>
            ) : (
              <Text style={styles.workflowDesc}>
                Requires forensic reports, witness depositions & officer endorsement.
              </Text>
            )}
            <Button
              title="OPEN WORKFLOW PANEL →"
              onPress={() => router.push(`/(web)/workflows/${caseRecord.id}/charge-sheet` as any)}
              variant="primary"
              size="sm"
              style={{ marginTop: 12 }}
            />
          </View>
        </Panel>
      )}

      {/* Tab: Cross-Case */}
      {activeTab === 'relationships' && (
        <Panel title={`INTELLIGENCE LINKS (${relationships?.relationshipsCount || 0})`}>
          {(!relationships?.relationships || relationships.relationships.length === 0) ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No cross-case links detected.</Text>
            </View>
          ) : relationships.relationships.map((rel: any, idx: number) => {
            const isExpanded = expandedRels.has(idx);
            return (
              <TouchableOpacity key={idx} style={styles.leadCard} onPress={() => toggleRel(idx)} activeOpacity={0.8}>
                <View style={styles.leadHeader}>
                  <Text style={styles.leadTargetCase}>{rel.targetCaseNumber}</Text>
                  <StatusTag label={rel.correlationType.replace(/_/g, ' ')} variant="gold" size="sm" />
                  <Text style={styles.expandChevron}>{isExpanded ? '∧' : '∨'}</Text>
                </View>
                <Text style={styles.leadTargetTitle} numberOfLines={isExpanded ? undefined : 1}>{rel.targetTitle}</Text>
                {isExpanded && (
                  <View style={styles.leadExpandedBody}>
                    <Text style={styles.leadDetail}>
                      {rel.correlationType === 'SUSPECT_MATCH'
                        ? `Shared suspect: ${rel.sharedAttributes?.suspects?.join(', ')}`
                        : 'Shared geographical radius'}
                    </Text>
                    {rel.investigativeNotice && (
                      <Text style={styles.leadDisclaimer}>{rel.investigativeNotice}</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </Panel>
      )}

      {/* Evidence Ingest Modal */}
      <Modal visible={showUploadModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>INGEST EVIDENCE</Text>
              <TouchableOpacity onPress={() => { setShowUploadModal(false); resetUpload(); }}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.modeTabs}>
              <TouchableOpacity
                style={[styles.modeTab, uploadMode === 'file' && styles.modeTabActive]}
                onPress={() => setUploadMode('file')}
              >
                <Text style={[styles.modeTabText, uploadMode === 'file' && styles.modeTabTextActive]}>
                  UPLOAD FILE
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeTab, uploadMode === 'manual' && styles.modeTabActive]}
                onPress={() => setUploadMode('manual')}
              >
                <Text style={[styles.modeTabText, uploadMode === 'manual' && styles.modeTabTextActive]}>
                  MANUAL ENTRY
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {uploadError && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>⚠️ {uploadError}</Text>
                </View>
              )}

              {uploadMode === 'file' ? (
                <View>
                  <TouchableOpacity
                    style={[styles.dropZone, uploadedFile && styles.dropZoneUploaded]}
                    onPress={triggerFilePicker}
                    activeOpacity={0.8}
                  >
                    {uploadedFile ? (
                      <View style={styles.filePreview}>
                        <Text style={styles.fileIcon}>[FILE]</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fileName} numberOfLines={1}>{uploadedFile.name}</Text>
                          <Text style={styles.fileSize}>{(uploadedFile.size / 1024).toFixed(1)} KB • Ready to anchor</Text>
                        </View>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation?.();
                            setUploadedFile(null);
                          }}
                          style={styles.removeFileBtn}
                        >
                          <Text style={styles.removeFileText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.dropZoneInner}>
                        <Text style={styles.dropZoneTitle}>Select evidence file to ingest</Text>
                        <Text style={styles.dropZoneHint}>Click to browse • PDF, JPG, PNG, TXT</Text>
                        <View style={styles.browsePill}>
                          <Text style={styles.browsePillText}>BROWSE FILE</Text>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>

                  {Platform.OS === 'web' && (
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.txt"
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                    />
                  )}
                </View>
              ) : (
                <Input
                  label="DOCUMENT CONTENT"
                  value={docContentText}
                  onChangeText={setDocContentText}
                  multiline
                  numberOfLines={5}
                  placeholder="Paste or type document content..."
                />
              )}

              <Input
                label="EXHIBIT TITLE"
                value={docTitle}
                onChangeText={setDocTitle}
                placeholder="e.g. FSL Cyber Examination Report"
              />

              {/* Document Type Selector Chips */}
              <View style={styles.docTypeSection}>
                <Text style={styles.docTypeLabel}>DOCUMENT TYPE</Text>
                <View style={styles.docTypeChips}>
                  {DOC_TYPES.map((t) => {
                    const isSelected = docType === t.value;
                    return (
                      <TouchableOpacity
                        key={t.value}
                        style={[styles.typeChip, isSelected && styles.typeChipActive]}
                        onPress={() => setDocType(t.value)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.typeChipText, isSelected && styles.typeChipTextActive]}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.modalActions}>
                <Button title="CANCEL" onPress={() => { setShowUploadModal(false); resetUpload(); }} variant="secondary" />
                <Button
                  title={uploadMutation.isPending ? 'ANCHORING IN LEDGER...' : 'UPLOAD & ANCHOR →'}
                  onPress={handleUpload}
                  loading={uploadMutation.isPending}
                  variant="primary"
                  disabled={uploadMutation.isPending || !docTitle.trim() || (uploadMode === 'file' && !uploadedFile) || (uploadMode === 'manual' && !docContentText.trim())}
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
  container: { padding: 20 },
  centerWrap: { flex: 1, padding: 40, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: typography.fontSans, fontSize: 13, color: colors.textMuted },
  errorText: { fontFamily: typography.fontSans, fontSize: 13, color: colors.alert, textAlign: 'center' },

  // Cross-case alert (compact)
  leadAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ledgerGoldLight,
    borderWidth: 1,
    borderColor: colors.ledgerGoldBorder,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    gap: 8,
  },
  leadBadge: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    fontWeight: '800',
    color: colors.ledgerGold,
    backgroundColor: colors.surface,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  leadTitle: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    fontWeight: '700',
    color: colors.ledgerGold,
    flex: 1,
  },
  leadArrow: { fontSize: 18, color: colors.ledgerGold },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
    marginBottom: 14,
  },
  tabBtn: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    marginRight: 2,
  },
  tabBtnActive: {
    borderBottomColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  tabText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  tabTextActive: { color: colors.primary },
  tabCount: { fontWeight: '800' },

  // Document cards
  docCard: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 12,
    marginBottom: 10,
  },
  docTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  docTypePill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  docTypeText: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.4,
  },
  docActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  hashToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 3,
    backgroundColor: colors.surface,
  },
  hashToggleText: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  docTitle: {
    fontFamily: typography.fontSans,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  docMeta: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 6,
  },
  ocrTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 6 },
  ocrTag: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 2,
  },
  ocrText: { fontFamily: typography.fontMono, fontSize: 9, fontWeight: '700', color: colors.primary },
  ocrMore: { fontFamily: typography.fontSans, fontSize: 9, color: colors.textMuted, alignSelf: 'center' },
  hashExpanded: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ledgerTxText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.ledgerGold,
    marginTop: 4,
  },

  // Empty
  emptyWrap: { padding: 32, alignItems: 'center' },
  emptyIcon: { fontSize: 28, marginBottom: 8 },
  emptyText: { fontFamily: typography.fontSans, fontSize: 12, color: colors.textMuted },

  // Workflow
  workflowBox: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 14,
  },
  workflowStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  workflowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.statusPending },
  workflowDotFiled: { backgroundColor: colors.verified },
  workflowStatus: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  workflowMeta: { fontFamily: typography.fontMono, fontSize: 10, color: colors.textMuted },
  workflowDesc: { fontFamily: typography.fontSans, fontSize: 11, color: colors.textSecondary, lineHeight: 16 },

  // Lead cards (cross-case)
  leadCard: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
  },
  leadHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  leadTargetCase: { fontFamily: typography.fontMono, fontSize: 11, fontWeight: '700', color: colors.primary },
  expandChevron: {
    marginLeft: 'auto',
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '700',
  },
  leadTargetTitle: { fontFamily: typography.fontSans, fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  leadExpandedBody: { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border },
  leadDetail: { fontFamily: typography.fontSans, fontSize: 11, color: colors.textSecondary },
  leadDisclaimer: { fontFamily: typography.fontSans, fontSize: 9, color: colors.alert, marginTop: 3, fontWeight: '700' },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(19, 32, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 6,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: colors.surfaceMuted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontFamily: typography.fontSerif, fontSize: 14, fontWeight: '700', color: colors.primary },
  closeBtn: { fontSize: 15, fontWeight: '700', color: colors.textMuted, padding: 4 },
  modeTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  modeTabActive: { borderBottomColor: colors.primary, backgroundColor: colors.primaryLight },
  modeTabText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  modeTabTextActive: { color: colors.primary },
  modalBody: { padding: 16 },
  dropZone: {
    borderWidth: 2,
    borderColor: colors.borderDark,
    borderStyle: 'dashed',
    borderRadius: 6,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: colors.surfaceMuted,
  },
  dropZoneUploaded: {
    borderColor: colors.verified,
    borderStyle: 'solid',
    backgroundColor: colors.verifiedLight,
    padding: 12,
    alignItems: 'flex-start',
  },
  dropZoneInner: { alignItems: 'center' },
  dropZoneTitle: { fontFamily: typography.fontSans, fontSize: 12, fontWeight: '700', color: colors.textPrimary, marginBottom: 3 },
  dropZoneHint: { fontFamily: typography.fontSans, fontSize: 10, color: colors.textMuted },
  filePreview: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' },
  fileIcon: {
    fontSize: 10,
    fontFamily: typography.fontMono,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  fileName: { fontFamily: typography.fontSans, fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  fileSize: { fontFamily: typography.fontMono, fontSize: 10, color: colors.textMuted, marginTop: 1 },
  removeFileBtn: { padding: 4 },
  removeFileText: { fontSize: 13, color: colors.textMuted, fontWeight: '700' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    paddingBottom: 4,
  },
  errorBanner: {
    backgroundColor: colors.alertLight || '#FDF2F2',
    borderColor: colors.alert || '#DC2626',
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.alert || '#DC2626',
    fontWeight: '600',
  },
  browsePill: {
    marginTop: 8,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 4,
  },
  browsePillText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  docTypeSection: {
    marginBottom: 12,
  },
  docTypeLabel: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  docTypeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeChip: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  typeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  typeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
