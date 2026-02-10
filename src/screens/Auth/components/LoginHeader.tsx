import React from "react";
import { Text, View } from "react-native";

import { createLoginScreenStyles } from "@/screens/Auth/LoginScreen.styles";
import { useThemedStyles } from "@/theme/useThemedStyles";

type LoginHeaderProps = {
    title: string;
    subtitle?: string;
};

export function LoginHeader({ title, subtitle }: LoginHeaderProps) {
    const styles = useThemedStyles(createLoginScreenStyles);
    return (
        <View style={styles.hero}>
            <Text style={styles.brandText}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
    );
}
