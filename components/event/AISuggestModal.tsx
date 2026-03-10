import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { X, CheckSquare, Square, Sparkles } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '@/lib/constants/colors';
import { Button } from '@/components/common/Button';
import type { AISuggestion } from '@/lib/api/ai';
import { MIN_TOUCH_TARGET } from '@/lib/constants/layout';

export type AISuggestModalProps = {
  visible: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  suggestions: AISuggestion[];
  onAddTasks: (tasks: AISuggestion[]) => void;
};

export function AISuggestModal({
  visible,
  onClose,
  loading,
  error,
  suggestions,
  onAddTasks,
}: AISuggestModalProps) {
  const [selected, setSelected] = useState<boolean[]>([]);

  useEffect(() => {
    if (suggestions.length > 0) {
      setSelected(suggestions.map(() => true));
    }
  }, [suggestions]);

  const toggle = (index: number) => {
    setSelected((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const addAll = () => {
    onAddTasks(suggestions);
    onClose();
  };

  const addSelected = () => {
    const toAdd = suggestions.filter((_, i) => selected[i]);
    if (toAdd.length > 0) {
      onAddTasks(toAdd);
      onClose();
    }
  };

  const selectedCount = selected.filter(Boolean).length;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Sparkles size={22} color={colors.accent} />
              <Text style={styles.title}>AIでタスクを提案</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.loadingText}>タスクを考えています…</Text>
            </View>
          )}

          {error && !loading && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Button title="閉じる" onPress={onClose} variant="secondary" />
            </View>
          )}

          {!loading && !error && suggestions.length > 0 && (
            <>
              <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                {suggestions.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.row}
                    onPress={() => toggle(i)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.checkbox}>
                      {selected[i] ? (
                        <CheckSquare size={22} color={colors.accent} />
                      ) : (
                        <Square size={22} color={colors.text.tertiary} />
                      )}
                    </View>
                    <View style={styles.rowBody}>
                      <Text style={styles.taskTitle}>{s.title}</Text>
                      {s.description ? (
                        <Text style={styles.taskDesc} numberOfLines={2}>{s.description}</Text>
                      ) : null}
                      {(s.phase || s.due_date) && (
                        <Text style={styles.taskMeta}>
                          {[s.phase, s.due_date].filter(Boolean).join(' · ')}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.footer}>
                <Button
                  title="全部追加"
                  onPress={addAll}
                  variant="primary"
                  style={styles.footerBtn}
                />
                <Button
                  title={`選んだものを追加（${selectedCount}件）`}
                  onPress={addSelected}
                  variant="secondary"
                  style={styles.footerBtn}
                  disabled={selectedCount === 0}
                />
              </View>
            </>
          )}

          {!loading && !error && suggestions.length === 0 && !loading && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>提案がありません</Text>
              <Button title="閉じる" onPress={onClose} variant="secondary" />
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  closeBtn: {
    padding: spacing.sm,
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 15,
    color: colors.text.secondary,
  },
  errorBox: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  errorText: {
    fontSize: 15,
    color: colors.status.error,
    textAlign: 'center',
  },
  list: {
    maxHeight: 320,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  checkbox: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  rowBody: { flex: 1; minWidth: 0; },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  taskDesc: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  taskMeta: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  footerBtn: {
    minHeight: 48,
  },
  empty: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 15,
    color: colors.text.secondary,
  },
});
