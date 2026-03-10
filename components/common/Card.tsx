import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '@/lib/constants/colors';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'flat';
  padding?: keyof typeof spacing;
}

export function Card({
  children,
  onPress,
  variant = 'elevated',
  padding = 'md',
}: CardProps) {
  const cardStyle = [
    styles.card,
    styles[variant],
    { padding: spacing[padding] },
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  elevated: {
    ...shadows.md,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  flat: {
    backgroundColor: colors.surfaceSecondary,
  },
});
