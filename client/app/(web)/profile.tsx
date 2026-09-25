import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, Panel, Input, Button, StatusTag, OfficialSeal, LoadingScreen } from '@pramaan/ui';
import { useAuthStore } from '../../stores/authStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateProfile, isLoading, error, clearError, logout } = useAuthStore();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [jurisdiction, setJurisdiction] = useState(user?.jurisdiction || '');

  // Password update state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [feedback, setFeedback] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSaveProfile = async () => {
    setLocalError(null);
    setFeedback(null);
    clearError();

    const payload: any = {
      name,
      department,
      jurisdiction,
    };

    if (showPasswordSection && newPassword) {
      if (!currentPassword) {
        setLocalError('Current password is required to set a new password.');
        return;
      }
      if (newPassword.length < 8) {
        setLocalError('New password must be at least 8 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setLocalError('New password confirmation does not match.');
        return;
      }
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    try {
      await updateProfile(payload);
      setFeedback('Official profile information successfully updated.');
      setIsEditing(false);
      setShowPasswordSection(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setLocalError(e.message || 'Failed to update profile.');
    }
  };

  if (!user) {
    return (
      <ScrollView contentContainerStyle={[styles.container, isMobile && styles.containerMobile]}>
        <LoadingScreen
          message="Loading Officer Profile..."
          subMessage="Authenticating session and fetching statutory credentials"
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, isMobile && styles.containerMobile]}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <OfficialSeal size={isMobile ? 32 : 40} />
          <View style={styles.headerTextWrap}>
            <Text style={styles.pageTitle}>OFFICER IDENTITY & PROFILE SCRUTINY</Text>
            <Text style={styles.pageSub}>
              Digital Chain-of-Custody Authentication & Cryptographic Credentials
            </Text>
          </View>
        </View>
      </View>

      {(error || localError) && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>[PROFILE ALERT] {localError || error}</Text>
        </View>
      )}

      {feedback && (
        <View style={styles.successBanner}>
          <View style={{ flex: 1, minWidth: 200 }}>
            <Text style={styles.successText}>[STATUS CONFIRMED] {feedback}</Text>
            <Text style={styles.successSubText}>
              A confidential audit record has been dispatched to your private notifications ledger.
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(web)/notifications')}
            style={styles.notifLinkBtn}
          >
            <Text style={styles.notifLinkText}>VIEW NOTIFICATIONS →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Identity Card Panel */}
      <Panel
        title="STATUTORY CREDENTIAL IDENTIFICATION"
        subtitle="Immutable public parameters recorded in National Police Directory"
        variant="ledger"
        action={
          !isEditing ? (
            <Button
              title="EDIT PROFILE DETAILS"
              onPress={() => setIsEditing(true)}
              variant="outline"
              size="sm"
            />
          ) : (
            <Button
              title="CANCEL EDITING"
              onPress={() => {
                setIsEditing(false);
                setName(user?.name || '');
                setDepartment(user?.department || '');
                setJurisdiction(user?.jurisdiction || '');
                setShowPasswordSection(false);
              }}
              variant="ghost"
              size="sm"
            />
          )
        }
      >
        <View style={styles.idCard}>
          <View style={styles.idGrid}>
            <View style={styles.idField}>
              <Text style={styles.idLabel}>OFFICIAL NAME</Text>
              {isEditing ? (
                <Input value={name} onChangeText={setName} placeholder="Official Name" />
              ) : (
                <Text style={styles.idValPrimary}>{user?.name || 'N/A'}</Text>
              )}
            </View>

            <View style={styles.idField}>
              <Text style={styles.idLabel}>SERVICE / BADGE ID</Text>
              <Text style={styles.idValMono}>{user?.badgeNumber || 'N/A'}</Text>
            </View>

            <View style={styles.idField}>
              <Text style={styles.idLabel}>OFFICIAL EMAIL</Text>
              <Text style={styles.idValMono}>{user?.email || 'N/A'}</Text>
            </View>

            <View style={styles.idField}>
              <Text style={styles.idLabel}>STATUTORY CADRE / ROLE</Text>
              <View style={{ marginTop: 2 }}>
                <StatusTag
                  label={user?.role?.replace(/_/g, ' ') || 'OFFICER'}
                  variant="verified"
                />
              </View>
            </View>

            <View style={styles.idField}>
              <Text style={styles.idLabel}>DEPARTMENT / WING</Text>
              {isEditing ? (
                <Input value={department} onChangeText={setDepartment} placeholder="Department" />
              ) : (
                <Text style={styles.idValText}>{user?.department || 'N/A'}</Text>
              )}
            </View>

            <View style={styles.idField}>
              <Text style={styles.idLabel}>JURISDICTION</Text>
              {isEditing ? (
                <Input value={jurisdiction} onChangeText={setJurisdiction} placeholder="Jurisdiction" />
              ) : (
                <Text style={styles.idValText}>{user?.jurisdiction || 'N/A'}</Text>
              )}
            </View>
          </View>

          {/* Password Section Toggle when editing */}
          {isEditing && (
            <View style={styles.editActionsSection}>
              <TouchableOpacity
                onPress={() => setShowPasswordSection(!showPasswordSection)}
                style={styles.togglePasswordBtn}
              >
                <Text style={styles.togglePasswordText}>
                  {showPasswordSection ? '[-] CANCEL PASSWORD CHANGE' : '[+] UPDATE SECURITY PASSWORD'}
                </Text>
              </TouchableOpacity>

              {showPasswordSection && (
                <View style={styles.passwordForm}>
                  <Input
                    label="CURRENT PASSWORD"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                    placeholder="Enter current password"
                  />
                  <Input
                    label="NEW SECURITY PASSWORD (MIN 8 CHARS)"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    placeholder="Enter new password"
                  />
                  <Input
                    label="CONFIRM NEW SECURITY PASSWORD"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    placeholder="Confirm new password"
                  />
                </View>
              )}

              <View style={styles.saveBtnRow}>
                <Button
                  title={isLoading ? 'SAVING MODIFICATIONS...' : 'SAVE PROFILE MODIFICATIONS →'}
                  onPress={handleSaveProfile}
                  loading={isLoading}
                  variant="primary"
                />
              </View>
            </View>
          )}
        </View>
      </Panel>

      {/* Session Management */}
      <Panel title="SESSION GOVERNANCE" variant="default">
        <View style={styles.logoutPanel}>
          <Text style={styles.logoutDesc}>
            Terminate the active cryptographic session and release local access tokens.
          </Text>
          <Button
            title="LOGOUT FROM PRAMAAN"
            onPress={logout}
            variant="secondary"
            size="md"
          />
        </View>
      </Panel>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    maxWidth: '100%',
  },
  logoutPanel: {
    gap: 10,
    paddingVertical: 4,
  },
  logoutDesc: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textMuted,
  },
  containerMobile: {
    padding: 12,
  },
  header: {
    marginBottom: 20,
    backgroundColor: colors.surface,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 2,
    maxWidth: '100%',
    overflow: 'hidden',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
  },
  headerTextWrap: {
    marginLeft: 12,
    flex: 1,
    flexShrink: 1,
  },
  pageTitle: {
    fontFamily: typography.fontSerif,
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
    flexWrap: 'wrap',
  },
  pageSub: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    flexWrap: 'wrap',
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
    padding: 12,
    borderRadius: 2,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  successText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '700',
    color: colors.verifiedDark,
  },
  successSubText: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  notifLinkBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.verifiedBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 2,
  },
  notifLinkText: {
    fontFamily: typography.fontSans,
    fontSize: 9,
    fontWeight: '800',
    color: colors.verifiedDark,
    letterSpacing: 0.5,
  },
  idCard: {
    backgroundColor: colors.surface,
    borderRadius: 2,
    padding: 12,
  },
  idGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  idField: {
    flexBasis: '45%',
    flexGrow: 1,
    minWidth: 150,
    marginBottom: 8,
  },
  idLabel: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  idValPrimary: {
    fontFamily: typography.fontSans,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  idValMono: {
    fontFamily: typography.fontMono,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  idValText: {
    fontFamily: typography.fontSans,
    fontSize: 13,
    color: colors.textSecondary,
  },
  editActionsSection: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  togglePasswordBtn: {
    marginBottom: 12,
  },
  togglePasswordText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  passwordForm: {
    backgroundColor: colors.surfaceMuted,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    marginBottom: 16,
  },
  saveBtnRow: {
    marginTop: 8,
  },
});
