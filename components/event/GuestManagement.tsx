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
import { X, Plus } from 'lucide-react-native';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { colors, spacing, borderRadius } from '@/lib/constants/colors';
import { eventService } from '@/lib/services/eventService';

const relationshipOptions = ['家族', '親族', '友人', '同僚', '上司', '取引先', 'その他'];

const attendanceStatusLabels = {
  pending: '未確認',
  attending: '出席',
  declined: '欠席',
};

interface Guest {
  id: string;
  name: string;
  relationship: string;
  attendance_status: string;
  gift_amount: number;
  notes: string;
}

export function GuestList({ guests, onRefresh }: { guests: Guest[]; onRefresh: () => void }) {
  return (
    <View style={styles.guestList}>
      {guests.map((guest) => (
        <Card key={guest.id} padding="md" variant="elevated">
          <View style={styles.guestItem}>
            <View style={styles.guestInfo}>
              <Text style={styles.guestName}>{guest.name}</Text>
              <Text style={styles.guestRelationship}>{guest.relationship}</Text>
              <View style={styles.guestDetails}>
                <Text style={styles.guestStatus}>
                  {attendanceStatusLabels[guest.attendance_status as keyof typeof attendanceStatusLabels]}
                </Text>
                {guest.gift_amount > 0 && (
                  <Text style={styles.guestAmount}>
                    ¥{Number(guest.gift_amount).toLocaleString()}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}

export function AddGuestModal({
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
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('pending');
  const [giftAmount, setGiftAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name) return;

    setLoading(true);
    try {
      await eventService.addGuest({
        event_id: eventId,
        name,
        relationship,
        attendance_status: attendanceStatus,
        gift_amount: giftAmount ? parseInt(giftAmount) : 0,
        notes,
      });
      onSuccess();
      setName('');
      setRelationship('');
      setAttendanceStatus('pending');
      setGiftAmount('');
      setNotes('');
    } catch (error) {
      console.error('Error adding guest:', error);
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
          <Text style={styles.modalTitle}>ゲストを追加</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>名前*</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="山田太郎"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>続柄</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {relationshipOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.chip, relationship === option && styles.chipActive]}
                  onPress={() => setRelationship(option)}
                >
                  <Text style={[styles.chipText, relationship === option && styles.chipTextActive]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>出欠状況</Text>
            <View style={styles.statusButtons}>
              {Object.entries(attendanceStatusLabels).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.statusButton,
                    attendanceStatus === key && styles.statusButtonActive,
                  ]}
                  onPress={() => setAttendanceStatus(key)}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      attendanceStatus === key && styles.statusButtonTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>祝儀/香典額</Text>
            <TextInput
              style={styles.input}
              value={giftAmount}
              onChangeText={setGiftAmount}
              placeholder="30000"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>メモ</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="メモを入力"
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <Button
            title="追加"
            onPress={handleSubmit}
            disabled={!name || loading}
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
  guestList: {
    gap: spacing.md,
  },
  guestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  guestRelationship: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  guestDetails: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  guestStatus: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  guestAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
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
  statusButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: colors.accent,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  statusButtonTextActive: {
    color: colors.text.inverse,
  },
});
