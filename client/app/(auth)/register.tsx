import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, Button, Input, Panel, OfficialSeal } from '@pramaan/ui';
import { useAuthStore, DEMO_ACCOUNTS } from '../../stores/authStore';
import { Role } from '@pramaan/shared-types';

const ROLES_LIST: { role: Role; label: string }[] = [
  { role: 'INVESTIGATION_OFFICER', label: 'Investigation Officer (IO)' },
  { role: 'WOMEN_HELP_DESK_OFFICER', label: 'Women Help Desk Officer (WHDO)' },
  { role: 'PROSECUTOR', label: 'Public Prosecutor' },
  { role: 'JUDGE', label: 'Honorable Magistrate / Judge' },
  { role: 'NCRB_ANALYST', label: 'NCRB Statistical Analyst' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { register, mockLogin, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [role, setRole] = useState<Role>('INVESTIGATION_OFFICER');
  const [department, setDepartment] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRegister = async () => {
    setLocalError(null);
    clearError();

    if (!name || !email || !badgeNumber || !department || !jurisdiction || !password) {
      setLocalError('All fields are statutory requirements and cannot be empty.');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters with alphanumeric security.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Password confirmation does not match.');
      return;
    }

    try {
      await register({
        name,
        email,
        badgeNumber,
        role,
        department,
        jurisdiction,
        password,
      });
      setSuccessMsg('Official identity registered successfully. You may now sign in.');
      setTimeout(() => {
        router.push('/(auth)/login');
      }, 1500);
    } catch (e: any) {
      setLocalError(e.message || 'Registration failed');
    }
  };

  const handleMockLogin = async (selectedRole: any) => {
    clearError();
    await mockLogin(selectedRole);
    const currentUser = useAuthStore.getState().user;
    if (currentUser?.role === 'WOMEN_HELP_DESK_OFFICER') {
      router.replace('/(mobile)/home');
    } else {
      router.replace('/(web)/dashboard');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <OfficialSeal size={52} />
          <Text style={styles.appName}>PRAMAAN</Text>
          <Text style={styles.appSub}>Official Personnel Registration & Digital Identity Enrollment</Text>
          <Text style={styles.department}>
            National Crime Records Directorate • Statutory Authentication Portal
          </Text>
        </View>

        {(error || localError) && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>[REGISTRATION ALERT] {localError || error}</Text>
          </View>
        )}

        {successMsg && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>[STATUS CONFIRMED] {successMsg}</Text>
          </View>
        )}

        {/* Registration Form */}
        <View style={styles.form}>
          <Input
            label="FULL OFFICIAL NAME"
            value={name}
            onChangeText={setName}
            placeholder="e.g., Inspector Rajesh Varma"
          />

          <Input
            label="OFFICIAL GOVERNMENT EMAIL"
            value={email}
            onChangeText={setEmail}
            placeholder="officer.name@nic.in"
            autoCapitalize="none"
          />

          <Input
            label="OFFICIAL SERVICE / BADGE NUMBER"
            value={badgeNumber}
            onChangeText={setBadgeNumber}
            placeholder="e.g., TN-IO-4892"
            autoCapitalize="characters"
          />

          {/* Role Selection */}
          <Text style={styles.fieldLabel}>STATUTORY CADRE / ROLE</Text>
          <View style={styles.rolePickerRow}>
            {ROLES_LIST.map((r) => (
              <TouchableOpacity
                key={r.role}
                onPress={() => setRole(r.role)}
                style={[styles.roleSelectChip, role === r.role && styles.roleSelectChipActive]}
              >
                <Text style={[styles.roleChipText, role === r.role && styles.roleChipTextActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="DEPARTMENT / POLICE WING"
            value={department}
            onChangeText={setDepartment}
            placeholder="e.g., Women Safety Division, Crime Branch"
          />

          <Input
            label="STATE / DISTRICT JURISDICTION"
            value={jurisdiction}
            onChangeText={setJurisdiction}
            placeholder="e.g., Chennai Central"
          />

          <Input
            label="SECURITY CREDENTIAL / PASSWORD (MIN 8 CHARS)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••••••"
          />

          <Input
            label="CONFIRM SECURITY CREDENTIAL"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="••••••••••••"
          />

          <Button
            title={isLoading ? 'ENROLLING IDENTITY...' : 'REGISTER OFFICIAL IDENTITY →'}
            onPress={handleRegister}
            loading={isLoading}
            style={styles.registerBtn}
          />
        </View>

        {/* Navigation Switch: Already registered? Login */}
        <View style={styles.switchAuthRow}>
          <Text style={styles.switchPrompt}>Already enrolled in the official register?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.switchLink}>Sign In to Registry →</Text>
          </TouchableOpacity>
        </View>

        {/* BENEATH REGISTER / LOGIN: Evaluation & Rapid Audit Access (Mock Login) */}
        <Panel
          title="RAPID EVALUATION ACCESS (MOCK LOGIN)"
          subtitle="Provisions valid cryptographically signed JWT access & refresh tokens to inspect role-based workflows without manual TOTP challenge."
          variant="ledger"
          style={styles.demoPanel}
        >
          <View style={styles.demoGrid}>
            {DEMO_ACCOUNTS.map((acc) => (
              <TouchableOpacity
                key={acc.role}
                onPress={() => handleMockLogin(acc.role)}
                disabled={isLoading}
                style={styles.demoItem}
              >
                <View style={styles.demoItemHeader}>
                  <Text style={styles.demoRoleTitle}>{acc.label}</Text>
                  <Text style={styles.demoBadge}>ID: {acc.badge}</Text>
                </View>
                <View style={styles.demoItemFooter}>
                  <Text style={styles.demoEmail}>{acc.email}</Text>
                  <Text style={styles.generateTokenTag}>PROVISION TOKENS →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Panel>

        {/* Terms Link */}
        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            Enforces strict digital evidence non-repudiation under Bharatiya Sakshya Adhiniyam, 2023.
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/terms')} style={styles.termsLinkWrap}>
            <Text style={styles.termsLink}>View Platform Terms & Conditions →</Text>
          </TouchableOpacity>
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
    maxWidth: 640,
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
    paddingBottom: 18,
  },
  appName: {
    fontFamily: typography.fontSerif,
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
    marginTop: 10,
  },
  appSub: {
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
    marginTop: 3,
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
    fontSize: 11,
    fontWeight: '700',
    color: colors.alertDark,
  },
  successBanner: {
    backgroundColor: colors.verifiedLight,
    borderWidth: 1,
    borderColor: colors.verifiedBorder,
    padding: 10,
    borderRadius: 2,
    marginBottom: 16,
  },
  successText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '700',
    color: colors.verifiedDark,
  },
  form: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 6,
  },
  rolePickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  roleSelectChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  roleSelectChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleChipText: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  roleChipTextActive: {
    color: colors.textInverse,
  },
  registerBtn: {
    marginTop: 10,
  },
  switchAuthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
    flexWrap: 'wrap',
    gap: 6,
  },
  switchPrompt: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textSecondary,
  },
  switchLink: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  demoPanel: {
    marginTop: 4,
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
  demoItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
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
    fontWeight: '700',
  },
  demoItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  demoEmail: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textMuted,
  },
  generateTokenTag: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryHover,
  },
  footerNote: {
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 14,
    textAlign: 'center',
  },
  termsLinkWrap: {
    marginTop: 6,
  },
  termsLink: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
