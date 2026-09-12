import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors, typography, Panel, Button, Input, StatusTag, RegisterRow, HashDisplay } from '@pramaan/ui';
import { api } from '../../services/api';

export default function SearchScreen() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('repeated incidents near Pondy Bazaar');
  const [activeQuery, setActiveQuery] = useState('repeated incidents near Pondy Bazaar');

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', activeQuery],
    queryFn: () => api.search(activeQuery),
    enabled: !!activeQuery,
  });

  const handleSearch = () => {
    setActiveQuery(searchTerm);
  };

  const sampleQueries = [
    'repeated incidents near Pondy Bazaar',
    'cyber stalking transcripts',
    'BNS 64 forensic report',
    'Usman Road junction',
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>INTELLIGENCE SEARCH & OCR DISCOVERY</Text>
        <Text style={styles.subtitle}>
          Full-text OCR indexing, statutory section matching, and cross-case pattern synthesis
        </Text>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Input
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search metadata, extracted OCR text, suspects, locations, statutory sections..."
          style={styles.searchInput}
        />
        <Button
          title={isLoading ? 'SEARCHING...' : 'SEARCH REPOSITORY →'}
          onPress={handleSearch}
          loading={isLoading}
          variant="primary"
          style={styles.searchBtn}
        />
      </View>

      {/* Query Presets */}
      <View style={styles.presetRow}>
        <Text style={styles.presetLabel}>TRY QUERY PRESETS:</Text>
        {sampleQueries.map((q) => (
          <TouchableOpacity
            key={q}
            onPress={() => {
              setSearchTerm(q);
              setActiveQuery(q);
            }}
            style={styles.presetPill}
          >
            <Text style={styles.presetText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* AI Synthesis Summary Card */}
      {searchResults?.aiSummary && (
        <Panel
          title="AI-ASSISTED INVESTIGATIVE ADVISORY DIGEST"
          subtitle="Synthesized metadata correlation across case registries and OCR text"
          variant="ledger"
        >
          <View style={styles.aiBox}>
            <Text style={styles.aiText}>{searchResults.aiSummary}</Text>
            <Text style={styles.aiDisclaimer}>{searchResults.aiNotice}</Text>
          </View>
        </Panel>
      )}

      {/* Matching Cases */}
      <Panel
        title={`MATCHING CASE RECORDS (${searchResults?.matchingCases?.length || 0})`}
        subtitle="Cases matching search keywords or geographical metadata"
      >
        {searchResults?.matchingCases?.map((c: any) => (
          <RegisterRow
            key={c.id}
            id={c.id}
            primaryCode={c.caseNumber}
            title={c.title}
            subtitle={`Location: ${c.incidentLocation} • Jurisdiction: ${c.jurisdiction}`}
            statusLabel={c.status.replace(/_/g, ' ')}
            statusVariant="info"
            metadataItems={[
              { label: 'EXHIBITS', value: String(c.documentCount) },
              { label: 'SECTIONS', value: c.bnsSections?.join(', ') || 'BNS' },
            ]}
            onPress={() => router.push(`/(web)/cases/${c.id}` as any)}
          />
        ))}
        {(!searchResults?.matchingCases || searchResults.matchingCases.length === 0) && (
          <Text style={styles.emptyText}>No case records directly matching query.</Text>
        )}
      </Panel>

      {/* Matching Evidence Documents */}
      <Panel
        title={`MATCHING OCR EVIDENCE EXHIBITS (${searchResults?.matchingDocuments?.length || 0})`}
        subtitle="Documents containing matching keywords within extracted OCR full text"
      >
        {searchResults?.matchingDocuments?.map((doc: any) => (
          <View key={doc.id} style={styles.docResultCard}>
            <View style={styles.docResultHeader}>
              <Text style={styles.docResultType}>{doc.documentType.replace(/_/g, ' ')}</Text>
              <Text style={styles.docResultCase}>CASE: {doc.caseNumber}</Text>
            </View>
            <Text style={styles.docResultTitle}>{doc.title}</Text>
            <HashDisplay hash={doc.sha256Hash} label="ANCHORED SHA-256" truncate />
            <Button
              title="VERIFY INTEGRITY"
              onPress={() => router.push(`/(web)/documents/${doc.id}/verify` as any)}
              variant="verified"
              size="sm"
              style={{ alignSelf: 'flex-start', marginTop: 8 }}
            />
          </View>
        ))}
      </Panel>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  header: {
    marginBottom: 16,
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
  searchBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  searchBtn: {
    height: 38,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 20,
  },
  presetLabel: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    marginRight: 4,
  },
  presetPill: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
  },
  presetText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  aiBox: {
    backgroundColor: colors.ledgerGoldLight,
    borderWidth: 1,
    borderColor: colors.ledgerGoldBorder,
    padding: 14,
    borderRadius: 2,
  },
  aiText: {
    fontFamily: typography.fontSans,
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 20,
    ...({ whiteSpace: 'pre-line' } as any),
  },
  aiDisclaimer: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: colors.alert,
    fontWeight: '700',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.ledgerGoldBorder,
    paddingTop: 6,
  },
  emptyText: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  docResultCard: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    borderRadius: 2,
    marginBottom: 10,
  },
  docResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  docResultType: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 2,
  },
  docResultCase: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  docResultTitle: {
    fontFamily: typography.fontSerif,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginVertical: 4,
  },
});
