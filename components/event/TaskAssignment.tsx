import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable,
} from 'react-native';
import { X, UserPlus, User } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '@/lib/constants/colors';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';

interface TaskAssignmentModalProps {
  visible: boolean;
  onClose: () => void;
  onAssign: (assignee: string) => void;
  guests: Array<{ id: string; name: string }>;
  currentAssignee?: string;
}

export function TaskAssignmentModal({
  visible,
  onClose,
  onAssign,
  guests,
  currentAssignee,
}: TaskAssignmentModalProps) {
  const [customName, setCustomName] = useState('');
  const [selectedMode, setSelectedMode] = useState<'guest' | 'custom'>('guest');

  const handleAssign = () => {
    if (selectedMode === 'custom' && customName.trim()) {
      onAssign(customName.trim());
      setCustomName('');
      onClose();
    }
  };

  const handleGuestSelect = (guestName: string) => {
    onAssign(guestName);
    onClose();
  };

  const handleUnassign = () => {
    onAssign('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>タスクをアサイン</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {currentAssignee && (
            <View style={styles.currentAssignee}>
              <Text style={styles.currentAssigneeLabel}>現在のアサイン先:</Text>
              <View style={styles.currentAssigneeValue}>
                <User size={16} color={colors.text.primary} />
                <Text style={styles.currentAssigneeName}>{currentAssignee}</Text>
              </View>
              <TouchableOpacity onPress={handleUnassign}>
                <Text style={styles.unassignButton}>アサイン解除</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                selectedMode === 'guest' && styles.modeButtonActive,
              ]}
              onPress={() => setSelectedMode('guest')}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  selectedMode === 'guest' && styles.modeButtonTextActive,
                ]}
              >
                ゲストから選択
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                selectedMode === 'custom' && styles.modeButtonActive,
              ]}
              onPress={() => setSelectedMode('custom')}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  selectedMode === 'custom' && styles.modeButtonTextActive,
                ]}
              >
                名前を入力
              </Text>
            </TouchableOpacity>
          </View>

          {selectedMode === 'guest' ? (
            <ScrollView style={styles.guestList} showsVerticalScrollIndicator={false}>
              {guests.length === 0 ? (
                <Text style={styles.emptyText}>ゲストが登録されていません</Text>
              ) : (
                guests.map((guest) => (
                  <TouchableOpacity
                    key={guest.id}
                    style={styles.guestItem}
                    onPress={() => handleGuestSelect(guest.name)}
                  >
                    <User size={20} color={colors.text.secondary} />
                    <Text style={styles.guestName}>{guest.name}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          ) : (
            <View style={styles.customInput}>
              <Text style={styles.inputLabel}>担当者名</Text>
              <TextInput
                style={styles.input}
                placeholder="名前を入力..."
                value={customName}
                onChangeText={setCustomName}
                autoFocus
              />
              <Button
                title="アサインする"
                onPress={handleAssign}
                disabled={!customName.trim()}
              />
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface AssignmentBadgeProps {
  assignee: string;
  onPress?: () => void;
}

export function AssignmentBadge({ assignee, onPress }: AssignmentBadgeProps) {
  if (!assignee) return null;

  return (
    <TouchableOpacity onPress={onPress} style={styles.assignmentBadge}>
      <User size={12} color={colors.accent} />
      <Text style={styles.assignmentText}>{assignee}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
    paddingBottom: spacing.xl,
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
  currentAssignee: {
    padding: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    margin: spacing.lg,
    borderRadius: borderRadius.md,
  },
  currentAssigneeLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  currentAssigneeValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  currentAssigneeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  unassignButton: {
    fontSize: 14,
    color: colors.status.error,
    fontWeight: '600',
  },
  modeSelector: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  modeButtonTextActive: {
    color: colors.text.inverse,
  },
  guestList: {
    maxHeight: 300,
    paddingHorizontal: spacing.lg,
  },
  guestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  guestName: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 15,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  customInput: {
    padding: spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  assignmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '15',
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.xs / 2,
  },
  assignmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
});
