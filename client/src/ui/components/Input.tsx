import React from 'react';
import { View, Text, TextInput, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { colors, typography } from '../tokens';

export interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  hint?: string;
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  monospace?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  hint,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  style,
  inputStyle,
  monospace = false,
  autoCapitalize,
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        value={value}
        autoCapitalize={autoCapitalize}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={numberOfLines}
        editable={editable}
        style={[
          styles.input,
          monospace && styles.monospaceInput,
          multiline && { height: 24 * (numberOfLines || 3), textAlignVertical: 'top' },
          !editable && styles.disabledInput,
          Boolean(error) && styles.errorInput,
          inputStyle,
        ]}
      />
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    fontFamily: typography.fontSans,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 38,
  },
  monospaceInput: {
    fontFamily: typography.fontMono,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  disabledInput: {
    backgroundColor: colors.backgroundSubdued,
    color: colors.textMuted,
  },
  errorInput: {
    borderColor: colors.alert,
    backgroundColor: colors.alertLight,
  },
  hint: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  error: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '600',
    color: colors.alert,
    marginTop: 4,
  },
});
