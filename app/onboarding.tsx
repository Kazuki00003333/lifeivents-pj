import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Users, History, Sparkles } from 'lucide-react-native';
import { Button } from '@/components/common/Button';
import { colors, spacing, borderRadius } from '@/lib/constants/colors';
import { logger } from '@/lib/logger';
import { generateEventsFromChildBirth, PREFECTURES } from '@/lib/utils/magicOnboarding';
import { eventService } from '@/lib/services/eventService';
import { supabase } from '@/lib/supabase';
import { colors as colorMap } from '@/lib/constants/colors';

const { width } = Dimensions.get('window');

const slides = [
  {
    icon: Calendar,
    title: '人生の大事なイベントを\n抜け漏れなく準備',
    description: '七五三・入学・結婚式・葬儀まで。大切な節目をプロジェクトとして管理し、タスクを整理して準備を確実に進められます。',
  },
  {
    icon: Users,
    title: '家族・パートナーと\nタスクと連絡帳を共有',
    description: 'イベントの準備を一人で抱え込まない。家族やパートナーとリアルタイムで情報を共有し、協力して進められます。',
  },
  {
    icon: History,
    title: 'すべてのイベントが\n美しい年表として残る',
    description: '管理したイベントは自動的に人生の年表に。大切な思い出を振り返ることができます。',
  },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 25 }, (_, i) => CURRENT_YEAR - 15 + i);

export default function OnboardingScreen() {
  const [step, setStep] = useState<'slides' | 'wizard'>('slides');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [birthYear, setBirthYear] = useState(CURRENT_YEAR - 5);
  const [birthMonth, setBirthMonth] = useState(4);
  const [birthDay, setBirthDay] = useState(1);
  const [area, setArea] = useState(PREFECTURES[12]); // 東京都
  const [childLabel, setChildLabel] = useState('お子様');
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slideIndex);
  };

  const handleGetStarted = () => {
    logger.info('オンボーディング完了（スキップ）', { screen: 'onboarding' });
    router.replace('/(tabs)/home');
  };

  const handleOpenWizard = () => {
    setStep('wizard');
  };

  const handleGenerate = async () => {
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    const events = generateEventsFromChildBirth(birthYear, birthMonth, childLabel);

    if (user) {
      try {
        for (const ev of events) {
          await eventService.createEvent({
            user_id: user.id,
            name: ev.name,
            event_type: ev.event_type,
            event_date: ev.event_date,
            description: ev.description,
            color: colorMap.eventTypes.celebration,
          });
        }
        logger.info('マジックオンボーディングでイベントを自動作成', {
          count: events.length,
          area,
          birthYear,
          birthMonth,
        });
        router.replace('/(tabs)/home');
      } catch (e) {
        logger.error('マジックオンボーディング作成失敗', { error: String(e) });
        Alert.alert('作成に失敗しました', 'しばらくしてから再度お試しください。');
      } finally {
        setCreating(false);
      }
    } else {
      setCreating(false);
      Alert.alert(
        'ログインが必要です',
        'イベントをカレンダーに保存するにはログインしてください。ログイン後、設定からお子様の情報を入力してイベントを自動作成できます。',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/home') }]
      );
    }
  };

  if (step === 'wizard') {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.wizardScroll}
          contentContainerStyle={styles.wizardContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.wizardHeader}>
            <Sparkles size={40} color={colors.accent} />
            <Text style={styles.wizardTitle}>あなたの年表を自動作成</Text>
            <Text style={styles.wizardSubtitle}>
              お子様の生年月日と居住エリアを入力するだけで、七五三・入学・卒業などの主要イベントがカレンダーに追加されます。
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>お子様の呼び方（任意）</Text>
            <Text style={styles.hint}>例: 長男、娘、〇〇ちゃん</Text>
            <TextInput
              style={styles.input}
              value={childLabel}
              onChangeText={(t) => setChildLabel(t || 'お子様')}
              placeholder="お子様"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>生年月日</Text>
            <View style={styles.dateRow}>
              <TextInput
                style={styles.dateInput}
                value={String(birthYear)}
                onChangeText={(t) => setBirthYear(Number(t) || birthYear)}
                keyboardType="number-pad"
                placeholder="年"
              />
              <Text style={styles.dateSeparator}>年</Text>
              <TextInput
                style={styles.dateInput}
                value={String(birthMonth)}
                onChangeText={(t) => setBirthMonth(Math.min(12, Math.max(1, Number(t) || 1)))}
                keyboardType="number-pad"
                placeholder="月"
              />
              <Text style={styles.dateSeparator}>月</Text>
              <TextInput
                style={styles.dateInput}
                value={String(birthDay)}
                onChangeText={(t) => setBirthDay(Math.min(31, Math.max(1, Number(t) || 1)))}
                keyboardType="number-pad"
                placeholder="日"
              />
              <Text style={styles.dateSeparator}>日</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>居住エリア（提携先紹介に利用）</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {PREFECTURES.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.chip, area === p && styles.chipActive]}
                  onPress={() => setArea(p)}
                >
                  <Text style={[styles.chipText, area === p && styles.chipTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {creating ? (
            <View style={styles.creatingBox}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.creatingText}>イベントを作成しています…</Text>
            </View>
          ) : (
            <Button
              title="イベントを自動作成してはじめる"
              onPress={handleGenerate}
              variant="primary"
              size="large"
              fullWidth
            />
          )}

          <TouchableOpacity onPress={() => setStep('slides')} style={styles.backLink}>
            <Text style={styles.backLinkText}>← スライドに戻る</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <View style={styles.iconContainer}>
              <slide.icon size={80} color={colors.accent} strokeWidth={1.5} />
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentSlide === index && styles.activeDot,
              ]}
            />
          ))}
        </View>

        <Button
          title="お子様の情報を入力して年表を自動作成"
          onPress={handleOpenWizard}
          variant="primary"
          size="large"
          fullWidth
        />
        <TouchableOpacity onPress={handleGetStarted} style={styles.skipButton}>
          <Text style={styles.skipText}>スキップしてはじめる</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 36,
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl + spacing.md,
    backgroundColor: colors.surface,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border.light,
    marginHorizontal: spacing.xs,
  },
  activeDot: {
    width: 24,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  skipButton: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontSize: 15,
    color: colors.text.tertiary,
  },
  // Wizard
  wizardScroll: {
    flex: 1,
  },
  wizardContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  wizardHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  wizardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  wizardSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  hint: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.text.primary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dateInput: {
    width: 56,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
  },
  dateSeparator: {
    fontSize: 16,
    color: colors.text.secondary,
    marginHorizontal: spacing.xs,
  },
  chipScroll: {
    marginTop: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSecondary,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.accent,
  },
  chipText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  chipTextActive: {
    color: colors.text.inverse,
  },
  creatingBox: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  creatingText: {
    fontSize: 15,
    color: colors.text.secondary,
  },
  backLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  backLinkText: {
    fontSize: 14,
    color: colors.accent,
  },
});
