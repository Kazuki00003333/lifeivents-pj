import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Link, MessageCircle } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { Button } from '@/components/common/Button';
import { colors, spacing, borderRadius } from '@/lib/constants/colors';
import { MIN_TOUCH_TARGET } from '@/lib/constants/layout';
import { eventService } from '@/lib/services/eventService';
import { buildInviteUrl, buildLineShareUrl } from '@/lib/utils/invite';
import { supabase } from '@/lib/supabase';

export default function EventShareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [eventName, setEventName] = useState('');
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const event = await eventService.getEvent(id);
        setEventName(event?.name || 'イベント');
        const invites = await eventService.getEventInvites(id);
        const valid = invites.find(
          (i) => new Date(i.expires_at) > new Date() && (i.max_uses === 0 || i.use_count < i.max_uses)
        );
        setInviteToken(valid?.token ?? null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const createInvite = async () => {
    if (!id) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('ログインしてください');
      return;
    }
    setCreating(true);
    try {
      const invite = await eventService.createInvite(id, user.id, { expiresInDays: 7, maxUses: 10 });
      setInviteToken(invite.token);
    } catch (e) {
      Alert.alert('招待の作成に失敗しました');
    } finally {
      setCreating(false);
    }
  };

  const copyLink = () => {
    if (!inviteToken) return;
    const url = buildInviteUrl(inviteToken);
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(url);
        Alert.alert('コピーしました', url);
      }
    } else {
      Share.share({
        message: `【LifePath】「${eventName}」の準備を一緒に管理しませんか？\n\n${url}`,
        url: Platform.OS === 'ios' ? url : undefined,
        title: 'イベントに招待',
      });
    }
  };

  const openLineShare = () => {
    if (!inviteToken) return;
    const url = buildLineShareUrl(inviteToken, eventName);
    Linking.openURL(url).catch(() => Alert.alert('LINEを開けませんでした'));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>家族を招待</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.eventName}>{eventName}</Text>

        {!inviteToken ? (
          <>
            <Text style={styles.description}>
              招待リンクを発行すると、家族やパートナーにリンクまたはLINEで送れます。相手が「参加する」と、このイベントを一緒に管理できます。
            </Text>
            <Button
              title={creating ? '発行中...' : '招待リンクを発行'}
              onPress={createInvite}
              disabled={creating}
              style={styles.primaryButton}
            />
          </>
        ) : (
          <>
            <Text style={styles.description}>以下の方法で招待を送れます。</Text>

            <TouchableOpacity style={styles.card} onPress={copyLink}>
              <Link size={24} color={colors.accent} />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>リンクをコピー</Text>
                <Text style={styles.cardSub} numberOfLines={1}>
                  {buildInviteUrl(inviteToken)}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={openLineShare}>
              <MessageCircle size={24} color={colors.accent} />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>LINEで送る</Text>
                <Text style={styles.cardSub}>LINEで招待メッセージを送る</Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.note}>招待リンクの有効期限は発行から7日間です。</Text>
          </>
        )}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  content: {
    padding: spacing.lg,
  },
  eventName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  primaryButton: {
    marginBottom: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  cardSub: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  note: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: spacing.lg,
  },
});
