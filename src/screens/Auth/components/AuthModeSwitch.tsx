import React from "react";
import { Text, TouchableOpacity } from "react-native";

import { createLoginScreenStyles } from "@/screens/Auth/LoginScreen.styles";
import { useThemedStyles } from "@/theme/useThemedStyles";

type AuthModeSwitchProps = {
    prompt: string;
    actionLabel: string;
    disabled: boolean;
    onToggle: () => void;
};

export function AuthModeSwitch({ prompt, actionLabel, disabled, onToggle }: AuthModeSwitchProps) {
    const styles = useThemedStyles(createLoginScreenStyles);
    return (
        <TouchableOpacity style={styles.modeSwitch} onPress={onToggle} disabled={disabled} activeOpacity={0.9}>
            <Text style={styles.modeSwitchText}>{prompt}</Text>
            <Text style={styles.modeSwitchAction}>{actionLabel}</Text>
        </TouchableOpacity>
    );
}
