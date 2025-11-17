import React, { useState } from 'react';
import { TextInput, TextInputProps, StyleSheet, View, Text, ViewStyle, TextStyle } from 'react-native';
import Colors from '@/src/constants/Colors';

export type ThemedInputProps = TextInputProps & {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
};

export function ThemedInput({
  label,
  error,
  containerStyle,
  inputStyle,
  ...textInputProps
}: ThemedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const colors = Colors.light;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        {...textInputProps}
        style={[
          styles.input,
          isFocused && { borderColor: colors.primary },
          error && { borderColor: colors.error },
          inputStyle,
        ]}
        placeholderTextColor={colors.placeholder}
        onFocus={(e) => {
          setIsFocused(true);
          textInputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          textInputProps.onBlur?.(e);
        }}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
    minHeight: 52,
  },
  errorText: {
    fontSize: 14,
    color: Colors.light.error,
    marginTop: 4,
  },
});

