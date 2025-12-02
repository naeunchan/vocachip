import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Dimensions,
    FlatList,
    Modal,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { t } from "@/shared/i18n";
import { useAppAppearance } from "@/theme/AppearanceContext";

type OnboardingSlide = {
    key: string;
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
};

type OnboardingModalProps = {
    visible: boolean;
    onComplete: () => void;
};

export function OnboardingModal({ visible, onComplete }: OnboardingModalProps) {
    const { theme } = useAppAppearance();
    const textColor = "#f8fafc";
    const [activeIndex, setActiveIndex] = useState(0);
    const listRef = useRef<FlatList<OnboardingSlide>>(null);
    const slides = useMemo<OnboardingSlide[]>(
        () => [
            {
                key: "search",
                title: t("onboarding.slide.search.title"),
                description: t("onboarding.slide.search.description"),
                icon: "search-outline",
            },
            {
                key: "examples",
                title: t("onboarding.slide.examples.title"),
                description: t("onboarding.slide.examples.description"),
                icon: "book-outline",
            },
            {
                key: "favorites",
                title: t("onboarding.slide.favorites.title"),
                description: t("onboarding.slide.favorites.description"),
                icon: "star-outline",
            },
        ],
        [],
    );

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset } = event.nativeEvent;
        const width = Dimensions.get("window").width;
        const index = Math.round(contentOffset.x / width);
        setActiveIndex(index);
    };

    const handleNext = () => {
        if (activeIndex >= slides.length - 1) {
            onComplete();
            return;
        }
        const nextIndex = activeIndex + 1;
        listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    };

    useEffect(() => {
        if (visible) {
            setActiveIndex(0);
            setTimeout(() => {
                listRef.current?.scrollToOffset({ offset: 0, animated: false });
            }, 0);
        }
    }, [visible]);

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.85)" }}>
                <SafeAreaView style={{ flex: 1 }}>
                    <View style={{ flex: 1, paddingVertical: 24 }}>
                        <FlatList
                            ref={listRef}
                            data={slides}
                            keyExtractor={(item) => item.key}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onScroll={handleScroll}
                            scrollEventThrottle={16}
                            renderItem={({ item }) => (
                                <View
                                    style={{
                                        width: Dimensions.get("window").width,
                                        paddingHorizontal: 32,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 20,
                                    }}
                                >
                                    <View
                                        style={{
                                            width: 96,
                                            height: 96,
                                            borderRadius: 48,
                                            backgroundColor: theme.surface,
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                        accessible
                                        accessibilityRole="image"
                                        accessibilityLabel={item.title}
                                    >
                                        <Ionicons name={item.icon} size={48} color={theme.accent} />
                                    </View>
                                    <Text
                                        style={{
                                            fontSize: 24,
                                            fontWeight: "800",
                                            color: textColor,
                                            textAlign: "center",
                                        }}
                                    >
                                        {item.title}
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            lineHeight: 24,
                                            color: textColor,
                                            opacity: 0.85,
                                            textAlign: "center",
                                        }}
                                    >
                                        {item.description}
                                    </Text>
                                </View>
                            )}
                        />
                        <View style={{ alignItems: "center", marginTop: 16, gap: 8 }}>
                            <View style={{ flexDirection: "row", gap: 6 }}>
                                {slides.map((slide, index) => (
                                    <View
                                        key={slide.key}
                                        style={{
                                            width: index === activeIndex ? 22 : 8,
                                            height: 8,
                                            borderRadius: 999,
                                            backgroundColor: index === activeIndex ? theme.accent : "#ffffff",
                                            opacity: index === activeIndex ? 1 : 0.4,
                                        }}
                                    />
                                ))}
                            </View>
                            <TouchableOpacity
                                style={{
                                    marginTop: 12,
                                    paddingHorizontal: 32,
                                    paddingVertical: 14,
                                    backgroundColor: theme.accent,
                                    borderRadius: 18,
                                }}
                                onPress={handleNext}
                                accessibilityRole="button"
                                accessibilityLabel={
                                    activeIndex === slides.length - 1
                                        ? t("onboarding.button.start")
                                        : t("onboarding.button.next")
                                }
                            >
                                <Text style={{ color: theme.accentContrast, fontSize: 16, fontWeight: "700" }}>
                                    {activeIndex === slides.length - 1
                                        ? t("onboarding.button.start")
                                        : t("onboarding.button.next")}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
}
