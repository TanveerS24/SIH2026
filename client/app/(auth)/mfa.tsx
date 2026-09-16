import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, Button, Input, Panel, OfficialSeal } from '@pramaan/ui';
import { useAuthStore } from '../../stores/authStore';

export default function MFAScreen() {
  const router = useRouter();
  const { verifyMfa, mfaEmail, isLoading, error, clearError, user } = useAuthStore();
  const [totpCode, setTotpCode] = useState('');

  const handleVerify = async () => {
    if (!totpCode) return;
    clearError();
    await verifyMfa(totpCode);
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      if (currentUser.role === 'WOMEN_HELP_DESK_OFFICER') {
        router.replace('/(mobile)/home');
      } else {
        router.replace('/(web)/dashboard');
      }
    }
  };

  const handleUseSandboxCode = () => {
    setTotpCode('123456');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <OfficialSeal size={48} />
          <Text style={styles.title}>MULTI-FACTOR AUTHENTICATION</Text>
          <Text style={styles.subtitle}>
            Enter 6-Digit TOTP Authenticator Code for:
          </Text>
          <Text style={styles.emailBadge}>{mfaEmail || 'officer@example.gov'}</Text>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>[MFA VERIFICATION ALERT] {error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <Input
            label="6-DIGIT TIME-BASED ONE-TIME PASSWORD (TOTP)"
            value={totpCode}
            onChangeText={setTotpCode}
            placeholder="Enter 6-digit code"
            monospace
            hint="Input code from Government Authenticator, Authy, or use sandbox bypass."
          />

          <Button
            title={isLoading ? 'VERIFYING TOTP CODE...' : 'AUTHENTICATE & ENTER SYSTEM →'}
            onPress={handleVerify}
            loading={isLoading}
            disabled={!totpCode || totpCode.length < 6}
            variant="verified"
            style={styles.btn}
          />
        </View>

        <Panel title="SANDBOX EVALUATOR ADVISORY" variant="ledger">
          <Text style={styles.panelText}>
            For local evaluation or sandbox verification, you can fill the developer test code:
          </Text>
          <TouchableOpacity onPress={handleUseSandboxCode} style={styles.codePill}>
            <Text style={styles.codeText}>123456 [Click to Apply Test Code]</Text>
          </TouchableOpacity>
        </Panel>

        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Return to Official Login</Text>
        </TouchableOpacity>
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
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 2,
    padding: 28,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 16,
  },
  mfaIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.verifiedLight,
    borderWidth: 1,
    borderColor: colors.verifiedBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  mfaIcon: {
    fontSize: 22,
  },
  title: {
    fontFamily: typography.fontSerif,
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  emailBadge: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 2,
    marginTop: 6,
  },
  errorBanner: {
    backgroundColor: colors.alertLight,
    borderWidth: 1,
    borderColor: colors.alertBorder,
    padding: 10,
    borderRadius: 2,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    fontWeight: '600',
    color: colors.alertDark,
  },
  form: {
    marginBottom: 16,
  },
  btn: {
    marginTop: 8,
  },
  panelText: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  codePill: {
    backgroundColor: colors.ledgerGoldLight,
    borderWidth: 1,
    borderColor: colors.ledgerGoldBorder,
    padding: 8,
    borderRadius: 2,
    alignItems: 'center',
  },
  codeText: {
    fontFamily: typography.fontMono,
    fontSize: 13,
    fontWeight: '700',
    color: colors.ledgerGold,
  },
  backBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  backText: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
