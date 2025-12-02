import React from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { createLoadingStateStyles } from "@/components/LoadingState/LoadingState.styles";
import { LoadingStateProps } from "@/components/LoadingState/LoadingState.types";
import { useAppAppearance } from "@/theme/AppearanceContext";
import { useThemedStyles } from "@/theme/useThemedStyles";

export function LoadingState({ message }: LoadingStateProps) {
    const styles = useThemedStyles(createLoadingStateStyles);
    const { theme } = useAppAppearance();
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={styles.message}>{message}</Text>
        </View>
    );
}
