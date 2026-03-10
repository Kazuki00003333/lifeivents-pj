import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckSquare, Square, Plus, UserPlus, Share2, Sparkles, MessageCircle, Camera, ShoppingBag, ChevronRight } from 'lucide-react-native';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { colors, spacing, borderRadius } from '@/lib/constants/colors';
import { MIN_TOUCH_TARGET } from '@/lib/constants/layout';
import { eventService } from '@/lib/services/eventService';
import { GuestList, AddGuestModal } from '@/components/event/GuestManagement';
import { ExpenseList, AddExpenseModal } from '@/components/event/MoneyManagement';
import { TaskAssignmentModal, AssignmentBadge } from '@/components/event/TaskAssignment';
import { AISuggestModal } from '@/components/event/AISuggestModal';
import { suggestTasks, getAIUsage } from '@/lib/api/ai';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { mockEvents, mockTasks, mockGuests, mockExpenses } from '@/lib/services/mockData';

type TabType = 'overview' | 'tasks' | 'guests' | 'money' | 'notes';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<TabType>('overview');
  const [event, setEvent] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedTaskForAssignment, setSelectedTaskForAssignment] = useState<any>(null);
  const [showAISuggestModal, setShowAISuggestModal] = useState(false);
  const [aiSuggestLoading, setAiSuggestLoading] = useState(false);
  const [aiSuggestError, setAiSuggestError] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<{ title: string; description?: string; phase?: string; due_date?: string }[]>([]);
  const [aiUsage, setAiUsage] = useState<{ used: number; limit: number } | null>(null);

  useEffect(() => {
    if (id) {
      fetchEventData();
    }
  }, [id]);

  const fetchEventData = async () => {
    try {
      setLoading(true);

      const mockEvent = mockEvents.find(e => e.id === id);
      if (mockEvent) {
        setEvent(mockEvent);
        setTasks(mockTasks[id as string] || []);
        setGuests(mockGuests[id as string] || []);
        setExpenses(mockExpenses[id as string] || []);
        setLoading(false);
        return;
      }

      const eventData = await eventService.getEvent(id as string);
      setEvent(eventData);
      logger.info('イベント詳細を表示', { eventId: id, eventName: eventData?.name });

      const [tasksData, guestsData, expensesData] = await Promise.all([
        eventService.getEventTasks(id as string),
        eventService.getEventGuests(id as string),
        eventService.getEventExpenses(id as string),
      ]);

      setTasks(tasksData);
      setGuests(guestsData);
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error fetching event data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    try {
      const mockTask = tasks.find(t => t.id === taskId);
      if (mockTask) {
        setTasks(tasks.map(t =>
          t.id === taskId ? { ...t, is_completed: !completed } : t
        ));
        return;
      }

      await eventService.updateTask(taskId, { is_completed: !completed });
      fetchEventData();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleAssignTask = (taskId: string, assignee: string) => {
    const mockTask = tasks.find(t => t.id === taskId);
    if (mockTask) {
      setTasks(tasks.map(t =>
        t.id === taskId ? { ...t, assigned_to: assignee } : t
      ));
    }
  };

  const openAssignmentModal = (task: any) => {
    setSelectedTaskForAssignment(task);
    setShowAssignmentModal(true);
  };

  const openAISuggest = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setAiSuggestError('AI機能を使うにはログインしてください。');
      setAiSuggestions([]);
      setShowAISuggestModal(true);
      return;
    }
    setShowAISuggestModal(true);
    setAiSuggestError(null);
    setAiSuggestions([]);
    setAiSuggestLoading(true);
    const usage = await getAIUsage(session.access_token);
    if (usage) setAiUsage({ used: usage.used, limit: usage.limit });

    const eventName = event?.name ?? '';
    const eventType = event?.event_type ?? event?.type;
    const eventDate = event?.event_date ?? event?.date;
    const res = await suggestTasks(session.access_token, {
      eventId: id as string,
      eventName,
      eventType,
      eventDate: eventDate ? new Date(eventDate).toISOString().slice(0, 10) : undefined,
    });

    setAiSuggestLoading(false);
    if (res.ok) {
      logger.info('AIタスク提案を取得', { eventId: id, count: res.suggestions.length });
      setAiSuggestions(res.suggestions);
      if (usage) setAiUsage({ used: res.used, limit: res.limit });
    } else {
      if (res.reason === 'daily_limit_reached') {
        setAiSuggestError(`本日のAI利用上限（${res.limit}回）に達しました。明日またお試しください。`);
      } else if (res.reason === 'invalid_token' || res.reason === 'missing_token') {
        setAiSuggestError('ログインの有効期限が切れました。再度ログインしてください。');
      } else {
        setAiSuggestError(res.error ?? 'タスクの取得に失敗しました。');
      }
    }
  };

  const handleAddAITasks = async (tasksToAdd: { title: string; description?: string; phase?: string; due_date?: string }[]) => {
    if (!id || tasksToAdd.length === 0) return;
    const mockEvent = mockEvents.find((e) => e.id === id);
    if (mockEvent) {
      const newTasks = tasksToAdd.map((t, i) => ({
        id: `ai-${Date.now()}-${i}`,
        title: t.title,
        description: t.description ?? null,
        phase: t.phase ?? 'その他',
        due_date: t.due_date ?? null,
        is_completed: false,
        assigned_to: null,
      }));
      setTasks((prev) => [...prev, ...newTasks]);
      setShowAISuggestModal(false);
      return;
    }
    try {
      await eventService.createTasks(id as string, tasksToAdd);
      fetchEventData();
      setShowAISuggestModal(false);
    } catch (e) {
      setAiSuggestError(e instanceof Error ? e.message : 'タスクの追加に失敗しました。');
    }
  };

  const getDaysUntil = () => {
    if (!event?.event_date) return 0;
    const eventDate = new Date(event.event_date);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getContextualServices = (): { id: string; title: string; url: string; Icon: typeof Camera }[] => {
    const name = (event?.name ?? '') + (event?.event_type ?? '');
    const base = 'https://example.com';
    if (/七五三|七五三の/.test(name)) {
      return [
        { id: 'photo', title: '写真館を探す', url: `${base}/photo-studio`, Icon: Camera },
        { id: 'kimono', title: 'レンタル衣装を探す', url: `${base}/kimono-rental`, Icon: ShoppingBag },
      ];
    }
    if (/結婚|ウェディング|式/.test(name)) {
      return [
        { id: 'venue', title: '式場を探す', url: `${base}/wedding-venue`, Icon: Camera },
        { id: 'dress', title: 'ドレス・衣装を探す', url: `${base}/dress-rental`, Icon: ShoppingBag },
      ];
    }
    if (/葬儀|葬式|お葬式/.test(name)) {
      return [
        { id: 'mourning', title: '喪服レンタル', url: `${base}/mourning-wear`, Icon: ShoppingBag },
        { id: 'hall', title: '葬儀場を探す', url: `${base}/funeral-hall`, Icon: Camera },
      ];
    }
    return [
      { id: 'photo', title: '写真館を探す', url: `${base}/photo-studio`, Icon: Camera },
      { id: 'rental', title: '衣装レンタルを探す', url: `${base}/rental`, Icon: ShoppingBag },
    ];
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.is_completed).length;
    return { total, completed, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  const getMoneyStats = () => {
    const income = expenses
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const expense = expenses
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const giftTotal = guests
      .reduce((sum, g) => sum + (Number(g.gift_amount) || 0), 0);
    return { income: income + giftTotal, expense, balance: income + giftTotal - expense };
  };

  const groupedTasks = tasks.reduce((acc, task) => {
    const phase = task.phase || 'その他';
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(task);
    return acc;
  }, {} as Record<string, any[]>);

  const tabs = [
    { id: 'overview', label: '概要' },
    { id: 'tasks', label: 'タスク' },
    { id: 'guests', label: 'ゲスト' },
    { id: 'money', label: 'お金' },
    { id: 'notes', label: 'メモ' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>イベントが見つかりません</Text>
          <Button title="戻る" onPress={() => router.back()} />
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
        <TouchableOpacity
          onPress={() => router.push(`/event/${id}/share`)}
          style={styles.shareButton}
        >
          <Share2 size={22} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.eventHeader}>
        <View style={[styles.colorBar, { backgroundColor: event.color || colors.accent }]} />
        <View style={styles.eventTitleRow}>
          <Text style={styles.eventName}>{event.name}</Text>
          {event.event_for && (
            <View style={styles.eventForBadge}>
              <Text style={styles.eventForText}>{event.event_for}</Text>
            </View>
          )}
        </View>
        {event.event_date && (
          <>
            <Text style={styles.eventDate}>
              {new Date(event.event_date).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <View style={styles.countdown}>
              <Text style={styles.countdownText}>あと {getDaysUntil()} 日</Text>
            </View>
          </>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              selectedTab === tab.id && styles.tabActive,
            ]}
            onPress={() => setSelectedTab(tab.id as TabType)}
          >
            <Text
              style={[
                styles.tabLabel,
                selectedTab === tab.id && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {selectedTab === 'overview' && (
          <View style={styles.tabContent}>
            <Card padding="lg" variant="elevated">
              <Text style={styles.cardTitle}>進捗状況</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${getTaskStats().percentage}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {getTaskStats().completed} / {getTaskStats().total} タスク完了
              </Text>
            </Card>

            <Card padding="lg" variant="elevated">
              <Text style={styles.cardTitle}>ゲスト状況</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{guests.length}</Text>
                  <Text style={styles.statLabel}>招待数</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {guests.filter(g => g.attendance_status === 'attending').length}
                  </Text>
                  <Text style={styles.statLabel}>出席</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {guests.filter(g => g.attendance_status === 'declined').length}
                  </Text>
                  <Text style={styles.statLabel}>欠席</Text>
                </View>
              </View>
            </Card>

            <Card padding="lg" variant="elevated">
              <Text style={styles.cardTitle}>収支状況</Text>
              <View style={styles.moneyRow}>
                <View style={styles.moneyItem}>
                  <Text style={styles.moneyLabel}>収入</Text>
                  <Text style={[styles.moneyValue, { color: colors.status.success }]}>
                    ¥{getMoneyStats().income.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.moneyItem}>
                  <Text style={styles.moneyLabel}>支出</Text>
                  <Text style={[styles.moneyValue, { color: colors.status.error }]}>
                    ¥{getMoneyStats().expense.toLocaleString()}
                  </Text>
                </View>
              </View>
              <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>収支</Text>
                <Text style={[
                  styles.balanceValue,
                  { color: getMoneyStats().balance >= 0 ? colors.status.success : colors.status.error }
                ]}>
                  ¥{getMoneyStats().balance.toLocaleString()}
                </Text>
              </View>
            </Card>

            <TouchableOpacity
              style={styles.shareCtaCard}
              onPress={() => router.push(`/event/${id}/share`)}
            >
              <MessageCircle size={24} color={colors.accent} />
              <View style={styles.shareCtaText}>
                <Text style={styles.shareCtaTitle}>家族・パートナーと共有</Text>
                <Text style={styles.shareCtaSubtitle}>URLをポチッと送るだけで、LINEで共有できます</Text>
              </View>
              <ChevronRight size={20} color={colors.text.tertiary} />
            </TouchableOpacity>

            <View style={styles.contextualCtaSection}>
              <Text style={styles.contextualCtaTitle}>このイベントに役立つサービス</Text>
              <View style={styles.contextualCtaRow}>
                {getContextualServices().map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.contextualCtaButton}
                    onPress={() => s.url && Linking.openURL(s.url)}
                  >
                    <s.Icon size={20} color={colors.accent} />
                    <Text style={styles.contextualCtaLabel}>{s.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {selectedTab === 'tasks' && (
          <View style={styles.tabContent}>
            <View style={styles.contextualCtaSection}>
              <Text style={styles.contextualCtaTitle}>このイベントに役立つサービス</Text>
              <View style={styles.contextualCtaRow}>
                {getContextualServices().map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.contextualCtaButton}
                    onPress={() => s.url && Linking.openURL(s.url)}
                  >
                    <s.Icon size={20} color={colors.accent} />
                    <Text style={styles.contextualCtaLabel}>{s.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {Object.keys(groupedTasks).length === 0 ? (
              <Card padding="lg">
                <Text style={styles.emptyText}>タスクがありません</Text>
              </Card>
            ) : (
              Object.entries(groupedTasks).map(([phase, phaseTasks]) => (
                <View key={phase} style={styles.phaseSection}>
                  <Text style={styles.phaseTitle}>{phase}</Text>
                  {phaseTasks.map((task: any) => (
                    <Card key={task.id} padding="md" variant="elevated">
                      <View style={styles.taskItem}>
                        <TouchableOpacity
                          style={styles.taskMainContent}
                          onPress={() => handleTaskToggle(task.id, task.is_completed)}
                        >
                          <View style={styles.taskCheckbox}>
                            {task.is_completed ? (
                              <CheckSquare size={24} color={colors.accent} />
                            ) : (
                              <Square size={24} color={colors.text.tertiary} />
                            )}
                          </View>
                          <View style={styles.taskContent}>
                            <Text style={[
                              styles.taskTitle,
                              task.is_completed && styles.taskTitleCompleted
                            ]}>
                              {task.title}
                            </Text>
                            {task.description && (
                              <Text style={styles.taskDescription}>{task.description}</Text>
                            )}
                            <View style={styles.taskMeta}>
                              {task.due_date && (
                                <Text style={styles.taskDueDate}>
                                  期限: {new Date(task.due_date).toLocaleDateString('ja-JP')}
                                </Text>
                              )}
                              {task.assigned_to && (
                                <AssignmentBadge
                                  assignee={task.assigned_to}
                                  onPress={() => openAssignmentModal(task)}
                                />
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                        {!task.assigned_to && (
                          <TouchableOpacity
                            style={styles.assignButton}
                            onPress={() => openAssignmentModal(task)}
                          >
                            <UserPlus size={20} color={colors.accent} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </Card>
                  ))}
                </View>
              ))
            )}
            <TouchableOpacity style={styles.aiSuggestButton} onPress={openAISuggest}>
              <Sparkles size={20} color={colors.accent} />
              <Text style={styles.aiSuggestButtonText}>AIでタスクを提案</Text>
              {aiUsage != null && (
                <Text style={styles.aiSuggestUsage}>
                  本日あと{Math.max(0, aiUsage.limit - aiUsage.used)}回
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {selectedTab === 'guests' && (
          <View style={styles.tabContent}>
            {guests.length === 0 ? (
              <Card padding="lg">
                <Text style={styles.emptyText}>ゲストが登録されていません</Text>
              </Card>
            ) : (
              <GuestList guests={guests} onRefresh={fetchEventData} />
            )}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddGuestModal(true)}
            >
              <Plus size={20} color={colors.text.inverse} />
              <Text style={styles.addButtonText}>ゲストを追加</Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedTab === 'money' && (
          <View style={styles.tabContent}>
            <Card padding="lg" variant="elevated">
              <Text style={styles.cardTitle}>収支サマリー</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>収入合計</Text>
                <Text style={[styles.summaryValue, { color: colors.status.success }]}>
                  ¥{getMoneyStats().income.toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>支出合計</Text>
                <Text style={[styles.summaryValue, { color: colors.status.error }]}>
                  ¥{getMoneyStats().expense.toLocaleString()}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.summaryLabelBold}>収支</Text>
                <Text style={[
                  styles.summaryValueBold,
                  { color: getMoneyStats().balance >= 0 ? colors.status.success : colors.status.error }
                ]}>
                  ¥{getMoneyStats().balance.toLocaleString()}
                </Text>
              </View>
            </Card>

            {expenses.length === 0 ? (
              <Card padding="lg">
                <Text style={styles.emptyText}>支出記録がありません</Text>
              </Card>
            ) : (
              <ExpenseList expenses={expenses} />
            )}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddExpenseModal(true)}
            >
              <Plus size={20} color={colors.text.inverse} />
              <Text style={styles.addButtonText}>支出を追加</Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedTab === 'notes' && (
          <View style={styles.tabContent}>
            <Card padding="lg">
              <Text style={styles.emptyText}>メモ機能（実装予定）</Text>
            </Card>
          </View>
        )}
      </ScrollView>

      <AddGuestModal
        visible={showAddGuestModal}
        onClose={() => setShowAddGuestModal(false)}
        onSuccess={() => {
          setShowAddGuestModal(false);
          fetchEventData();
        }}
        eventId={id as string}
      />

      <AddExpenseModal
        visible={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        onSuccess={() => {
          setShowAddExpenseModal(false);
          fetchEventData();
        }}
        eventId={id as string}
      />

      <TaskAssignmentModal
        visible={showAssignmentModal}
        onClose={() => {
          setShowAssignmentModal(false);
          setSelectedTaskForAssignment(null);
        }}
        onAssign={(assignee) => {
          if (selectedTaskForAssignment) {
            handleAssignTask(selectedTaskForAssignment.id, assignee);
          }
          setShowAssignmentModal(false);
          setSelectedTaskForAssignment(null);
        }}
        guests={guests}
        currentAssignee={selectedTaskForAssignment?.assigned_to}
      />

      <AISuggestModal
        visible={showAISuggestModal}
        onClose={() => {
          setShowAISuggestModal(false);
          setAiSuggestError(null);
          setAiSuggestions([]);
        }}
        loading={aiSuggestLoading}
        error={aiSuggestError}
        suggestions={aiSuggestions}
        onAddTasks={handleAddAITasks}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing.sm,
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    padding: spacing.sm,
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventHeader: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    position: 'relative',
  },
  colorBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
  },
  eventName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
  },
  eventForBadge: {
    backgroundColor: colors.accent + '20',
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  eventForText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    lineHeight: 18,
  },
  eventDate: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  countdown: {
    backgroundColor: colors.accent + '20',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  countdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  tabsContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tabsContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minWidth: 80,
  },
  tabActive: {
    borderBottomColor: colors.accent,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: colors.accent,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  tabContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 0,
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  progressText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  miniTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  miniTaskText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  phaseSection: {
    marginBottom: spacing.sm,
  },
  phaseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  taskMainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  taskCheckbox: {
    marginRight: spacing.md,
    paddingTop: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.text.tertiary,
  },
  taskDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },
  taskDueDate: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  assignButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  emptyText: {
    fontSize: 15,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  moneyRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  moneyItem: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  moneyLabel: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  moneyValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  balanceContainer: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  shareCtaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.accent + '12',
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent + '30',
    gap: spacing.md,
  },
  shareCtaText: { flex: 1 },
  shareCtaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  shareCtaSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  contextualCtaSection: {
    marginTop: spacing.lg,
  },
  contextualCtaTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  contextualCtaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  contextualCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  contextualCtaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  aiSuggestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.accent + '18',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.accent + '40',
    minHeight: MIN_TOUCH_TARGET,
  },
  aiSuggestButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent,
  },
  aiSuggestUsage: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.inverse,
    marginLeft: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  summaryTotal: {
    borderTopWidth: 2,
    borderTopColor: colors.border.medium,
    borderBottomWidth: 0,
    paddingTop: spacing.md,
  },
  summaryLabel: {
    fontSize: 15,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  summaryLabelBold: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  summaryValueBold: {
    fontSize: 18,
    fontWeight: '700',
  },
});
