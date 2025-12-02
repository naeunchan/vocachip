import { Ionicons } from "@expo/vector-icons";
import { getHeaderTitle } from "@react-navigation/elements";
import { type NativeStackHeaderProps } from "@react-navigation/native-stack";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppAppearance } from "@/theme/AppearanceContext";

export function SettingsHeader({ navigation, options, route, back }: NativeStackHeaderProps) {
    const { theme } = useAppAppearance();
    const title = getHeaderTitle(options, route.name);
    return (
        <SafeAreaView edges={["top"]} style={{ backgroundColor: theme.background }}>
            <View
                style={{
                    height: 52,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 8,
                    borderBottomWidth: options.headerShadowVisible === false ? 0 : 1,
                    borderBottomColor: theme.border,
                }}
            >
                {back ? (
                    <TouchableOpacity
                        onPress={navigation.goBack}
                        accessibilityRole="button"
                        accessibilityLabel="뒤로가기"
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        style={{ padding: 8 }}
                        activeOpacity={0.6}
                    >
                        <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 40 }} />
                )}
                <Text
                    style={{
                        flex: 1,
                        textAlign: "center",
                        fontSize: 17,
                        fontWeight: "700",
                        color: theme.textPrimary,
                    }}
                >
                    {title}
                </Text>
                <View style={{ width: 40 }} />
            </View>
        </SafeAreaView>
    );
}
