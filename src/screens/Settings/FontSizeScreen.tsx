import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { createStyles } from "@/screens/Settings/SettingsScreen.styles";
import { useAppAppearance } from "@/theme/AppearanceContext";
import { FONT_SCALE_OPTIONS } from "@/theme/constants";
import { useThemedStyles } from "@/theme/useThemedStyles";
import { scaleFont } from "@/theme/utils";

type FontSizeScreenProps = {
    fontScale: number;
    onChangeFontScale: (scale: number) => void;
};

export function FontSizeScreen({ fontScale, onChangeFontScale }: FontSizeScreenProps) {
    const styles = useThemedStyles(createStyles);
    const { theme } = useAppAppearance();

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <View style={styles.sectionCard}>
                        <View style={styles.preferenceHeader}>
                            <Text style={styles.preferenceTitle}>글자 크기</Text>
                            <Text style={styles.preferenceDescription}>가독성에 맞춰 텍스트 크기를 선택해 주세요.</Text>
                        </View>
                        <View style={styles.fontSizeList}>
                            {FONT_SCALE_OPTIONS.map((option, index) => {
                                const isActive = option.value === fontScale;
                                const sampleFontSize = scaleFont(15, option.value);
                                return (
                                    <TouchableOpacity
                                        key={option.label}
                                        style={[
                                            styles.fontSizeRow,
                                            index === FONT_SCALE_OPTIONS.length - 1 && styles.fontSizeRowLast,
                                        ]}
                                        onPress={() => {
                                            onChangeFontScale(option.value);
                                        }}
                                        activeOpacity={0.8}
                                        accessibilityRole="button"
                                        accessibilityState={{ selected: isActive }}
                                    >
                                        <Text
                                            style={[
                                                styles.fontSizeRowLabel,
                                                { fontSize: sampleFontSize },
                                                isActive && styles.fontSizeRowLabelActive,
                                            ]}
                                        >
                                            {option.label}
                                        </Text>
                                        {isActive ? <Ionicons name="checkmark" size={18} color={theme.accent} /> : null}
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
