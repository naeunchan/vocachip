import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { debugError, debugLog } from "@/appsInToss/debug";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { initializeLogging } from "@/logging/logger";
import type { RootTabRouteName } from "@/navigation/Navigation.types";

type VocachipMiniAppProps = {
    initialTab?: RootTabRouteName;
};

type LoadedAppScreen = {
    AppScreen: (props: { initialTab?: RootTabRouteName }) => React.JSX.Element;
};

type BootFallbackProps = {
    message: string;
    detail: string;
    loading?: boolean;
};

function BootFallback({ message, detail, loading = false }: BootFallbackProps) {
    return (
        <View style={styles.fallbackContainer}>
            {loading ? <ActivityIndicator size="large" color="#2563eb" /> : null}
            <Text style={styles.fallbackTitle}>{message}</Text>
            <Text style={styles.fallbackDescription}>{detail}</Text>
        </View>
    );
}

export function VocachipMiniApp({ initialTab }: VocachipMiniAppProps) {
    debugLog("VocachipMiniApp rendered", { initialTab });

    const [appKey, setAppKey] = useState(0);
    const [loadedAppScreen, setLoadedAppScreen] = useState<LoadedAppScreen | null>(null);
    const [appScreenLoadError, setAppScreenLoadError] = useState<Error | null>(null);

    useEffect(() => {
        debugLog("VocachipMiniApp initializeLogging effect started");
        try {
            initializeLogging();
            debugLog("VocachipMiniApp initializeLogging effect finished");
        } catch (error) {
            debugError("VocachipMiniApp initializeLogging effect failed", error);
        }
    }, []);

    useEffect(() => {
        debugLog("VocachipMiniApp AppScreen import scheduled");
        let isMounted = true;

        const timer = setTimeout(() => {
            debugLog("VocachipMiniApp AppScreen import started");
            void import("@/screens/App/AppScreen")
                .then((module) => {
                    if (!isMounted) {
                        debugLog("VocachipMiniApp AppScreen import resolved after unmount");
                        return;
                    }

                    debugLog("VocachipMiniApp AppScreen import succeeded");
                    setLoadedAppScreen({
                        AppScreen: module.AppScreen,
                    });
                })
                .catch((error: unknown) => {
                    if (!isMounted) {
                        debugError("VocachipMiniApp AppScreen import failed after unmount", error);
                        return;
                    }

                    debugError("VocachipMiniApp AppScreen import failed", error);
                    setAppScreenLoadError(
                        error instanceof Error ? error : new Error("앱 화면을 불러오는 중 문제가 발생했어요."),
                    );
                });
        }, 0);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, []);

    const handleRestart = useCallback(() => {
        debugLog("VocachipMiniApp restarting", { nextAppKey: appKey + 1 });
        setAppKey((previous) => previous + 1);
    }, [appKey]);

    if (appScreenLoadError) {
        return (
            <BootFallback
                message="앱 초기화 중 문제가 발생했어요."
                detail={__DEV__ ? appScreenLoadError.message : "콘솔 로그의 [ait-debug] 항목을 확인해주세요."}
            />
        );
    }

    if (!loadedAppScreen) {
        return <BootFallback message="앱을 준비하는 중이에요." detail="초기 화면 모듈을 불러오는 중입니다." loading />;
    }

    return (
        <AppErrorBoundary enabled={!__DEV__} onRestart={handleRestart}>
            <loadedAppScreen.AppScreen key={appKey} initialTab={initialTab} />
        </AppErrorBoundary>
    );
}

const styles = StyleSheet.create({
    fallbackContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc",
        padding: 24,
        gap: 12,
    },
    fallbackTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#0f172a",
        textAlign: "center",
    },
    fallbackDescription: {
        fontSize: 15,
        lineHeight: 22,
        color: "#475569",
        textAlign: "center",
    },
});
