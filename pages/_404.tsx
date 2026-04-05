import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function NotFoundPage() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Page not found</Text>
            <Text style={styles.description}>The requested route is not available.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        backgroundColor: "#0f172a",
    },
    title: {
        color: "#f8fafc",
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 8,
    },
    description: {
        color: "#cbd5e1",
        fontSize: 15,
        textAlign: "center",
    },
});
