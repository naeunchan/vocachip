import { registerRootComponent } from "expo";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type RootComponent = React.ComponentType;

function BootScreen() {
    const [Root, setRoot] = useState<RootComponent | null>(null);
    const [bootError, setBootError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function bootstrap() {
            try {
                console.log("[ait-boot] bootstrap started");
                await import("react-native-gesture-handler");
                console.log("[ait-boot] gesture handler imported");
                const module = await import("./src/_app");
                console.log("[ait-boot] apps-in-toss root imported");

                if (!cancelled) {
                    setRoot(() => module.default);
                }
            } catch (error) {
                const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
                console.error("[ait-boot] bootstrap failed", error);

                if (!cancelled) {
                    setBootError(message);
                }
            }
        }

        void bootstrap();

        return () => {
            cancelled = true;
        };
    }, []);

    if (Root) {
        return React.createElement(Root);
    }

    if (bootError) {
        return React.createElement(
            View,
            { style: [styles.container, styles.errorContainer] },
            React.createElement(Text, { style: styles.title }, "Apps in Toss boot failed"),
            React.createElement(Text, { selectable: true, style: styles.body }, bootError),
        );
    }

    return React.createElement(
        View,
        { style: styles.container },
        React.createElement(ActivityIndicator, { color: "#2563eb", size: "small" }),
        React.createElement(Text, { style: styles.title }, "Apps in Toss booting..."),
        React.createElement(Text, { style: styles.body }, "If this stays here, check logs for [ait-boot]."),
    );
}

const styles = StyleSheet.create({
    body: {
        color: "#94a3b8",
        fontSize: 13,
        lineHeight: 18,
        textAlign: "center",
    },
    container: {
        alignItems: "center",
        backgroundColor: "#020617",
        flex: 1,
        gap: 12,
        justifyContent: "center",
        padding: 24,
    },
    errorContainer: {
        alignItems: "stretch",
    },
    title: {
        color: "#f8fafc",
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
    },
});

registerRootComponent(BootScreen);
