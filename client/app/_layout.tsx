import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/authStore';
import { useSyncStore } from '../stores/syncStore';
import { View, Text, StyleSheet, Platform, StatusBar } from 'react-native';
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
  const insets = useSafeAreaInsets();

  useEffect(() => {
    initAuth();
    initSync();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isPublicRoute = segments[0] === '+not-found' || (segments as string[]).includes('terms');

    if (!isAuthenticated && !inAuthGroup && !isPublicRoute) {
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
    <View style={[styles.rootContainer, { paddingTop: Platform.OS !== 'web' ? insets.top : 0 }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      {/* Official Institutional Banner */}
      <View style={styles.disclaimerBanner}>
        <Text style={styles.disclaimerText} numberOfLines={1}>
          NATIONAL CRIME RECORDS BODY • BHARATIYA SAKSHYA ADHINIYAM (BSA) COMPLIANT EVIDENCE LEDGER
        </Text>
      </View>

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(web)" options={{ headerShown: false }} />
        <Stack.Screen name="(mobile)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
      </Stack>
    </View>

  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <RootNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: colors.primary,
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
    fontSize: 9,
    fontWeight: '700',
    color: colors.textInverse,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
});
