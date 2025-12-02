import { RootTabParamList } from "@/navigation/Navigation.types";

type TabKey = keyof RootTabParamList;

type TabVisualConfig = {
    label: string;
    icon: string;
};

export const TAB_BAR_OPTIONS = {
    showLabel: false,
} as const;

export const TAB_VISUAL_CONFIG: Record<TabKey, TabVisualConfig> = {
    Home: { label: "홈", icon: "home" },
    Favorites: { label: "내 단어장", icon: "book" },
    Search: { label: "단어 검색", icon: "search" },
    Settings: { label: "설정", icon: "settings" },
};
