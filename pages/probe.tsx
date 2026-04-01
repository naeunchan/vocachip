import { createRoute } from "@granite-js/react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export const Route = createRoute("/probe", {
    component: Page,
});

function Page() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Vocachip Probe OK</Text>
            <Text style={styles.description}>이 화면이 보이면 Apps in Toss RN 라우팅과 기본 렌더링은 정상입니다.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc",
        padding: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 12,
        textAlign: "center",
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        color: "#475569",
        textAlign: "center",
    },
});
