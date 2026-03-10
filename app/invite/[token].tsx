import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/common/Button';
import { colors, spacing } from '@/lib/constants/colors';
import { eventService } from '@/lib/services/eventService';
import { supabase } from '@/lib/supabase';

export default function InviteAcceptScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const [inviteInfo, setInviteInfo] = useState<{
    event_id: string;
    event_name: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      try {
        const info = await eventService.getInviteByToken(token);
        setInviteInfo(info ? { event_id: info.event_id, event_name: info.event_name } : null);
      } catch (e) {
        console.error(e);
        setInviteInfo(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleAccept = async () => {
    if (!token || !inviteInfo) return;
    setAccepting(true);
    try {
      const eventId = await eventService.acceptInvite(token);
      setAccepting(false);
      router.replace(`/event/${eventId}`);
    } catch (e: any) {
      setAccepting(false);
      const msg = e?.message || '参加に失敗しました';
      if (msg.includes('invite_not_found_or_expired') || msg.includes('invite_max_uses_reached')) {
        Alert.alert('招待の有効期限が切れているか、利用回数に達しています。');
      } else {
        Alert.alert('参加に失敗しました', msg);
      }
    }
  };

  const handleGoToLogin = () => {
    const redirect = `/invite/${token}`;
    router.push(`/auth/login?redirect=${encodeURIComponent(redirect)}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!token || !inviteInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>招待が見つかりません</Text>
          <Text style={styles.errorSub}>リンクの有効期限が切れているか、無効です。</Text>
          <Button title="ホームへ" onPress={() => router.replace('/(tabs)/home')} style={styles.button} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.eventName}>「{inviteInfo.event_name}」</Text>
          <Text style={styles.message}>このイベントに参加するにはログインが必要です。</Text>
          <Button title="ログイン" onPress={handleGoToLogin} style={styles.button} />
          <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} style={styles.link}>
            <Text style={styles.linkText}>ホームへ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.eventName}>「{inviteInfo.event_name}」</Text>
        <Text style={styles.message}>このイベントに参加しますか？参加すると、タスクやゲストを一緒に管理できます。</Text>
        <Button
          title={accepting ? '参加処理中...' : '参加する'}
          onPress={handleAccept}
          disabled={accepting}
          style={styles.button}
        />
        <TouchableOpacity onPress={() => router.back()} style={styles.link} disabled={accepting}>
          <Text style={styles.linkText}>キャンセル</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    margin: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.text.secondary,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  errorSub: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  eventName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  message: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  button: {
    marginBottom: spacing.md,
  },
  link: {
    alignSelf: 'center',
  },
  linkText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
  },
});
