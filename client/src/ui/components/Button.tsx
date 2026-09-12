import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors, typography } from '../tokens';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'verified' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 2, // Official sharp rectangular aesthetic
      borderWidth: 1,
    };

    // Sizes
    if (size === 'sm') {
      base.paddingVertical = 6;
      base.paddingHorizontal = 12;
    } else if (size === 'lg') {
      base.paddingVertical = 12;
      base.paddingHorizontal = 24;
    } else {
      base.paddingVertical = 9;
      base.paddingHorizontal = 16;
    }

    // Variants
    switch (variant) {
      case 'primary':
        base.backgroundColor = colors.primary;
        base.borderColor = colors.primary;
        break;
      case 'verified':
        base.backgroundColor = colors.verified;
        base.borderColor = colors.verifiedDark;
        break;
      case 'danger':
        base.backgroundColor = colors.alert;
        base.borderColor = colors.alertDark;
        break;
      case 'secondary':
        base.backgroundColor = colors.surface;
        base.borderColor = colors.borderDark;
        break;
      case 'outline':
        base.backgroundColor = 'transparent';
        base.borderColor = colors.primary;
        break;
      case 'ghost':
        base.backgroundColor = 'transparent';
        base.borderColor = 'transparent';
        break;
    }

    if (disabled || loading) {
      base.opacity = 0.5;
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontFamily: typography.fontSans,
      fontWeight: '600',
      letterSpacing: 0.3,
    };

    if (size === 'sm') {
      base.fontSize = 12;
    } else if (size === 'lg') {
      base.fontSize = 15;
    } else {
      base.fontSize = 13;
    }

    switch (variant) {
      case 'primary':
      case 'verified':
      case 'danger':
        base.color = colors.textInverse;
        break;
      case 'secondary':
        base.color = colors.textPrimary;
        break;
      case 'outline':
        base.color = colors.primary;
        break;
      case 'ghost':
        base.color = colors.textSecondary;
        break;
    }

    return base;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[getContainerStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' || variant === 'outline' ? colors.primary : colors.textInverse}
        />
      ) : (
        <>
          {icon && <span style={{ marginRight: 6, display: 'inline-flex' }}>{icon}</span>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};
