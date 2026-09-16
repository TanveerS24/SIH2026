import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, Panel, OfficialSeal } from '@pramaan/ui';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <OfficialSeal size={48} />
          <Text style={styles.title}>STATUTORY TERMS OF SERVICE & DIGITAL EVIDENCE GOVERNANCE</Text>
          <Text style={styles.subtitle}>
            Enacted under the Bharatiya Sakshya Adhiniyam (BSA), 2023 & Information Technology Act
          </Text>
          <Text style={styles.department}>
            National Crime Records Directorate • Ministry of Home Affairs • Government of India
          </Text>
        </View>

        <View style={styles.clause}>
          <Text style={styles.clauseTitle}>1. STATUTORY AUTHORITY & LEGAL APPLICABILITY</Text>
          <Text style={styles.clauseBody}>
            The Pramaan Digital Evidence & Tamper-Evident Chain-of-Custody Ledger operates pursuant to the provisions of the Bharatiya Sakshya Adhiniyam, 2023 (BSA), specifically Section 63 (Admissibility of electronic records) and Section 65B of the Indian Evidence framework. All electronic records, First Information Reports (FIR), forensic extracts, and sworn statements anchored within this ledger are legally presumed authentic upon cryptographic verification.
          </Text>
        </View>

        <View style={styles.clause}>
          <Text style={styles.clauseTitle}>2. CRYPTOGRAPHIC IMMUTABILITY & NON-REPUDIATION</Text>
          <Text style={styles.clauseBody}>
            Every evidentiary artifact ingested into the platform generates a unique SHA-256 cryptographic digest that is anchored to a permissioned blockchain ledger block. Any modification, alteration, or bitwise tampering of an exhibit produces an immediate mismatch alert during judicial scrutiny. Users acknowledge that digital signatures executed using official credentials carry legal non-repudiation.
          </Text>
        </View>

        <View style={styles.clause}>
          <Text style={styles.clauseTitle}>3. ROLE-BASED ACCESS CONTROL (RBAC) & OFFICIAL SECRECY</Text>
          <Text style={styles.clauseBody}>
            Access to sensitive case records, victim identities, and protected forensic transcripts is strictly segmented by statutory cadre: Investigation Officers, Women Help Desk Personnel, Public Prosecutors, Judicial Magistrates, and NCRB Statistical Analysts. Attempting to bypass role-based access restrictions or export victim PII constitutes an offense under the Official Secrets Act, 1923 and relevant sections of the Bharatiya Nyaya Sanhita, 2023.
          </Text>
        </View>

        <View style={styles.clause}>
          <Text style={styles.clauseTitle}>4. IMMUTABLE AUDIT TRAIL LOGGING</Text>
          <Text style={styles.clauseBody}>
            All platform interactions—including authentication events, document views, hash verifications, redacting operations, and file transfers—are automatically and indelibly logged with actor badge IDs, IP addresses, and UTC timestamps. Audit logs cannot be modified, suppressed, or deleted by any administrative role.
          </Text>
        </View>

        <View style={styles.clause}>
          <Text style={styles.clauseTitle}>5. VICTIM IDENTITY PROTECTION & REDACTION</Text>
          <Text style={styles.clauseBody}>
            In compliance with statutory protections for victims of sexual offenses and domestic violence under BNS 72, all victim identities, phone numbers, and residential coordinates must be processed through the certified redaction pipeline prior to public disclosure or non-privileged judicial viewing.
          </Text>
        </View>

        <View style={styles.clause}>
          <Text style={styles.clauseTitle}>6. JURISDICTION & DISPUTE RESOLUTION</Text>
          <Text style={styles.clauseBody}>
            All operational procedures, evidentiary custody validations, and disputes arising from the use of the Pramaan ledger are subject to the exclusive jurisdiction of the competent High Courts and the Supreme Court of India.
          </Text>
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            LAST UPDATED: SEPTEMBER 2026 • REVISION 3.2-PROD • NATIONAL POLICE INFORMATICS BOARD
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 820,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 2,
    padding: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: typography.fontSerif,
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 4,
    textAlign: 'center',
  },
  department: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  clause: {
    marginBottom: 20,
  },
  clauseTitle: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  clauseBody: {
    fontFamily: typography.fontSans,
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 20,
    textAlign: 'justify',
  },
  footerNote: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
});
