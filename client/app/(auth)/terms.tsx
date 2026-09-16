import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, Button, OfficialSeal } from '@pramaan/ui';

export default function AuthTermsScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <OfficialSeal size={48} />
          <Text style={styles.title}>STATUTORY TERMS OF SERVICE & DIGITAL EVIDENCE GOVERNANCE</Text>
          <Text style={styles.subtitle}>
            Bharatiya Sakshya Adhiniyam (BSA), 2023 & Information Technology Act Compliance
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
            Access to sensitive case records, victim identities, and protected forensic transcripts is strictly segmented by statutory cadre. Attempting to bypass role-based access restrictions or export victim PII constitutes an offense under the Official Secrets Act, 1923 and relevant sections of the Bharatiya Nyaya Sanhita, 2023.
          </Text>
        </View>

        <View style={styles.clause}>
          <Text style={styles.clauseTitle}>4. IMMUTABLE AUDIT TRAIL LOGGING</Text>
          <Text style={styles.clauseBody}>
            All platform interactions—including authentication events, document views, hash verifications, redacting operations, and file transfers—are automatically and indelibly logged with actor badge IDs, IP addresses, and UTC timestamps. Audit logs cannot be modified, suppressed, or deleted by any administrative role.
          </Text>
        </View>

        <View style={styles.backBtnWrap}>
          <Button
            title="← RETURN TO OFFICIAL SIGN IN"
            onPress={() => router.push('/(auth)/login')}
            variant="primary"
          />
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
    maxWidth: 780,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 2,
    padding: 28,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: typography.fontSerif,
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
    marginTop: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 4,
    textAlign: 'center',
  },
  department: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  clause: {
    marginBottom: 16,
  },
  clauseTitle: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  clauseBody: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 18,
    textAlign: 'justify',
  },
  backBtnWrap: {
    marginTop: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  footerNote: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
});
