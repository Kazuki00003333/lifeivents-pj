import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Users, History } from 'lucide-react-native';
import { Button } from '@/components/common/Button';
import { colors, spacing } from '@/lib/constants/colors';

const { width } = Dimensions.get('window');

const slides = [
  {
    icon: Calendar,
    title: '人生の大事なイベントを\n抜け漏れなく準備',
    description: '結婚式や葬儀など、大切な節目のイベントをプロジェクトとして管理。タスクを整理し、準備を確実に進められます。',
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

export default function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slideIndex);
  };

  const handleGetStarted = () => {
    router.replace('/(tabs)/home');
  };

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
          title="はじめる"
          onPress={handleGetStarted}
          size="large"
          fullWidth
        />
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
    backgroundColor: colors.accent,
  },
});
