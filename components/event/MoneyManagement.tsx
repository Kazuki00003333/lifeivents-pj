import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { colors, spacing, borderRadius } from '@/lib/constants/colors';
import { eventService } from '@/lib/services/eventService';

const expenseCategoryOptions = [
  '会場費',
  '飲食費',
  '装飾・花',
  '衣装',
  '写真・映像',
  '引き出物',
  '招待状',
  'その他',
];

interface Expense {
  id: string;
  type: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export function ExpenseList({ expenses }: { expenses: Expense[] }) {
  return (
    <View style={styles.expenseList}>
      {expenses.map((expense) => (
        <Card key={expense.id} padding="md" variant="elevated">
          <View style={styles.expenseItem}>
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseCategory}>{expense.category || expense.type}</Text>
              {expense.description && (
                <Text style={styles.expenseDescription}>{expense.description}</Text>
              )}
              {expense.date && (
                <Text style={styles.expenseDate}>
                  {new Date(expense.date).toLocaleDateString('ja-JP')}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.expenseAmount,
                { color: expense.type === 'income' ? colors.status.success : colors.status.error },
              ]}
            >
              {expense.type === 'income' ? '+' : '-'}¥{Number(expense.amount).toLocaleString()}
            </Text>
          </View>
        </Card>
      ))}
    </View>
  );
}

export function AddExpenseModal({
  visible,
  onClose,
  onSuccess,
  eventId,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventId: string;
}) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount) return;

    setLoading(true);
    try {
      await eventService.addExpense({
        event_id: eventId,
        type,
        amount: parseInt(amount),
        category,
        description,
        date: new Date().toISOString().split('T')[0],
      });
      onSuccess();
      setType('expense');
      setCategory('');
      setAmount('');
      setDescription('');
    } catch (error) {
      console.error('Error adding expense:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>支出を追加</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>種類</Text>
            <View style={styles.typeButtons}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]}
                onPress={() => setType('expense')}
              >
                <Text style={[styles.typeButtonText, type === 'expense' && styles.typeButtonTextActive]}>
                  支出
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'income' && styles.typeButtonActive]}
                onPress={() => setType('income')}
              >
                <Text style={[styles.typeButtonText, type === 'income' && styles.typeButtonTextActive]}>
                  収入
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {type === 'expense' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>カテゴリ</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {expenseCategoryOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.chip, category === option && styles.chipActive]}
                    onPress={() => setCategory(option)}
                  >
                    <Text style={[styles.chipText, category === option && styles.chipTextActive]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>金額*</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="10000"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>詳細</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="詳細を入力"
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <Button
            title="追加"
            onPress={handleSubmit}
            disabled={!amount || loading}
            loading={loading}
            fullWidth
            size="large"
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  expenseList: {
    gap: spacing.md,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expenseInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  expenseDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.xs / 2,
  },
  expenseDate: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  modalFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  chipScroll: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.accent,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  chipTextActive: {
    color: colors.text.inverse,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.accent,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  typeButtonTextActive: {
    color: colors.text.inverse,
  },
});
