import { StyleSheet } from "react-native";

import type { AppThemeColors } from "@/theme/types";

export const createAppScreenStyles = (theme: AppThemeColors) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        content: {
            flex: 1,
        },
    });
