import React from "react";
import { Switch, Text, View } from "react-native";

import { createLoginScreenStyles } from "@/screens/Auth/LoginScreen.styles";
import { useAppAppearance } from "@/theme/AppearanceContext";
import { useThemedStyles } from "@/theme/useThemedStyles";

type RememberMeToggleProps = {
    value: boolean;
    disabled?: boolean;
    onChange: (value: boolean) => void;
};

export function RememberMeToggle({ value, disabled = false, onChange }: RememberMeToggleProps) {
    const styles = useThemedStyles(createLoginScreenStyles);
    const { theme } = useAppAppearance();
    return (
        <View style={styles.rememberRow}>
            <Text style={styles.rememberLabel}>자동 로그인</Text>
            <Switch
                value={value}
                onValueChange={onChange}
                disabled={disabled}
                trackColor={{ false: theme.inputBorder, true: theme.accentSoft }}
                thumbColor={value ? theme.accent : theme.inputBackground}
                ios_backgroundColor={theme.inputBorder}
            />
        </View>
    );
}
