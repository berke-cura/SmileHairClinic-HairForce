import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Colors from '@/src/constants/Colors';

export type ThemedCardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
};

export function ThemedCard({ children, style, variant = 'default' }: ThemedCardProps) {
  const colors = Colors.light;

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 20,
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        };
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: colors.border,
        };
      default:
        return {
          ...baseStyle,
          borderWidth: 0, // Koyu temada kenarlığa gerek yok
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        };
    }
  };

  return <View style={[getCardStyle(), style]}>{children}</View>;
}

