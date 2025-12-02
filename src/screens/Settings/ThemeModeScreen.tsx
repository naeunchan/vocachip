import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { createStyles } from "@/screens/Settings/SettingsScreen.styles";
import { THEME_MODE_OPTIONS } from "@/theme/constants";
import { ThemeMode } from "@/theme/types";
import { useThemedStyles } from "@/theme/useThemedStyles";

type ThemeModeScreenProps = {
    themeMode: ThemeMode;
    onChangeThemeMode: (mode: ThemeMode) => void;
};

export function ThemeModeScreen({ themeMode, onChangeThemeMode }: ThemeModeScreenProps) {
    const styles = useThemedStyles(createStyles);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <View style={styles.sectionCard}>
                        <View style={styles.preferenceHeader}>
                            <Text style={styles.preferenceTitle}>화면 모드</Text>
                            <Text style={styles.preferenceDescription}>
                                라이트/다크 모드를 전환해 디스플레이 분위기를 바꿔보세요.
                            </Text>
                        </View>
                        <View style={styles.appearanceOptions}>
                            {THEME_MODE_OPTIONS.map((option) => {
                                const isActive = option.value === themeMode;
                                return (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[styles.appearanceOption, isActive && styles.appearanceOptionActive]}
                                        onPress={() => {
                                            onChangeThemeMode(option.value);
                                        }}
                                        activeOpacity={0.85}
                                        accessibilityRole="button"
                                        accessibilityState={{ selected: isActive }}
                                    >
                                        <View style={styles.appearancePreview}>
                                            <View
                                                style={[
                                                    styles.previewStatusBar,
                                                    option.value === "dark" && styles.previewStatusBarDark,
                                                ]}
                                            />
                                            <View
                                                style={[
                                                    styles.previewContent,
                                                    option.value === "dark" && styles.previewContentDark,
                                                ]}
                                            >
                                                <View
                                                    style={[
                                                        styles.previewBlock,
                                                        option.value === "dark"
                                                            ? styles.previewBlockDark
                                                            : styles.previewBlockLight,
                                                    ]}
                                                />
                                                <View
                                                    style={[
                                                        styles.previewBlockSmall,
                                                        option.value === "dark"
                                                            ? styles.previewBlockSmallDark
                                                            : styles.previewBlockSmallLight,
                                                    ]}
                                                />
                                            </View>
                                        </View>
                                        <Text
                                            style={[styles.appearanceLabel, isActive && styles.appearanceLabelActive]}
                                        >
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
