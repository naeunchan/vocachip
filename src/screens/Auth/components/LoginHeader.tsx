import React from "react";
import { Text, View } from "react-native";

import { createLoginScreenStyles } from "@/screens/Auth/LoginScreen.styles";
import { useThemedStyles } from "@/theme/useThemedStyles";

type LoginHeaderProps = {
    title: string;
    subtitle: string;
};

export function LoginHeader({ title, subtitle }: LoginHeaderProps) {
    const styles = useThemedStyles(createLoginScreenStyles);
    return (
        <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
    );
}
