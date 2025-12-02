import { StyleSheet } from "react-native";

import type { AppThemeColors } from "@/theme/types";

export const createHomeScreenStyles = (theme: AppThemeColors) =>
    StyleSheet.create({
        safeArea: {
            flex: 1,
            backgroundColor: theme.background,
        },
        scrollContent: {
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 40,
            gap: 20,
        },
    });
