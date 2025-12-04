import { StyleSheet } from "react-native";

import { scaleFont } from "@/theme/utils";

import type { AppThemeColors } from "@/theme/types";

export const createVersionBadgeStyles = (theme: AppThemeColors, fontScale: number) =>
    StyleSheet.create({
        container: {
            alignSelf: "flex-end",
            backgroundColor: theme.cardMuted,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            margin: 12,
        },
        label: {
            fontSize: scaleFont(12, fontScale),
            color: theme.textSecondary,
            fontWeight: "600",
        },
    });
