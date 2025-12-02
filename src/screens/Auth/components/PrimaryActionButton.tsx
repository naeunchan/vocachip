import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { createLoginScreenStyles } from "@/screens/Auth/LoginScreen.styles";
import { useAppAppearance } from "@/theme/AppearanceContext";
import { useThemedStyles } from "@/theme/useThemedStyles";

type PrimaryActionButtonProps = {
    label: string;
    loading: boolean;
    disabled: boolean;
    onPress: () => void;
    mode: "login" | "signup";
};

export function PrimaryActionButton({ label, loading, disabled, onPress, mode }: PrimaryActionButtonProps) {
    const styles = useThemedStyles(createLoginScreenStyles);
    const { theme } = useAppAppearance();
    return (
        <TouchableOpacity
            style={[styles.button, disabled && styles.disabledButton]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ disabled }}
        >
            {loading ? (
                <View style={styles.buttonLoadingRow}>
                    <ActivityIndicator size="small" color={theme.accentContrast} />
                    <Text style={styles.buttonLoadingText}>{mode === "login" ? "로그인 중..." : "가입 중..."}</Text>
                </View>
            ) : (
                <Text style={styles.buttonText}>{label}</Text>
            )}
        </TouchableOpacity>
    );
}
