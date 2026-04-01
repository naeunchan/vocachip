import React, { useMemo } from "react";
import { StatusBar, View } from "react-native";

import { AppNavigator } from "@/components/AppNavigator";
import { LoadingState } from "@/components/LoadingState";
import { useAppScreen } from "@/hooks/useAppScreen";
import { TDSProvider } from "@/integrations/tds";
import { INITIAL_LOADING_MESSAGE } from "@/screens/App/AppScreen.constants";
import { createAppScreenStyles } from "@/screens/App/AppScreen.styles";
import type { AppScreenProps } from "@/screens/App/AppScreen.types";
import { AuthNavigator } from "@/screens/Auth/AuthNavigator";
import { OnboardingModal } from "@/screens/Onboarding/OnboardingModal";
import { AppAppearanceProvider } from "@/theme/AppearanceContext";
import { APP_THEMES } from "@/theme/themes";

export function AppScreen({ initialTab }: AppScreenProps) {
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
                        {initializing || !appearanceReady ? (
                            <LoadingState message={INITIAL_LOADING_MESSAGE} />
                        ) : !isAuthenticated ? (
                            <AuthNavigator loginProps={loginBindings} />
                        ) : (
                            <AppNavigator {...navigatorProps} initialTab={initialTab} />
                        )}
                    </View>
                </View>
                <OnboardingModal visible={isOnboardingVisible} onComplete={onCompleteOnboarding} />
            </TDSProvider>
        </AppAppearanceProvider>
    );
}
