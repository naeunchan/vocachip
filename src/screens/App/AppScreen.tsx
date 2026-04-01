import React, { useEffect, useMemo, useState } from "react";
import { StatusBar, View } from "react-native";

import type { AppNavigatorProps } from "@/components/AppNavigator";
import { LoadingState } from "@/components/LoadingState";
import { useAppScreen } from "@/hooks/useAppScreen";
import { TDSProvider } from "@/integrations/tds";
import { INITIAL_LOADING_MESSAGE } from "@/screens/App/AppScreen.constants";
import { createAppScreenStyles } from "@/screens/App/AppScreen.styles";
import type { AppScreenProps } from "@/screens/App/AppScreen.types";
import type { AuthNavigatorProps } from "@/screens/Auth/AuthNavigator.types";
import { AppAppearanceProvider } from "@/theme/AppearanceContext";
import { APP_THEMES } from "@/theme/themes";

type LoadedNavigators = {
    AppNavigator: (props: AppNavigatorProps) => React.JSX.Element;
    AuthNavigator: (props: AuthNavigatorProps) => React.JSX.Element;
};

type LoadedOnboardingModal = {
    OnboardingModal: (props: { visible: boolean; onComplete: () => void }) => React.JSX.Element;
};

export function AppScreen({ initialTab }: AppScreenProps) {
    const [loadedNavigators, setLoadedNavigators] = useState<LoadedNavigators | null>(null);
    const [loadedOnboardingModal, setLoadedOnboardingModal] = useState<LoadedOnboardingModal | null>(null);
    const [navigatorLoadError, setNavigatorLoadError] = useState<Error | null>(null);
    const {
        initializing,
        appearanceReady,
        isOnboardingVisible,
        isAuthenticated,
        loginBindings,
        navigatorProps,
        onCompleteOnboarding,
        themeMode,
        fontScale,
        onThemeModeChange,
        onFontScaleChange,
    } = useAppScreen();
    const styles = useMemo(() => createAppScreenStyles(APP_THEMES[themeMode]), [themeMode]);

    useEffect(() => {
        let isMounted = true;

        const timer = setTimeout(() => {
            void Promise.all([
                import("@/components/AppNavigator"),
                import("@/screens/Auth/AuthNavigator"),
                import("@/screens/Onboarding/OnboardingModal"),
            ])
                .then(([appNavigatorModule, authNavigatorModule, onboardingModalModule]) => {
                    if (!isMounted) {
                        return;
                    }

                    setLoadedNavigators({
                        AppNavigator: appNavigatorModule.AppNavigator,
                        AuthNavigator: authNavigatorModule.AuthNavigator,
                    });
                    setLoadedOnboardingModal({
                        OnboardingModal: onboardingModalModule.OnboardingModal,
                    });
                })
                .catch((error: unknown) => {
                    if (!isMounted) {
                        return;
                    }

                    setNavigatorLoadError(
                        error instanceof Error ? error : new Error("내비게이터를 불러오는 중 문제가 발생했어요."),
                    );
                });
        }, 0);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, []);

    if (navigatorLoadError) {
        throw navigatorLoadError;
    }

    return (
        <AppAppearanceProvider
            mode={themeMode}
            fontScale={fontScale}
            onChangeMode={onThemeModeChange}
            onChangeFontScale={onFontScaleChange}
        >
            <TDSProvider colorPreference={themeMode === "dark" ? "dark" : "light"}>
                <StatusBar barStyle={themeMode === "dark" ? "light-content" : "dark-content"} />
                <View style={styles.container}>
                    <View style={styles.content}>
                        {initializing || !appearanceReady || !loadedNavigators ? (
                            <LoadingState message={INITIAL_LOADING_MESSAGE} />
                        ) : !isAuthenticated ? (
                            <loadedNavigators.AuthNavigator loginProps={loginBindings} />
                        ) : (
                            <loadedNavigators.AppNavigator {...navigatorProps} initialTab={initialTab} />
                        )}
                    </View>
                </View>
                {loadedOnboardingModal ? (
                    <loadedOnboardingModal.OnboardingModal
                        visible={isOnboardingVisible}
                        onComplete={onCompleteOnboarding}
                    />
                ) : null}
            </TDSProvider>
        </AppAppearanceProvider>
    );
}
