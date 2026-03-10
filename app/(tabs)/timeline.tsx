import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, Users, Calendar, List, ChevronDown, Plus, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '@/lib/constants/colors';
import { TAB_BAR_AREA_HEIGHT } from '@/lib/constants/layout';
import { Card } from '@/components/common/Card';
import { mockEvents } from '@/lib/services/mockData';

const SCREEN_WIDTH = Dimensions.get('window').width;
const COLUMN_WIDTH = SCREEN_WIDTH * 0.75;

type ViewMode = 'vertical' | 'horizontal';

export default function TimelineScreen() {
  const router = useRouter();
  const [selectedYearTab, setSelectedYearTab] = useState('すべて');
  const [viewMode, setViewMode] = useState<ViewMode>('vertical');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPersonIndex, setSelectedPersonIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const yearTabs = useMemo(() => {
    const decades = new Set<string>();
    mockEvents.forEach((event) => {
      const year = parseInt(event.year);
      const decade = Math.floor(year / 10) * 10;
      decades.add(`${decade}年代`);
    });
    return ['すべて', ...Array.from(decades).sort()];
  }, []);

  const people = useMemo(() => {
    const peopleSet = new Set<string>();
    mockEvents.forEach((event) => {
      if (event.event_for) {
        peopleSet.add(event.event_for);
      }
    });
    return ['自分', ...Array.from(peopleSet).filter((p) => p !== '自分')];
  }, []);

  const filteredEventsByPerson = useMemo(() => {
    const result: Record<string, typeof mockEvents> = {};

    people.forEach((person) => {
      let events = mockEvents.filter((event) => event.event_for === person);

      if (selectedYearTab !== 'すべて') {
        const decade = parseInt(selectedYearTab);
        events = events.filter((event) => {
          const year = parseInt(event.year);
          return year >= decade && year < decade + 10;
        });
      }

      events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      result[person] = events;
    });

    return result;
  }, [selectedYearTab, people]);

  const allFilteredEvents = useMemo(() => {
    let events = [...mockEvents];

    if (selectedYearTab !== 'すべて') {
      const decade = parseInt(selectedYearTab);
      events = events.filter((event) => {
        const year = parseInt(event.year);
        return year >= decade && year < decade + 10;
      });
    }

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedYearTab]);

  const yearMonthOptions = useMemo(() => {
    const options: { year: string; month: string; label: string }[] = [];
    const sortedEvents = [...mockEvents].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedEvents.forEach((event) => {
      const date = new Date(event.date);
      const year = event.year;
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const label = `${year}年${month}月`;

      if (!options.find((opt) => opt.year === year && opt.month === month)) {
        options.push({ year, month, label });
      }
    });

    return options;
  }, []);

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

  const getPersonIcon = (person: string) => {
    if (person === '自分') return <User size={20} color={colors.text.inverse} />;
    return <Users size={20} color={colors.text.inverse} />;
  };

  const renderVerticalTimeline = () => {
    const groupedByYear: Record<string, typeof mockEvents> = {};
    allFilteredEvents.forEach((event) => {
      if (!groupedByYear[event.year]) {
        groupedByYear[event.year] = [];
      }
      groupedByYear[event.year].push(event);
    });

    const years = Object.keys(groupedByYear).sort((a, b) => parseInt(a) - parseInt(b));

    return (
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.verticalContent}
        showsVerticalScrollIndicator={false}
      >
        {years.map((year) => (
          <View key={year} style={styles.yearSection}>
            <View style={styles.yearHeader}>
              <View style={styles.yearBadge}>
                <Text style={styles.yearBadgeText}>{year}</Text>
              </View>
              <View style={styles.yearLine} />
            </View>

            {groupedByYear[year].map((event, index) => (
              <View key={event.id} style={styles.verticalEventItem}>
                <View style={styles.verticalEventLine}>
                  <View style={styles.verticalDotContainer}>
                    <View style={[styles.verticalDot, { backgroundColor: event.color }]} />
                    {index < groupedByYear[year].length - 1 && <View style={styles.verticalConnector} />}
                  </View>

                  <View style={styles.verticalEventCard}>
                    <Card onPress={() => router.push(`/event/${event.id}`)} padding="md" variant="elevated">
                      <View style={styles.verticalEventContent}>
                        <View style={styles.verticalEventHeader}>
                          <View style={[styles.eventIconBadge, { backgroundColor: event.color + '30' }]}>
                            <Text style={styles.eventIconText}>{getEventIcon(event.type)}</Text>
                          </View>
                          <View style={styles.verticalEventInfo}>
                            <Text style={styles.eventName}>{event.name}</Text>
                            <Text style={styles.verticalEventMeta}>
                              {new Date(event.date).toLocaleDateString('ja-JP', {
                                month: 'long',
                                day: 'numeric',
                              })}{' '}
                              • {event.event_for}
                            </Text>
                          </View>
                        </View>
                        {event.description && (
                          <Text style={styles.eventDescription} numberOfLines={2}>
                            {event.description}
                          </Text>
                        )}
                        {event.location && (
                          <Text style={styles.verticalEventLocation}>📍 {event.location}</Text>
                        )}
                      </View>
                    </Card>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderPersonColumn = (person: string, events: typeof mockEvents) => {
    return (
      <View key={person} style={styles.personColumn}>
        <View style={styles.personHeader}>
          <View style={styles.personIconContainer}>{getPersonIcon(person)}</View>
          <Text style={styles.personName}>{person}</Text>
          <Text style={styles.personEventCount}>{events.length}件</Text>
        </View>

        <ScrollView
          style={styles.personEventsScroll}
          contentContainerStyle={styles.personEvents}
          showsVerticalScrollIndicator={false}
        >
          {events.length === 0 ? (
            <View style={styles.emptyColumn}>
              <Text style={styles.emptyColumnText}>イベントがありません</Text>
            </View>
          ) : (
            events.map((event, index) => (
              <View key={event.id} style={styles.eventItem}>
                <View style={styles.eventLine}>
                  <View style={styles.eventDotContainer}>
                    <View style={[styles.eventDot, { backgroundColor: event.color }]} />
                    {index < events.length - 1 && <View style={styles.eventConnector} />}
                  </View>
                  <View style={styles.eventCardContainer}>
                    <Card onPress={() => router.push(`/event/${event.id}`)} padding="md" variant="elevated">
                      <View style={styles.eventContent}>
                        <View style={styles.eventYear}>
                          <Text style={styles.eventYearText}>{event.year}</Text>
                        </View>
                        <View style={[styles.eventIconBadge, { backgroundColor: event.color + '30' }]}>
                          <Text style={styles.eventIconText}>{getEventIcon(event.type)}</Text>
                        </View>
                        <Text style={styles.eventName}>{event.name}</Text>
                        <Text style={styles.eventDate}>
                          {new Date(event.date).toLocaleDateString('ja-JP', {
                            month: 'long',
                            day: 'numeric',
                          })}
                        </Text>
                        {event.description && (
                          <Text style={styles.eventDescription} numberOfLines={2}>
                            {event.description}
                          </Text>
                        )}
                      </View>
                    </Card>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>人生の年表</Text>
            <Text style={styles.subtitle}>家族の思い出を振り返りましょう</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.dateJumpButton} onPress={() => setShowDatePicker(true)}>
              <Calendar size={20} color={colors.text.secondary} />
              <ChevronDown size={16} color={colors.text.secondary} />
            </TouchableOpacity>

            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[styles.viewButton, viewMode === 'vertical' && styles.viewButtonActive]}
                onPress={() => setViewMode('vertical')}
              >
                <List size={20} color={viewMode === 'vertical' ? colors.text.inverse : colors.text.secondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewButton, viewMode === 'horizontal' && styles.viewButtonActive]}
                onPress={() => setViewMode('horizontal')}
              >
                <Users size={20} color={viewMode === 'horizontal' ? colors.text.inverse : colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
          {yearTabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedYearTab === tab && styles.tabActive]}
              onPress={() => setSelectedYearTab(tab)}
            >
              <Text style={[styles.tabText, selectedYearTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {viewMode === 'vertical' ? (
        renderVerticalTimeline()
      ) : (
        <View style={styles.horizontalContainer}>
          <View style={styles.personSelector}>
            <TouchableOpacity
              style={[styles.personNavButton, selectedPersonIndex === 0 && styles.personNavButtonDisabled]}
              onPress={() => setSelectedPersonIndex(Math.max(0, selectedPersonIndex - 1))}
              disabled={selectedPersonIndex === 0}
            >
              <ChevronLeftIcon size={24} color={selectedPersonIndex === 0 ? colors.text.tertiary : colors.text.primary} />
            </TouchableOpacity>
            <View style={styles.personInfo}>
              {getPersonIcon(people[selectedPersonIndex])}
              <Text style={styles.personSelectorText}>{people[selectedPersonIndex]}</Text>
            </View>
            <TouchableOpacity
              style={[styles.personNavButton, selectedPersonIndex === people.length - 1 && styles.personNavButtonDisabled]}
              onPress={() => setSelectedPersonIndex(Math.min(people.length - 1, selectedPersonIndex + 1))}
              disabled={selectedPersonIndex === people.length - 1}
            >
              <ChevronRightIcon size={24} color={selectedPersonIndex === people.length - 1 ? colors.text.tertiary : colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.singlePersonScroll}
            contentContainerStyle={styles.singlePersonContent}
            showsVerticalScrollIndicator={false}
          >
            {(filteredEventsByPerson[people[selectedPersonIndex]] || []).length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>イベントがありません</Text>
              </View>
            ) : (
              (filteredEventsByPerson[people[selectedPersonIndex]] || []).map((event, index, array) => (
                <View key={event.id} style={styles.singlePersonEventItem}>
                  <View style={styles.singlePersonEventLine}>
                    <View style={styles.singlePersonDotContainer}>
                      <View style={[styles.singlePersonDot, { backgroundColor: event.color }]} />
                      {index < array.length - 1 && <View style={styles.singlePersonConnector} />}
                    </View>

                    <View style={styles.singlePersonEventCard}>
                      <Card onPress={() => router.push(`/event/${event.id}`)} padding="md" variant="elevated">
                        <View style={styles.singlePersonEventContent}>
                          <View style={styles.eventYear}>
                            <Text style={styles.eventYearText}>{event.year}</Text>
                          </View>
                          <View style={[styles.eventIconBadge, { backgroundColor: event.color + '30' }]}>
                            <Text style={styles.eventIconText}>{getEventIcon(event.type)}</Text>
                          </View>
                          <Text style={styles.eventName}>{event.name}</Text>
                          <Text style={styles.eventDate}>
                            {new Date(event.date).toLocaleDateString('ja-JP', {
                              month: 'long',
                              day: 'numeric',
                            })}
                          </Text>
                          {event.description && (
                            <Text style={styles.eventDescription} numberOfLines={2}>
                              {event.description}
                            </Text>
                          )}
                        </View>
                      </Card>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/event/new')} activeOpacity={0.8}>
        <Plus size={28} color={colors.text.inverse} strokeWidth={2.5} />
      </TouchableOpacity>

      <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDatePicker(false)}>
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>年月を選択</Text>
            </View>
            <ScrollView style={styles.datePickerList}>
              {yearMonthOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.datePickerItem}
                  onPress={() => {
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.datePickerItemText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  dateJumpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: 4,
  },
  viewButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  viewButtonActive: {
    backgroundColor: colors.accent,
  },
  tabContainer: {
    marginTop: spacing.xs,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    marginRight: spacing.sm,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.text.inverse,
  },
  scrollView: {
    flex: 1,
  },
  verticalContent: {
    padding: spacing.lg,
    paddingBottom: TAB_BAR_AREA_HEIGHT,
  },
  yearSection: {
    marginBottom: spacing.xl,
  },
  yearHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  yearBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  yearBadgeText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  yearLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border.light,
  },
  verticalEventItem: {
    marginBottom: spacing.lg,
  },
  verticalEventLine: {
    flexDirection: 'row',
  },
  verticalDotContainer: {
    alignItems: 'center',
    marginRight: spacing.md,
    paddingTop: spacing.md,
  },
  verticalDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: colors.background,
  },
  verticalConnector: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border.light,
    marginTop: spacing.xs,
  },
  verticalEventCard: {
    flex: 1,
  },
  verticalEventContent: {
    gap: spacing.sm,
  },
  verticalEventHeader: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  verticalEventInfo: {
    flex: 1,
  },
  verticalEventMeta: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },
  verticalEventLocation: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModal: {
    width: SCREEN_WIDTH * 0.8,
    maxHeight: SCREEN_WIDTH * 1.2,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  datePickerHeader: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  datePickerList: {
    maxHeight: SCREEN_WIDTH,
  },
  datePickerItem: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  datePickerItemText: {
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
  },
  columnsScroll: {
    flex: 1,
  },
  columnsContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: TAB_BAR_AREA_HEIGHT,
  },
  personColumn: {
    width: COLUMN_WIDTH,
    marginHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.accent,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent + '20',
  },
  personIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  personName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.inverse,
    flex: 1,
  },
  personEventCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.inverse,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  personEventsScroll: {
    flex: 1,
  },
  personEvents: {
    padding: spacing.md,
  },
  emptyColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyColumnText: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  eventItem: {
    marginBottom: spacing.lg,
  },
  eventLine: {
    flexDirection: 'row',
  },
  eventDotContainer: {
    alignItems: 'center',
    marginRight: spacing.sm,
    paddingTop: spacing.md,
  },
  eventDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  eventConnector: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border.light,
    marginTop: spacing.xs,
  },
  eventCardContainer: {
    flex: 1,
  },
  eventContent: {
    gap: spacing.sm,
  },
  eventYear: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  eventYearText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  eventIconBadge: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  eventIconText: {
    fontSize: 20,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  eventDate: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  eventDescription: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  horizontalContainer: {
    flex: 1,
  },
  personSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  personNavButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
  },
  personNavButtonDisabled: {
    opacity: 0.3,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  personSelectorText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  singlePersonScroll: {
    flex: 1,
  },
  singlePersonContent: {
    padding: spacing.lg,
    paddingBottom: TAB_BAR_AREA_HEIGHT,
  },
  singlePersonEventItem: {
    marginBottom: spacing.lg,
  },
  singlePersonEventLine: {
    flexDirection: 'row',
  },
  singlePersonDotContainer: {
    alignItems: 'center',
    marginRight: spacing.md,
    paddingTop: spacing.md,
  },
  singlePersonDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: colors.background,
  },
  singlePersonConnector: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border.light,
    marginTop: spacing.xs,
  },
  singlePersonEventCard: {
    flex: 1,
  },
  singlePersonEventContent: {
    gap: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyStateText: {
    fontSize: 15,
    color: colors.text.tertiary,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
