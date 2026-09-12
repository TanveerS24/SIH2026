import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, typography, Panel, Button, Input, StatusTag } from '@pramaan/ui';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

export default function AccessRequestsScreen() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [caseId, setCaseId] = useState('');
  const [reason, setReason] = useState('Official statistical cross-validation and forensic corroboration under NCRB Research Directive 2026/88.');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['access-requests'],
    queryFn: () => api.getAccessRequests(),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases-for-access'],
    queryFn: () => api.getCases(),
  });

  const createMutation = useMutation({
    mutationFn: () => api.createAccessRequest(caseId, reason, 24),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
      setShowModal(false);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      api.reviewAccessRequest(id, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
    },
  });

  const isSupervisor = user?.role === 'INVESTIGATION_OFFICER' || user?.role === 'JUDGE' || user?.role === 'PROSECUTOR';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>ELEVATED CASE ACCESS CLEARANCE REGISTRY</Text>
          <Text style={styles.subtitle}>
            Statutory privacy gateway for analysts & non-assigned officers seeking individual case inspection
          </Text>
        </View>

        <Button
          title="+ REQUEST ELEVATED CASE CLEARANCE"
          onPress={() => {
            if (cases.length > 0 && cases[0]) setCaseId(cases[0].id);
            setShowModal(true);
          }}
          variant="primary"
        />
      </View>

      <Panel
        title={`SUBMITTED CLEARANCE REQUESTS (${requests.length})`}
        subtitle="Immutable clearance requests with time-bounded expiration and supervisory approval"
      >
        {requests.map((r) => (
          <View key={r.id} style={styles.reqCard}>
            <View style={styles.reqCardHeader}>
              <View>
                <Text style={styles.reqCaseNumber}>{r.caseNumber}</Text>
                <Text style={styles.reqCaseTitle}>{r.caseTitle}</Text>
              </View>
              <StatusTag
                label={r.status}
                variant={r.status === 'APPROVED' ? 'verified' : r.status === 'REJECTED' ? 'alert' : 'warning'}
              />
            </View>

            <View style={styles.reqDetails}>
              <Text style={styles.reqMeta}>
                REQUESTER: {r.requesterName} ({r.requesterRole.replace(/_/g, ' ')}) • REQUESTED ON: {new Date(r.createdAt).toLocaleString()}
              </Text>
              <Text style={styles.reqReason}>JUSTIFICATION: "{r.reason}"</Text>
              {r.expiresAt && (
                <Text style={styles.reqExpiry}>
                  CLEARANCE ACTIVE UNTIL: {new Date(r.expiresAt).toLocaleString()}
                </Text>
              )}
            </View>

            {isSupervisor && r.status === 'PENDING' && (
              <View style={styles.reviewActions}>
                <Button
                  title="✓ APPROVE ELEVATED ACCESS"
                  onPress={() => reviewMutation.mutate({ id: r.id, approved: true })}
                  variant="verified"
                  size="sm"
                />
                <Button
                  title="✗ REJECT CLEARANCE"
                  onPress={() => reviewMutation.mutate({ id: r.id, approved: false })}
                  variant="danger"
                  size="sm"
                />
              </View>
            )}
          </View>
        ))}

        {requests.length === 0 && (
          <Text style={styles.emptyText}>No elevated access requests found.</Text>
        )}
      </Panel>

      {/* New Request Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>REQUEST ELEVATED CASE CLEARANCE</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.fieldLabel}>SELECT CASE RECORD TO INSPECT:</Text>
              <View style={styles.casePickerBox}>
                {cases.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setCaseId(c.id)}
                    style={[styles.caseOption, caseId === c.id && styles.caseOptionActive]}
                  >
                    <Text style={[styles.caseOptNum, caseId === c.id && styles.caseOptNumActive]}>
                      {c.caseNumber}
                    </Text>
                    <Text style={styles.caseOptTitle}>{c.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label="WRITTEN STATUTORY JUSTIFICATION (MIN 20 CHARACTERS)"
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
                hint="Document justification will be permanently audited."
              />

              <View style={styles.modalActions}>
                <Button title="CANCEL" onPress={() => setShowModal(false)} variant="secondary" />
                <Button
                  title={createMutation.isPending ? 'SUBMITTING...' : 'SUBMIT CLEARANCE REQUEST →'}
                  onPress={() => createMutation.mutate()}
                  loading={createMutation.isPending}
                  variant="primary"
                />
              </View>
            </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  title: {
    fontFamily: typography.fontSerif,
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  subtitle: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  reqCard: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    padding: 14,
    marginBottom: 12,
  },
  reqCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reqCaseNumber: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  reqCaseTitle: {
    fontFamily: typography.fontSerif,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  reqDetails: {
    marginVertical: 4,
  },
  reqMeta: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textMuted,
  },
  reqReason: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textPrimary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  reqExpiry: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.verifiedDark,
    marginTop: 4,
    fontWeight: '700',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
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
    maxWidth: 580,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 2,
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
  fieldLabel: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  casePickerBox: {
    maxHeight: 160,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 2,
    marginBottom: 14,
  },
  caseOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  caseOptionActive: {
    backgroundColor: colors.primaryLight,
  },
  caseOptNum: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  caseOptNumActive: {
    color: colors.primary,
  },
  caseOptTitle: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textSecondary,
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
