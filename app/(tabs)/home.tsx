import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { colors, spacing, borderRadius } from '@/lib/constants/colors';

export default function HomeScreen() {
  const router = useRouter();

  const mockEvents = [
    {
      id: '1',
      name: '結婚式',
      type: 'wedding',
      date: '2025-06-15',
      color: colors.eventTypes.wedding,
      tasksCompleted: 28,
      tasksTotal: 45,
      guestsConfirmed: 85,
      guestsTotal: 120,
      budgetUsed: 1800000,
      budgetTotal: 3000000,
    },
    {
      id: '2',
      name: '誕生日パーティー',
      type: 'celebration',
      date: '2025-03-20',
      color: colors.eventTypes.celebration,
      tasksCompleted: 15,
      tasksTotal: 20,
      guestsConfirmed: 25,
      guestsTotal: 30,
      budgetUsed: 80000,
      budgetTotal: 150000,
    },
  ];

  const mockTasks = [
    {
      id: '1',
      title: '招待状のデザインを決める',
      event: '結婚式',
      dueDate: '2025-01-20',
      completed: false,
    },
    {
      id: '2',
      title: '会場の最終確認',
      event: '結婚式',
      dueDate: '2025-01-22',
      completed: false,
    },
    {
      id: '3',
      title: 'ケーキの予約',
      event: '誕生日パーティー',
      dueDate: '2025-01-25',
      completed: false,
    },
  ];

  const getDaysUntil = (dateString: string) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString('ja-JP')}`;
  };

  const getProgressPercentage = (completed: number, total: number) => {
    return Math.round((completed / total) * 100);
  };

  const ProgressBar = ({
    progress,
    color,
  }: {
    progress: number;
    color: string;
  }) => (
    <View style={styles.progressBarContainer}>
      <View
        style={[
          styles.progressBarFill,
          { width: `${progress}%`, backgroundColor: color },
        ]}
      />
    </View>
  );

  const sortedTasksByDueDate = [...mockTasks].sort((a, b) => {
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const getDaysUntilTask = (dateString: string) => {
    const taskDate = new Date(dateString);
    const today = new Date();
    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.greeting}>おかえりなさい</Text>
          {mockEvents.length > 0 && (
            <View style={styles.mainEventBadge}>
              <Text style={styles.mainEventText}>
                {mockEvents[0].name}まであと {getDaysUntil(mockEvents[0].date)} 日
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>期限が近いタスク</Text>
          </View>

          <View style={styles.tasksList}>
            {sortedTasksByDueDate.map((task) => {
              const daysUntil = getDaysUntilTask(task.dueDate);
              const isUrgent = daysUntil <= 3;

              return (
                <Card key={task.id} padding="md" variant="elevated">
                  <View style={styles.taskCard}>
                    <View style={styles.taskContent}>
                      <View style={styles.taskHeader}>
                        <Text style={styles.taskTitle}>{task.title}</Text>
                        {isUrgent && (
                          <View style={styles.urgentBadge}>
                            <Text style={styles.urgentBadgeText}>緊急</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.taskEvent}>{task.event}</Text>
                      <View style={styles.taskFooter}>
                        <Text style={[styles.taskDate, isUrgent && styles.taskDateUrgent]}>
                          期限: {new Date(task.dueDate).toLocaleDateString('ja-JP')}
                        </Text>
                        <Text style={[styles.taskDaysUntil, isUrgent && styles.taskDaysUntilUrgent]}>
                          あと{daysUntil}日
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl * 2,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  mainEventBadge: {
    backgroundColor: colors.accent + '20',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  mainEventText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  tasksList: {
    gap: spacing.md,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  urgentBadge: {
    backgroundColor: colors.status.error,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    marginLeft: spacing.sm,
  },
  urgentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  taskEvent: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskDate: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  taskDateUrgent: {
    color: colors.status.error,
    fontWeight: '600',
  },
  taskDaysUntil: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  taskDaysUntilUrgent: {
    color: colors.status.error,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
});
