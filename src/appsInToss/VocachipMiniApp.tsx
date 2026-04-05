import React, { useCallback, useState } from "react";

import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { initializeLogging } from "@/logging/logger";
import type { RootTabRouteName } from "@/navigation/Navigation.types";
import { AppScreen } from "@/screens/App/AppScreen";

type VocachipMiniAppProps = {
    initialTab?: RootTabRouteName;
};

export function VocachipMiniApp({ initialTab }: VocachipMiniAppProps) {
    initializeLogging();

    const [appKey, setAppKey] = useState(0);
    const handleRestart = useCallback(() => {
        setAppKey((previous) => previous + 1);
    }, []);

    return (
        <AppErrorBoundary enabled={!__DEV__} onRestart={handleRestart}>
            <AppScreen key={appKey} initialTab={initialTab} />
        </AppErrorBoundary>
    );
}
