import { StyleSheet } from "react-native";

import { scaleFont } from "@/theme/utils";

import type { AppThemeColors } from "@/theme/types";

export const createLoadingStateStyles = (theme: AppThemeColors, fontScale: number) =>
    StyleSheet.create({
        container: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
        },
        message: {
            fontSize: scaleFont(15, fontScale),
            color: theme.textSecondary,
        },
    });
