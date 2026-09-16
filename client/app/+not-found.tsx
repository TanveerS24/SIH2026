import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, Button, OfficialSeal, Panel } from '@pramaan/ui';
import { useAuthStore } from '../stores/authStore';

export default function NotFoundScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const handleReturnHome = () => {
    if (isAuthenticated) {
      if (user?.role === 'WOMEN_HELP_DESK_OFFICER') {
        router.replace('/(mobile)/home');
      } else {
        router.replace('/(web)/dashboard');
      }
    } else {
      router.replace('/(auth)/login');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <OfficialSeal size={56} />
          <Text style={styles.codeText}>404</Text>
          <Text style={styles.title}>RECORD OR DIRECTORY NOT FOUND</Text>
          <Text style={styles.subtitle}>
            National Digital Evidence & Chain-of-Custody Repository
          </Text>
        </View>

        <View style={styles.alertBox}>
          <Text style={styles.alertTitle}>[SYSTEM STATUS ADVISORY]</Text>
          <Text style={styles.alertBody}>
            The requested evidence exhibit, ledger transaction block, or system route does not exist in the active register, or access has been restricted under jurisdictional confidentiality rules.
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaKey}>DIAGNOSTIC CODE:</Text>
            <Text style={styles.metaVal}>ERR_404_RECORD_UNAVAILABLE</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaKey}>TIMESTAMP:</Text>
            <Text style={styles.metaVal}>{new Date().toISOString()}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Button
            title={isAuthenticated ? '← RETURN TO OFFICIAL DASHBOARD' : '← RETURN TO OFFICIAL LOGIN'}
            onPress={handleReturnHome}
            variant="primary"
            style={styles.actionBtn}
          />

          {isAuthenticated && (
            <Button
              title="SEARCH CASE REGISTER"
              onPress={() => router.push('/(web)/cases')}
              variant="outline"
              style={styles.actionBtn}
            />
          )}
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            Bharatiya Sakshya Adhiniyam, 2023 • All routing anomalies recorded in security audit trail.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 2,
    padding: 32,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 16,
  },
  codeText: {
    fontFamily: typography.fontMono,
    fontSize: 32,
    fontWeight: '800',
    color: colors.alertDark,
    letterSpacing: 2,
    marginTop: 12,
  },
  title: {
    fontFamily: typography.fontSerif,
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
    marginTop: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  alertBox: {
    width: '100%',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    padding: 14,
    marginBottom: 20,
  },
  alertTitle: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '800',
    color: colors.alertDark,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  alertBody: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 18,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaKey: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  metaVal: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textPrimary,
  },
  actionRow: {
    width: '100%',
    gap: 10,
    marginBottom: 16,
  },
  actionBtn: {
    width: '100%',
  },
  footerNote: {
    width: '100%',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
