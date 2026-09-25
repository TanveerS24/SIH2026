import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { View, StyleSheet } from 'react-native';
import { colors, LoadingScreen } from '@pramaan/ui';

export default function RootIndex() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingScreen
          message="Authenticating Session & Initializing Ledger..."
          subMessage="Verifying credentials with central authority node"
        />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.role === 'WOMEN_HELP_DESK_OFFICER') {
    return <Redirect href="/(mobile)/home" />;
  }

  return <Redirect href="/(web)/dashboard" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
