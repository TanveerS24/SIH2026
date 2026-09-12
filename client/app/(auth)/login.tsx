import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, Button, Input, Panel } from '@pramaan/ui';
import { useAuthStore, DEMO_ACCOUNTS } from '../../stores/authStore';
import { Role } from '@pramaan/shared-types';

export default function LoginScreen() {
  const router = useRouter();
  const { login, mfaPending, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('io@example.gov');
  const [password, setPassword] = useState('DemoPass123!');

  const handleLogin = async () => {
    clearError();
    await login(email, password);
    if (useAuthStore.getState().mfaPending) {
      router.push('/(auth)/mfa');
    }
  };

  const handleSelectDemo = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('DemoPass123!');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.sealCircle}>
            <Text style={styles.sealEmblem}>⚖</Text>
          </View>
          <Text style={styles.appName}>PRAMAAN</Text>
          <Text style={styles.appSub}>
            Digital Evidence & Tamper-Evident Chain-of-Custody Ledger
          </Text>
          <Text style={styles.department}>
            Women Safety Division • National Crime Records Body
          </Text>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        )}

        {/* Credentials Form */}
        <View style={styles.form}>
          <Input
            label="OFFICIAL GOVERNMENT EMAIL"
            value={email}
            onChangeText={setEmail}
            placeholder="officer@example.gov"
          />
          <Input
            label="SECURITY CREDENTIAL / PASSWORD"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••••••"
          />

          <Button
            title={isLoading ? 'VERIFYING CREDENTIALS...' : 'PROCEED TO MFA VERIFICATION →'}
            onPress={handleLogin}
            loading={isLoading}
            style={styles.loginBtn}
          />
        </View>

        {/* Demo Roles Preset Switcher */}
        <Panel
          title="DEMO ROLE PRESETS (ONE-CLICK LOGIN)"
          subtitle="Select an official profile to preview role-based access control"
          variant="ledger"
          style={styles.demoPanel}
        >
          <View style={styles.demoGrid}>
            {DEMO_ACCOUNTS.map((acc) => (
              <TouchableOpacity
                key={acc.email}
                onPress={() => handleSelectDemo(acc.email)}
                style={[
                  styles.demoItem,
                  email === acc.email && styles.demoItemSelected,
                ]}
              >
                <View style={styles.demoItemHeader}>
                  <Text style={styles.demoRoleTitle}>{acc.label}</Text>
                  <Text style={styles.demoBadge}>ID: {acc.badge}</Text>
                </View>
                <Text style={styles.demoEmail}>{acc.email}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Panel>

        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            PROTOTYPE NOTICE: System enforces server-side cryptographic document integrity (SHA-256) and simulated permissioned ledger anchoring. Real government integrations (CCTNS/e-Courts/ICJS) are cleanly abstracted.
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
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 580,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 2,
    padding: 28,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 20,
  },
  sealCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  sealEmblem: {
    fontSize: 26,
    color: colors.primary,
  },
  appName: {
    fontFamily: typography.fontSerif,
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.5,
  },
  appSub: {
    fontFamily: typography.fontSans,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 4,
    textAlign: 'center',
  },
  department: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    marginBottom: 20,
  },
  loginBtn: {
    marginTop: 8,
  },
  demoPanel: {
    marginTop: 10,
  },
  demoGrid: {
    gap: 8,
  },
  demoItem: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    padding: 10,
  },
  demoItemSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  demoItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  demoRoleTitle: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  demoBadge: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.primary,
  },
  demoEmail: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textMuted,
  },
  footerNote: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 14,
    textAlign: 'center',
  },
});
