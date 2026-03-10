import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '@/lib/constants/colors';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium';
}

export function Badge({ label, variant = 'default', size = 'medium' }: BadgeProps) {
  const badgeStyle = [
    styles.badge,
    styles[variant],
    styles[`size_${size}`],
  ];

  const textStyle = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
  ];

  return (
    <View style={badgeStyle}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  default: {
    backgroundColor: colors.surfaceSecondary,
  },
  success: {
    backgroundColor: colors.status.success + '20',
  },
  warning: {
    backgroundColor: colors.status.warning + '20',
  },
  error: {
    backgroundColor: colors.status.error + '20',
  },
  info: {
    backgroundColor: colors.status.info + '20',
  },
  size_small: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  size_medium: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  text: {
    fontWeight: '600',
  },
  text_default: {
    color: colors.text.secondary,
  },
  text_success: {
    color: colors.status.success,
  },
  text_warning: {
    color: colors.status.warning,
  },
  text_error: {
    color: colors.status.error,
  },
  text_info: {
    color: colors.status.info,
  },
  textSize_small: {
    fontSize: 12,
  },
  textSize_medium: {
    fontSize: 14,
  },
});
