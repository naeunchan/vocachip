import { StatusBar } from "expo-status-bar";
import React, { useMemo } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppHelpModal } from "@/components/AppHelpModal";
import { AppNavigator } from "@/components/AppNavigator";
import { LoadingState } from "@/components/LoadingState";
import { useAppScreen } from "@/hooks/useAppScreen";
import { INITIAL_LOADING_MESSAGE } from "@/screens/App/AppScreen.constants";
import { createAppScreenStyles } from "@/screens/App/AppScreen.styles";
import { AuthNavigator } from "@/screens/Auth/AuthNavigator";
import { OnboardingModal } from "@/screens/Onboarding/OnboardingModal";
import { AppAppearanceProvider } from "@/theme/AppearanceContext";
import { APP_THEMES } from "@/theme/themes";

export function AppScreen() {
    const {
        initializing,
        appearanceReady,
        isHelpVisible,
        isOnboardingVisible,
        isAuthenticated,
        loginBindings,
        navigatorProps,
        handleDismissHelp,
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
            <SafeAreaProvider>
                <StatusBar style={themeMode === "dark" ? "light" : "dark"} />
                <View style={styles.container}>
                    <View style={styles.content}>
                        {initializing || !appearanceReady ? (
                            <LoadingState message={INITIAL_LOADING_MESSAGE} />
                        ) : !isAuthenticated ? (
                            <AuthNavigator loginProps={loginBindings} />
                        ) : (
                            <AppNavigator {...navigatorProps} />
                        )}
                    </View>
                </View>
                <AppHelpModal
                    visible={isAuthenticated && isHelpVisible && !isOnboardingVisible}
                    onDismiss={handleDismissHelp}
                />
                <OnboardingModal visible={isOnboardingVisible} onComplete={onCompleteOnboarding} />
            </SafeAreaProvider>
        </AppAppearanceProvider>
    );
}
