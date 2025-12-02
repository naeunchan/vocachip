import React from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppAppearance } from "@/theme/AppearanceContext";

type LegalDocumentModalProps = {
    title: string;
    content: string;
    visible: boolean;
    onClose: () => void;
};

export function LegalDocumentModal({ title, content, visible, onClose }: LegalDocumentModalProps) {
    const { theme } = useAppAppearance();
    const insets = useSafeAreaInsets();

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView
                edges={["left", "right", "bottom"]}
                style={{ flex: 1, paddingTop: insets.top, backgroundColor: theme.background }}
            >
                <View
                    style={{
                        paddingHorizontal: 20,
                        paddingBottom: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.border,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Text style={{ fontSize: 18, fontWeight: "700", color: theme.textPrimary }}>{title}</Text>
                    <TouchableOpacity
                        onPress={onClose}
                        accessibilityRole="button"
                        accessibilityLabel="닫기"
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Text style={{ color: theme.accent, fontWeight: "600" }}>닫기</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                    {content.split("\n").map((line, index) =>
                        line.trim().startsWith("##") ? (
                            <Text
                                key={`${line}-${index}`}
                                style={{
                                    fontSize: 16,
                                    fontWeight: "700",
                                    marginTop: index === 0 ? 0 : 18,
                                    color: theme.textPrimary,
                                }}
                            >
                                {line.replace(/^##\s?/, "")}
                            </Text>
                        ) : (
                            <Text
                                key={`${line}-${index}`}
                                style={{ fontSize: 14, lineHeight: 20, color: theme.textSecondary, marginTop: 8 }}
                            >
                                {line}
                            </Text>
                        ),
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}
