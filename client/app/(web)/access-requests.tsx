import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, typography, Panel, Button, Input, StatusTag, LoadingScreen } from '@pramaan/ui';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

export default function AccessRequestsScreen() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [caseId, setCaseId] = useState('');
  const [reason, setReason] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['access-requests'],
    queryFn: () => api.getAccessRequests(),
  });

  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['cases-for-access'],
    queryFn: () => api.getCases(),
  });

  const createMutation = useMutation({
    mutationFn: () => api.createAccessRequest(caseId, reason, 24),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
      setShowModal(false);
      setReason('');
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      api.reviewAccessRequest(id, approved),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['access-requests'] }),
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (requestsLoading || casesLoading) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <LoadingScreen
          message="Loading Access Clearance Requests..."
          subMessage="Fetching inter-cadre case authorization credentials"
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>ACCESS CLEARANCE</Text>
          <Text style={styles.subtitle}>{requests.length} request{requests.length !== 1 ? 's' : ''}</Text>
        </View>
        <Button
          title="+ REQUEST ACCESS"
          onPress={() => { if (cases[0]) setCaseId(cases[0].id); setShowModal(true); }}
          variant="primary"
          size="sm"
        />
      </View>

      <Panel title="REQUESTS">
        {requests.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No access requests found.</Text>
          </View>
        ) : requests.map((r) => {
          const isExpanded = expandedIds.has(r.id);
          const statusVariant = r.status === 'APPROVED' ? 'verified' : r.status === 'REJECTED' ? 'alert' : 'warning';
          const isSelf = (r as any).isSelf ?? (r.requesterId === user?.id || (user?.name && r.requesterName === user.name));
          const canReview = (r as any).canReview !== undefined
            ? (r as any).canReview
            : (!isSelf && (user?.role === 'JUDGE' || user?.role === 'PROSECUTOR'));

          return (
            <TouchableOpacity
              key={r.id}
              style={[styles.reqCard, r.status === 'PENDING' && styles.reqCardPending]}
              onPress={() => toggleExpand(r.id)}
              activeOpacity={0.8}
            >
              <View style={styles.reqHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reqCaseNum}>{r.caseNumber}</Text>
                  <Text style={styles.reqCaseTitle} numberOfLines={1}>{r.caseTitle}</Text>
                </View>
                <StatusTag label={r.status} variant={statusVariant} size="sm" />
                <Text style={styles.expandChevron}>{isExpanded ? '∧' : '∨'}</Text>
              </View>

              <Text style={styles.reqMeta} numberOfLines={isExpanded ? undefined : 1}>
                {r.requesterName} • {new Date(r.createdAt).toLocaleDateString('en-IN')}
              </Text>

              {isExpanded && (
                <View style={styles.reqExpanded}>
                  <Text style={styles.reqReasonLabel}>JUSTIFICATION</Text>
                  <Text style={styles.reqReason}>"{r.reason}"</Text>
                  {r.expiresAt && (
                    <Text style={styles.reqExpiry}>
                      Active until: {new Date(r.expiresAt).toLocaleString('en-IN')}
                    </Text>
                  )}

                  {r.status === 'PENDING' && (
                    canReview ? (
                      <View style={styles.reviewActions}>
                        <Button
                          title="APPROVE"
                          onPress={() => reviewMutation.mutate({ id: r.id, approved: true })}
                          size="sm"
                          variant="verified"
                          loading={reviewMutation.isPending}
                        />
                        <Button
                          title="REJECT"
                          onPress={() => reviewMutation.mutate({ id: r.id, approved: false })}
                          variant="danger"
                          size="sm"
                          loading={reviewMutation.isPending}
                        />
                      </View>
                    ) : isSelf ? (
                      <View style={styles.selfNoticeBox}>
                        <Text style={styles.selfNoticeText}>
                          ⏳ AWAITING SUPERVISORY / JUDICIAL REVIEW
                        </Text>
                        <Text style={styles.selfNoticeSub}>
                          Statutory separation of duties: Requesting officers cannot self-approve access requests.
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.pendingNoticeBox}>
                        <Text style={styles.pendingNoticeText}>
                          ⏳ PENDING REVIEW BY ASSIGNED OFFICER / MAGISTRATE
                        </Text>
                      </View>
                    )
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </Panel>

      {/* New Request Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>REQUEST CASE ACCESS</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.fieldLabel}>SELECT CASE</Text>
              <ScrollView style={styles.casePickerBox} nestedScrollEnabled>
                {cases.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setCaseId(c.id)}
                    style={[styles.caseOption, caseId === c.id && styles.caseOptionActive]}
                  >
                    <Text style={[styles.caseOptNum, caseId === c.id && styles.caseOptNumActive]}>
                      {c.caseNumber}
                    </Text>
                    <Text style={styles.caseOptTitle} numberOfLines={1}>{c.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Input
                label="JUSTIFICATION"
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
                placeholder="State your reason for access..."
              />

              <View style={styles.modalActions}>
                <Button title="CANCEL" onPress={() => setShowModal(false)} variant="secondary" />
                <Button
                  title={createMutation.isPending ? 'SUBMITTING...' : 'SUBMIT REQUEST →'}
                  onPress={() => createMutation.mutate()}
                  loading={createMutation.isPending}
                  variant="primary"
                  disabled={!caseId || !reason}
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

  emptyWrap: { padding: 32, alignItems: 'center' },
  emptyIcon: { fontSize: 28, marginBottom: 8 },
  emptyText: { fontFamily: typography.fontSans, fontSize: 12, color: colors.textMuted },

  reqCard: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
  },
  reqCardPending: { borderLeftWidth: 4, borderLeftColor: colors.ledgerGold },
  reqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  reqCaseNum: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  reqCaseTitle: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  expandChevron: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '700',
    marginLeft: 4,
  },
  reqMeta: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: colors.textMuted,
  },
  reqExpanded: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  reqReasonLabel: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: 3,
    letterSpacing: 0.4,
  },
  reqReason: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textPrimary,
    fontStyle: 'italic',
    marginBottom: 6,
    lineHeight: 17,
  },
  reqExpiry: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.verifiedDark,
    fontWeight: '700',
    marginBottom: 8,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  selfNoticeBox: {
    backgroundColor: colors.surfaceSelected || '#F0F4F8',
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 2,
    padding: 8,
    marginTop: 6,
    gap: 2,
  },
  selfNoticeText: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  selfNoticeSub: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: colors.textMuted,
  },
  pendingNoticeBox: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    padding: 8,
    marginTop: 6,
  },
  pendingNoticeText: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
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
    maxWidth: 520,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 6,
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
  modalBody: { padding: 16 },
  fieldLabel: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  casePickerBox: {
    maxHeight: 140,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 4,
    marginBottom: 12,
  },
  caseOption: { padding: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  caseOptionActive: { backgroundColor: colors.primaryLight },
  caseOptNum: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  caseOptNumActive: { color: colors.primary },
  caseOptTitle: { fontFamily: typography.fontSans, fontSize: 11, color: colors.textMuted },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
});
