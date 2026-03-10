import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Card } from '@/components/common/Card';
import { colors, spacing, borderRadius } from '@/lib/constants/colors';
import { mockEvents } from '@/lib/services/mockData';

export default function CalendarScreen() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'wedding':
        return '💍';
      case 'funeral':
        return '🕊️';
      case 'celebration':
        return '🎉';
      default:
        return '📝';
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return mockEvents.filter((event) => event.date === dateString);
  };

  const eventsForSelectedMonth = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    return mockEvents.filter((event) => {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
  }, [selectedMonth]);

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(selectedMonth);
    const days = [];
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const events = getEventsForDate(date);
      const hasEvents = events.length > 0;
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isToday && styles.calendarDayToday,
            hasEvents && styles.calendarDayWithEvent,
          ]}
          onPress={() => {
            if (hasEvents) {
              router.push(`/event/${events[0].id}`);
            }
          }}
        >
          <Text
            style={[
              styles.calendarDayText,
              isToday && styles.calendarDayTodayText,
              hasEvents && styles.calendarDayWithEventText,
            ]}
          >
            {day}
          </Text>
          {hasEvents && (
            <View style={styles.eventIndicator}>
              {events.slice(0, 3).map((event, idx) => (
                <View key={idx} style={[styles.eventDot, { backgroundColor: event.color }]} />
              ))}
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.weekDaysContainer}>
          {weekDays.map((day, index) => (
            <View key={day} style={styles.weekDay}>
              <Text
                style={[
                  styles.weekDayText,
                  (index === 0 || index === 6) && styles.weekDayWeekend,
                ]}
              >
                {day}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.daysGrid}>{days}</View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>カレンダー</Text>

        <View style={styles.monthSelector}>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => {
              const newDate = new Date(selectedMonth);
              newDate.setMonth(newDate.getMonth() - 1);
              setSelectedMonth(newDate);
            }}
          >
            <ChevronLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {selectedMonth.toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
            })}
          </Text>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => {
              const newDate = new Date(selectedMonth);
              newDate.setMonth(newDate.getMonth() + 1);
              setSelectedMonth(newDate);
            }}
          >
            <ChevronRight size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {renderCalendar()}

        <View style={styles.eventsSection}>
          <Text style={styles.eventsSectionTitle}>今月のイベント ({eventsForSelectedMonth.length}件)</Text>

          {eventsForSelectedMonth.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>今月のイベントはありません</Text>
            </View>
          ) : (
            eventsForSelectedMonth
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((event) => (
                <Card key={event.id} onPress={() => router.push(`/event/${event.id}`)} padding="md" variant="elevated" style={styles.eventCard}>
                  <View style={styles.eventCardContent}>
                    <View style={[styles.eventIconBadge, { backgroundColor: event.color + '30' }]}>
                      <Text style={styles.eventIconText}>{getEventIcon(event.type)}</Text>
                    </View>
                    <View style={styles.eventCardInfo}>
                      <Text style={styles.eventCardName}>{event.name}</Text>
                      <Text style={styles.eventCardDate}>
                        {new Date(event.date).toLocaleDateString('ja-JP', {
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short',
                        })}{' '}
                        • {event.event_for}
                      </Text>
                      {event.location && <Text style={styles.eventCardLocation}>📍 {event.location}</Text>}
                    </View>
                  </View>
                </Card>
              ))
          )}
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
  header: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  calendarContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  weekDayWeekend: {
    color: colors.status.error,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs / 2,
  },
  calendarDayToday: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
  },
  calendarDayWithEvent: {
    backgroundColor: colors.accent + '15',
    borderRadius: borderRadius.md,
  },
  calendarDayText: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  calendarDayTodayText: {
    fontWeight: '700',
  },
  calendarDayWithEventText: {
    fontWeight: '700',
    color: colors.accent,
  },
  eventIndicator: {
    flexDirection: 'row',
    gap: 2,
    marginTop: spacing.xs / 2,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  eventsSection: {
    marginTop: spacing.md,
  },
  eventsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: 15,
    color: colors.text.tertiary,
  },
  eventCard: {
    marginBottom: spacing.md,
  },
  eventCardContent: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  eventIconBadge: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventIconText: {
    fontSize: 24,
  },
  eventCardInfo: {
    flex: 1,
  },
  eventCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  eventCardDate: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: spacing.xs / 2,
  },
  eventCardLocation: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
});
