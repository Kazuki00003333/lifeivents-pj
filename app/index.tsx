import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { colors, spacing } from '@/lib/constants/colors';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/onboarding');
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>LifePath</Text>
      <ActivityIndicator size="large" color={colors.accent} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  logo: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xl,
  },
  spinner: {
    marginTop: spacing.lg,
  },
});
