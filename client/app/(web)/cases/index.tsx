import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, typography, Panel, Button, Input, StatusTag, LoadingScreen } from '@pramaan/ui';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../stores/authStore';

type CreateMode = 'upload' | 'manual';

export default function CasesRegisterScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const fileInputRef = useRef<any>(null);

  const [filterQuery, setFilterQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>('upload');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Upload mode state
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; base64: string; type: string } | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');

  // Manual mode state
  const [caseNumber, setCaseNumber] = useState(`TN-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [jurisdiction, setJurisdiction] = useState(user?.jurisdiction || 'State Cyber Crime Division');
  const [policeStation, setPoliceStation] = useState(user?.department || 'Cyber Crime Police Station');
  const [bnsSections, setBnsSections] = useState('BNS 318, BNS 66');
  const [incidentLocation, setIncidentLocation] = useState(user?.jurisdiction || 'Chennai Central Cyber Cell');

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => api.getCases(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.createCase(payload),
    onSuccess: (newCase: any) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setShowCreateModal(false);
      resetForm();
      if (newCase?.id) {
        router.push(`/(web)/cases/${newCase.id}` as any);
      }
    },
    onError: (err: any) => {
      setErrorMessage(err?.message || 'Failed to register case record. Please review fields and retry.');
    },
  });

  const resetForm = () => {
    setUploadedFile(null);
    setUploadTitle('');
    setTitle('');
    setDescription('');
    setBnsSections('BNS 318, BNS 66');
    setIncidentLocation(user?.jurisdiction || 'Chennai Central Cyber Cell');
    setCaseNumber(`TN-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    setErrorMessage(null);
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
      setErrorMessage(null);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
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

  const handleCreateCase = () => {
    setErrorMessage(null);
    if (createMode === 'upload') {
      if (!uploadedFile) {
        setErrorMessage('Please select an FIR or evidence document first.');
        return;
      }
      const safeTitle = (uploadTitle.trim() || uploadedFile.name.replace(/\.[^/.]+$/, ''));
      createMutation.mutate({
        caseNumber: caseNumber.trim() || `TN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        title: safeTitle.length >= 3 ? safeTitle : `Case: ${safeTitle}`,
        description: `Registered from official FIR document: ${uploadedFile.name}`,
        jurisdiction: jurisdiction.trim() || user?.jurisdiction || 'State Cyber Crime Division',
        policeStation: policeStation.trim() || user?.department || 'Cyber Crime Police Station',
        bnsSections: bnsSections ? bnsSections.split(',').map((s) => s.trim()).filter(Boolean) : ['BNS 318'],
        incidentLocation: incidentLocation.trim() || 'Jurisdictional Police Station',
        priority: 'HIGH',
        sensitivity: 'HIGHLY_SENSITIVE',
        sourceDocumentBase64: uploadedFile.base64,
        sourceDocumentType: uploadedFile.type,
        sourceDocumentName: uploadedFile.name,
      });
    } else {
      if (!title.trim() || title.trim().length < 3) {
        setErrorMessage('Title must be at least 3 characters.');
        return;
      }
      const sections = bnsSections.split(',').map((s) => s.trim()).filter(Boolean);
      createMutation.mutate({
        caseNumber: caseNumber.trim() || `TN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        title: title.trim(),
        description: description.trim() || `Official criminal investigation registered under ${caseNumber}`,
        jurisdiction: jurisdiction.trim() || user?.jurisdiction || 'State Cyber Crime Division',
        policeStation: policeStation.trim() || user?.department || 'Cyber Crime Police Station',
        bnsSections: sections.length > 0 ? sections : ['BNS 318'],
        incidentLocation: incidentLocation.trim() || 'Jurisdictional Police Station',
        priority: 'HIGH',
        sensitivity: 'HIGHLY_SENSITIVE',
      });
    }
  };

  const filteredCases = cases.filter((c) =>
    c.caseNumber.toLowerCase().includes(filterQuery.toLowerCase()) ||
    c.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
    c.jurisdiction.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const canSubmit = createMode === 'upload'
    ? !!uploadedFile && !!(uploadTitle.trim() || uploadedFile.name)
    : title.trim().length >= 3;

  if (isLoading) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <LoadingScreen
          message="Loading Case Register Records..."
          subMessage="Fetching digital custody case files from state registry"
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>CASE REGISTER</Text>
          <Text style={styles.subtitle}>Digital evidence registry • {cases.length} recorded</Text>
        </View>
        {user?.role === 'INVESTIGATION_OFFICER' && (
          <Button
            title="+ REGISTER CASE"
            onPress={() => setShowCreateModal(true)}
            variant="primary"
            size="sm"
          />
        )}
      </View>

      {/* Filter */}
      <Input
        value={filterQuery}
        onChangeText={setFilterQuery}
        placeholder="Search cases..."
        style={styles.searchInput}
      />

      {/* Cases List */}
      <View style={styles.list}>
        {filteredCases.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>
              {cases.length === 0 ? 'No cases registered yet.' : 'No results match your search.'}
            </Text>
            {cases.length === 0 && user?.role === 'INVESTIGATION_OFFICER' && (
              <TouchableOpacity style={styles.emptyAction} onPress={() => setShowCreateModal(true)}>
                <Text style={styles.emptyActionText}>Register first case →</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredCases.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.caseCard}
              onPress={() => router.push(`/(web)/cases/${c.id}` as any)}
              activeOpacity={0.75}
            >
              {/* Status left strip */}
              <View style={[
                styles.caseStrip,
                c.status === 'FILED' ? styles.stripFiled :
                c.status === 'CHARGE_SHEET_PREPARED' ? styles.stripGold : styles.stripBlue
              ]} />
              <View style={styles.caseBody}>
                <View style={styles.caseTopRow}>
                  <View style={styles.caseNumAndDate}>
                    <Text style={styles.caseNum}>{c.caseNumber}</Text>
                    <Text style={styles.caseDate}>• {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
                  </View>
                  <View style={[
                    styles.statusPill,
                    c.status === 'FILED' ? styles.pillFiled :
                    c.status === 'CHARGE_SHEET_PREPARED' ? styles.pillGold : styles.pillBlue
                  ]}>
                    <Text style={styles.statusPillText}>{c.status.replace(/_/g, ' ')}</Text>
                  </View>
                </View>

                <Text style={styles.caseTitle} numberOfLines={1}>{c.title}</Text>

                {/* Content below title split into 2 lines */}
                <View style={styles.caseSubLines}>
                  <Text style={styles.caseSubLine}>{c.jurisdiction}</Text>
                  {c.policeStation ? <Text style={styles.caseSubLine}>{c.policeStation}</Text> : null}
                </View>

                <View style={styles.caseBadges}>
                  <View style={styles.badge}><Text style={styles.badgeText}>DOCS: {c.documentCount}</Text></View>
                  <View style={styles.badge}><Text style={styles.badgeText}>CHAIN: {c.custodyCount}</Text></View>
                </View>
              </View>
              <Text style={styles.caseArrow}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Create Case Modal */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>REGISTER CASE RECORD</Text>
              <TouchableOpacity onPress={() => { setShowCreateModal(false); resetForm(); }}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Mode Tabs */}
            <View style={styles.modeTabs}>
              <TouchableOpacity
                style={[styles.modeTab, createMode === 'upload' && styles.modeTabActive]}
                onPress={() => setCreateMode('upload')}
              >
                <Text style={[styles.modeTabText, createMode === 'upload' && styles.modeTabTextActive]}>
                  UPLOAD FIR / DOCUMENT
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeTab, createMode === 'manual' && styles.modeTabActive]}
                onPress={() => setCreateMode('manual')}
              >
                <Text style={[styles.modeTabText, createMode === 'manual' && styles.modeTabTextActive]}>
                  MANUAL ENTRY
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {errorMessage && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>⚠️ {errorMessage}</Text>
                </View>
              )}

              {createMode === 'upload' ? (
                /* Upload Mode */
                <View>
                  {/* File Drop Zone */}
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
                          <Text style={styles.fileSize}>{(uploadedFile.size / 1024).toFixed(1)} KB • SHA-256 will be computed & anchored</Text>
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
                        <Text style={styles.dropZoneTitle}>Select FIR, charge sheet, or evidence file</Text>
                        <Text style={styles.dropZoneHint}>Click to browse or upload • PDF, JPG, PNG, TXT</Text>
                        <View style={styles.browsePill}>
                          <Text style={styles.browsePillText}>BROWSE FILE</Text>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Hidden web file input fallback */}
                  {Platform.OS === 'web' && (
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.txt"
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                    />
                  )}

                  {uploadedFile && (
                    <Input
                      label="CASE TITLE"
                      value={uploadTitle}
                      onChangeText={setUploadTitle}
                      placeholder="e.g. State vs. Accused — Cyber Fraud Case"
                    />
                  )}

                  {!uploadedFile && (
                    <View style={styles.uploadNote}>
                      <Text style={styles.uploadNoteText}>
                        Uploading an official document auto-extracts metadata and anchors the evidence immutably in the blockchain ledger.
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                /* Manual Mode */
                <View>
                  <Input label="CASE NUMBER" value={caseNumber} onChangeText={setCaseNumber} monospace />
                  <Input label="TITLE" value={title} onChangeText={setTitle} placeholder="State vs. Accused (Incident Name)" />
                  <Input label="SYNOPSIS" value={description} onChangeText={setDescription} multiline numberOfLines={3} placeholder="Brief summary of allegations..." />
                  <View style={styles.twoCol}>
                    <View style={{ flex: 1 }}>
                      <Input label="JURISDICTION" value={jurisdiction} onChangeText={setJurisdiction} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input label="POLICE STATION" value={policeStation} onChangeText={setPoliceStation} />
                    </View>
                  </View>
                  <Input label="BNS SECTIONS (comma separated)" value={bnsSections} onChangeText={setBnsSections} placeholder="e.g. BNS 318, BNS 66" />
                  <Input label="INCIDENT LOCATION" value={incidentLocation} onChangeText={setIncidentLocation} />
                </View>
              )}

              <View style={styles.modalActions}>
                <Button title="CANCEL" onPress={() => { setShowCreateModal(false); resetForm(); }} variant="secondary" />
                <Button
                  title={createMutation.isPending ? 'REGISTERING & ANCHORING...' : 'REGISTER & INITIALIZE LEDGER →'}
                  onPress={handleCreateCase}
                  loading={createMutation.isPending}
                  variant="primary"
                  disabled={!canSubmit || createMutation.isPending}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 10,
  },
  title: {
    fontFamily: typography.fontSerif,
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  subtitle: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  searchInput: { marginBottom: 14 },
  list: { gap: 8 },

  // Case Card
  caseCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    alignItems: 'stretch',
  },
  caseStrip: { width: 4 },
  stripFiled: { backgroundColor: colors.verified },
  stripGold: { backgroundColor: colors.ledgerGold },
  stripBlue: { backgroundColor: colors.primary },
  caseBody: { flex: 1, padding: 12 },
  caseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  caseNum: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  caseNumAndDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  caseDate: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: colors.textMuted,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  pillFiled: { backgroundColor: colors.verifiedLight },
  pillGold: { backgroundColor: colors.ledgerGoldLight },
  pillBlue: { backgroundColor: colors.primaryLight },
  statusPillText: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  caseTitle: {
    fontFamily: typography.fontSans,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  caseSubLines: {
    marginBottom: 6,
    gap: 2,
  },
  caseSubLine: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  caseBadges: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  badgeText: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: colors.textSecondary,
  },
  caseArrow: {
    fontSize: 20,
    color: colors.textMuted,
    alignSelf: 'center',
    paddingHorizontal: 12,
  },

  // Empty State
  emptyWrap: { padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: {
    fontFamily: typography.fontSans,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  emptyAction: { marginTop: 12 },
  emptyActionText: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },

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
    maxWidth: 580,
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
    paddingHorizontal: 18,
    paddingVertical: 14,
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

  // Mode Tabs
  modeTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  modeTabActive: {
    borderBottomColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  modeTabText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  modeTabTextActive: {
    color: colors.primary,
  },
  modalBody: { padding: 18, paddingBottom: 10 },

  // Upload Zone
  dropZone: {
    borderWidth: 2,
    borderColor: colors.borderDark,
    borderStyle: 'dashed',
    borderRadius: 6,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: colors.surfaceMuted,
  },
  dropZoneUploaded: {
    borderColor: colors.verified,
    borderStyle: 'solid',
    backgroundColor: colors.verifiedLight,
    padding: 14,
    alignItems: 'flex-start',
  },
  dropZoneInner: { alignItems: 'center' },
  dropZoneTitle: {
    fontFamily: typography.fontSans,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  dropZoneHint: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  fileIcon: {
    fontSize: 11,
    fontFamily: typography.fontMono,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
  },
  fileName: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  fileSize: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  removeFileBtn: { padding: 4 },
  removeFileText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '700',
  },
  uploadNote: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
  },
  uploadNoteText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.primary,
    lineHeight: 16,
  },

  // Two Column
  twoCol: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },

  // Modal Actions
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
    paddingBottom: 6,
    flexWrap: 'wrap',
  },
  errorBanner: {
    backgroundColor: colors.alertLight || '#FDF2F2',
    borderColor: colors.alert || '#DC2626',
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    marginBottom: 14,
  },
  errorBannerText: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.alert || '#DC2626',
    fontWeight: '600',
  },
  browsePill: {
    marginTop: 10,
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
});
