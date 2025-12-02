import React from "react";
import { Text, View } from "react-native";

import { createVersionBadgeStyles } from "@/components/VersionBadge/VersionBadge.styles";
import { VersionBadgeProps } from "@/components/VersionBadge/VersionBadge.types";
import { useThemedStyles } from "@/theme/useThemedStyles";

export function VersionBadge({ label }: VersionBadgeProps) {
    const styles = useThemedStyles(createVersionBadgeStyles);
    return (
        <View style={styles.container}>
            <Text style={styles.label}>버전 {label}</Text>
        </View>
    );
}
