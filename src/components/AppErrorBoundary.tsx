import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { captureException } from "@/logging/logger";

type AppErrorBoundaryProps = {
    children: React.ReactNode;
    onRestart?: () => void;
    enabled?: boolean;
};

type AppErrorBoundaryState = {
    hasError: boolean;
    error?: Error;
};

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
    state: AppErrorBoundaryState = {
        hasError: false,
        error: undefined,
    };

    static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        captureException(error, { componentStack: errorInfo.componentStack });
    }

    private readonly handleRestart = () => {
        this.setState({ hasError: false, error: undefined });
        this.props.onRestart?.();
    };

    render() {
        if (this.props.enabled === false) {
            return this.props.children;
        }

        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <View style={styles.card}>
                        <Text style={styles.title}>앗! 문제가 발생했어요</Text>
                        <Text style={styles.description}>
                            앱을 다시 시작하면 대부분의 문제가 해결돼요.{" "}
                            {__DEV__
                                ? "개발 모드에서는 콘솔에서 오류를 확인할 수 있어요."
                                : "그래도 문제가 계속되면 문의해주세요."}
                        </Text>
                        <TouchableOpacity style={styles.button} onPress={this.handleRestart} accessibilityRole="button">
                            <Text style={styles.buttonText}>앱 다시 시작</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f172a",
        padding: 24,
    },
    card: {
        width: "100%",
        maxWidth: 360,
        backgroundColor: "#ffffff",
        borderRadius: 24,
        padding: 24,
        gap: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#0f172a",
    },
    description: {
        fontSize: 15,
        color: "#475569",
        lineHeight: 22,
    },
    button: {
        alignSelf: "flex-start",
        marginTop: 8,
        backgroundColor: "#1d4ed8",
        borderRadius: 999,
        paddingHorizontal: 18,
        paddingVertical: 10,
    },
    buttonText: {
        color: "#ffffff",
        fontSize: 15,
        fontWeight: "700",
    },
});
