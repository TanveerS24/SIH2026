import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { useSyncStore } from '../stores/syncStore';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors, typography } from '@pramaan/ui';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RootNavigator() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const initAuth = useAuthStore((s) => s.initAuth);
  const initSync = useSyncStore((s) => s.initSync);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initAuth();
    initSync();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Direct WHDO to mobile field view, others to web dashboard
      if (user?.role === 'WOMEN_HELP_DESK_OFFICER') {
        router.replace('/(mobile)/home');
      } else {
        router.replace('/(web)/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, segments, user]);

  return (
    <View style={styles.rootContainer}>
      {/* Official Prototype Disclaimer Banner */}
      <View style={styles.disclaimerBanner}>
        <Text style={styles.disclaimerText}>
          NATIONAL CRIME RECORDS BODY • WOMEN SAFETY DIVISION — PRAMAAN EVIDENCE LEDGER (PROTOTYPE / SYNTHETIC DATA)
        </Text>
      </View>

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(web)" options={{ headerShown: false }} />
        <Stack.Screen name="(mobile)" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigator />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  disclaimerBanner: {
    backgroundColor: colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  disclaimerText: {
    fontFamily: typography.fontSans,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textInverse,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
});
