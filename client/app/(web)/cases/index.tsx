import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, typography, Panel, Button, Input, RegisterRow, StatusTag } from '@pramaan/ui';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../stores/authStore';

export default function CasesRegisterScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [filterQuery, setFilterQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Case Form State
  const [caseNumber, setCaseNumber] = useState(`TN-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [jurisdiction, setJurisdiction] = useState(user?.jurisdiction || 'Chennai South');
  const [policeStation, setPoliceStation] = useState(user?.department || 'T. Nagar AWPS');
  const [bnsSections, setBnsSections] = useState('BNS 64, BNS 70, BNS 351');
  const [incidentLocation, setIncidentLocation] = useState('T. Nagar Commercial Hub, Chennai');

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => api.getCases(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.createCase(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
    },
  });

  const handleCreateCase = () => {
    if (!title || !description) return;
    createMutation.mutate({
      caseNumber,
      title,
      description,
      jurisdiction,
      policeStation,
      bnsSections: bnsSections.split(',').map((s) => s.trim()),
      incidentLocation,
      priority: 'HIGH',
      sensitivity: 'HIGHLY_SENSITIVE',
    });
  };

  const filteredCases = cases.filter((c) =>
    c.caseNumber.toLowerCase().includes(filterQuery.toLowerCase()) ||
    c.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
    c.jurisdiction.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>OFFICIAL DIGITAL CASE REGISTER</Text>
          <Text style={styles.subtitle}>
            National Crime Records Body • Tamper-Evident Evidence Registry
          </Text>
        </View>

        {user?.role === 'INVESTIGATION_OFFICER' && (
          <Button
            title="+ REGISTER NEW CASE RECORD"
            onPress={() => setShowCreateModal(true)}
            variant="primary"
          />
        )}
      </View>

      {/* Filter Bar */}
      <View style={styles.filterRow}>
        <Input
          value={filterQuery}
          onChangeText={setFilterQuery}
          placeholder="Filter by Case Number, Title, Jurisdiction..."
          style={styles.searchInput}
        />
      </View>

      {/* Cases List */}
      <Panel
        title={`RECORDED CASES (${filteredCases.length})`}
        subtitle="Cryptographically tracked cases with chain-of-custody verification"
      >
        {filteredCases.map((c) => (
          <RegisterRow
            key={c.id}
            id={c.id}
            primaryCode={c.caseNumber}
            title={c.title}
            subtitle={`Jurisdiction: ${c.jurisdiction} • ${c.policeStation}`}
            statusLabel={c.status.replace(/_/g, ' ')}
            statusVariant={
              c.status === 'FILED'
                ? 'filed'
                : c.status === 'CHARGE_SHEET_PREPARED'
                ? 'gold'
                : 'info'
            }
            metadataItems={[
              { label: 'EXHIBITS', value: String(c.documentCount) },
              { label: 'CUSTODY TRANSACTIONS', value: String(c.custodyCount) },
              { label: 'OFFICER', value: c.assignedOfficerName || 'General Registry' },
            ]}
            date={new Date(c.createdAt).toLocaleDateString()}
            onPress={() => router.push(`/(web)/cases/${c.id}` as any)}
          />
        ))}

        {filteredCases.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No registered case records match query criteria.</Text>
          </View>
        )}
      </Panel>

      {/* Create Case Modal */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>REGISTER STATUTORY CASE RECORD</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Input label="OFFICIAL CASE NUMBER" value={caseNumber} onChangeText={setCaseNumber} monospace />
              <Input label="CASE TITLE" value={title} onChangeText={setTitle} placeholder="e.g. State vs. Accused (T. Nagar Incident)" />
              <Input label="CASE SYNOPSIS / DETAILS" value={description} onChangeText={setDescription} multiline numberOfLines={3} placeholder="Provide statutory summary..." />
              <Input label="JURISDICTION" value={jurisdiction} onChangeText={setJurisdiction} />
              <Input label="POLICE STATION" value={policeStation} onChangeText={setPoliceStation} />
              <Input label="STATUTORY BNS / IT ACT SECTIONS (COMMA SEPARATED)" value={bnsSections} onChangeText={setBnsSections} />
              <Input label="INCIDENT LOCATION" value={incidentLocation} onChangeText={setIncidentLocation} />

              <View style={styles.modalActions}>
                <Button title="CANCEL" onPress={() => setShowCreateModal(false)} variant="secondary" />
                <Button
                  title={createMutation.isPending ? 'REGISTERING...' : 'REGISTER CASE & INITIALIZE LEDGER →'}
                  onPress={handleCreateCase}
                  loading={createMutation.isPending}
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
  filterRow: {
    marginBottom: 16,
  },
  searchInput: {
    marginBottom: 0,
  },
  emptyWrap: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: typography.fontSans,
    fontSize: 13,
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
    fontSize: 16,
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
