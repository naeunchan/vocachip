import { act, fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Linking } from "react-native";

import { AuthNavigator } from "@/screens/Auth/AuthNavigator";
import type { LoginScreenProps } from "@/screens/Auth/LoginScreen.types";
import { SettingsNavigator } from "@/screens/Settings/SettingsNavigator";
import type { SettingsNavigatorProps } from "@/screens/Settings/SettingsNavigator.types";
import { AppAppearanceProvider } from "@/theme/AppearanceContext";

type NavigationLike = {
    navigate: (name: string) => void;
    goBack: () => void;
    canGoBack: () => boolean;
    popToTop: () => void;
};

let mockActiveNavigation: NavigationLike | null = null;

jest.mock("@react-navigation/native", () => {
    const React = require("react");
    return {
        NavigationContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        DefaultTheme: { colors: { background: "#fff", card: "#fff", border: "#fff", primary: "#000", text: "#000" } },
        DarkTheme: { colors: { background: "#000", card: "#000", border: "#000", primary: "#fff", text: "#fff" } },
        useNavigation: () => mockActiveNavigation ?? { goBack: jest.fn() },
    };
});

jest.mock("@react-navigation/native-stack", () => {
    const React = require("react");

    return {
        createNativeStackNavigator: () => {
            const Screen = (_props: any) => null;
            const Navigator = ({ children }: { children: React.ReactNode }) => {
                const screens = React.Children.toArray(children).filter(Boolean) as React.ReactElement[];
                const [stack, setStack] = React.useState<string[]>(() => {
                    const first = screens[0] as React.ReactElement<{ name: string }>;
                    return [first.props.name];
                });

                const currentName = stack[stack.length - 1];
                const currentScreen = screens.find((item) => {
                    const element = item as React.ReactElement<{ name: string }>;
                    return element.props.name === currentName;
                }) as React.ReactElement<{
                    children?: React.ReactNode | ((props: any) => React.ReactNode);
                    component?: React.ComponentType<any>;
                }>;

                const navigation: NavigationLike = {
                    navigate: (name: string) => {
                        setStack((prev) => [...prev, name]);
                    },
                    goBack: () => {
                        setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
                    },
                    canGoBack: () => stack.length > 1,
                    popToTop: () => {
                        setStack((prev) => [prev[0]]);
                    },
                };
                mockActiveNavigation = navigation;

                const route = { key: currentName, name: currentName };
                if (typeof currentScreen.props.children === "function") {
                    return <>{currentScreen.props.children({ navigation, route })}</>;
                }
                if (currentScreen.props.component) {
                    const Component = currentScreen.props.component;
                    return <Component navigation={navigation} route={route} />;
                }
                return <>{currentScreen.props.children ?? null}</>;
            };
            return { Navigator, Screen };
        },
    };
});

jest.mock("@expo/vector-icons/Ionicons", () => {
    const React = require("react");
    const { Text: RNText } = require("react-native");
    return (props: { name: string }) => <RNText>{props.name}</RNText>;
});

jest.mock("@expo/vector-icons/MaterialCommunityIcons", () => {
    const React = require("react");
    const { Text: RNText } = require("react-native");
    return (props: { name: string }) => <RNText>{props.name}</RNText>;
});

jest.mock("@expo/vector-icons", () => {
    const React = require("react");
    const { Text: RNText } = require("react-native");
    const Icon = (props: { name: string }) => <RNText>{props.name}</RNText>;
    return {
        Ionicons: Icon,
        MaterialIcons: Icon,
        MaterialCommunityIcons: Icon,
    };
});

jest.mock("@/services/database", () => ({
    getPreferenceValue: jest.fn().mockResolvedValue("false"),
    setPreferenceValue: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/hooks/useAIStatus", () => ({
    useAIStatus: () => ({ status: "unavailable", lastCheckedAt: null, refresh: jest.fn() }),
}));

function renderWithAppearance(node: React.ReactElement) {
    return render(
        <AppAppearanceProvider
            mode="light"
            fontScale={1}
            onChangeMode={() => undefined}
            onChangeFontScale={() => undefined}
        >
            {node}
        </AppAppearanceProvider>,
    );
}

function buildLoginProps(overrides: Partial<LoginScreenProps> = {}): LoginScreenProps {
    return {
        onGuest: jest.fn(),
        onLogin: jest.fn().mockResolvedValue(undefined),
        onSignUp: jest.fn().mockResolvedValue(undefined),
        loading: false,
        ...overrides,
    };
}

function buildSettingsProps(overrides: Partial<SettingsNavigatorProps> = {}): SettingsNavigatorProps {
    const asyncNoop = jest.fn().mockResolvedValue(undefined);
    return {
        onLogout: jest.fn(),
        canLogout: true,
        isGuest: false,
        onRequestLogin: jest.fn(),
        onRequestSignUp: jest.fn(),
        appVersion: "1.0.0",
        profileDisplayName: "Alex",
        profileUsername: "alex",
        onUpdateProfile: asyncNoop,
        onCheckDisplayName: jest.fn().mockResolvedValue("ok"),
        onUpdatePassword: asyncNoop,
        onDeleteAccount: asyncNoop,
        onExportBackup: asyncNoop,
        onImportBackup: asyncNoop,
        onShowOnboarding: jest.fn(),
        themeMode: "light",
        onThemeModeChange: jest.fn(),
        fontScale: 1,
        onFontScaleChange: jest.fn(),
        ...overrides,
    };
}

describe("Recovery Flow E2E", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockActiveNavigation = null;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("verifies login entry path to recovery guide", async () => {
        const screen = renderWithAppearance(<AuthNavigator loginProps={buildLoginProps()} />);

        fireEvent.press(screen.getByText("비밀번호를 잊으셨나요?"));

        expect(await screen.findByText("가능한 대체 방법")).toBeTruthy();
    });

    it("verifies recovery guide actions from login path", async () => {
        const onGuest = jest.fn();
        jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);
        jest.spyOn(Linking, "openURL").mockResolvedValue();

        const screen = renderWithAppearance(<AuthNavigator loginProps={buildLoginProps({ onGuest })} />);

        fireEvent.press(screen.getByText("비밀번호를 잊으셨나요?"));
        expect(await screen.findByText("가능한 대체 방법")).toBeTruthy();

        fireEvent.press(screen.getByText("새 계정 만들기"));
        expect(await screen.findByText("가입을 시작할까요?")).toBeTruthy();

        fireEvent.press(screen.getByLabelText("뒤로가기"));
        expect(await screen.findByText("가능한 대체 방법")).toBeTruthy();

        fireEvent.press(screen.getByText("게스트로 계속하기"));
        expect(onGuest).toHaveBeenCalled();

        await act(async () => {
            fireEvent.press(screen.getByText("고객센터 문의하기"));
        });
        expect(Linking.openURL).toHaveBeenCalledWith(expect.stringContaining("mailto:support@vocationary.app"));
    });

    it("verifies settings entry path to recovery guide", async () => {
        const screen = renderWithAppearance(<SettingsNavigator {...buildSettingsProps()} />);

        fireEvent.press(screen.getByText("계정 복구 안내"));

        expect(await screen.findByText("가능한 대체 방법")).toBeTruthy();
    });
});
