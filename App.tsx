import { useFonts } from "expo-font";
import React, { useCallback, useState } from "react";

import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { initializeLogging } from "@/logging/logger";
import { AppScreen } from "@/screens/App/AppScreen";

initializeLogging();

export default function App() {
    const [appKey, setAppKey] = useState(0);
    const handleRestart = useCallback(() => {
        setAppKey((previous) => previous + 1);
    }, []);
    const [fontsLoaded] = useFonts({
        SB_Aggro_B: require("./assets/fonts/SB_Aggro_B.ttf"),
    });

    if (!fontsLoaded) {
        return null;
    }

    return (
        <AppErrorBoundary enabled={!__DEV__} onRestart={handleRestart}>
            <AppScreen key={appKey} />
        </AppErrorBoundary>
    );
}
