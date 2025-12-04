import { StyleSheet } from "react-native";

import { scaleFont } from "@/theme/utils";

import type { AppThemeColors } from "@/theme/types";

export const createTabStyles = (theme: AppThemeColors, fontScale: number) =>
    StyleSheet.create({
        tabBar: {
            height: 68,
            paddingBottom: 10,
            paddingTop: 8,
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
        },
        tabLabel: {
            fontSize: scaleFont(12, fontScale),
            fontWeight: "600",
        },
    });
