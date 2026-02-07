import React from "react";
import { Text, TextInput, View } from "react-native";

import { createLoginScreenStyles } from "@/screens/Auth/LoginScreen.styles";
import { useAppAppearance } from "@/theme/AppearanceContext";
import { useThemedStyles } from "@/theme/useThemedStyles";

type CredentialFieldsProps = {
    username: string;
    password: string;
    loading: boolean;
    emailError?: string | null;
    passwordError?: string | null;
    onChangeUsername: (value: string) => void;
    onChangePassword: (value: string) => void;
};

export function CredentialFields({
    username,
    password,
    loading,
    emailError,
    passwordError,
    onChangeUsername,
    onChangePassword,
}: CredentialFieldsProps) {
    const styles = useThemedStyles(createLoginScreenStyles);
    const { theme } = useAppAppearance();

    return (
        <View style={{ gap: 12 }}>
            <TextInput
                style={styles.textInput}
                value={username}
                onChangeText={onChangeUsername}
                placeholder="Email"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                autoComplete="email"
                textContentType="emailAddress"
                keyboardType="email-address"
                returnKeyType="next"
                placeholderTextColor={theme.textMuted}
            />
            <Text style={styles.errorText}>{emailError ?? " "}</Text>

            <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={onChangePassword}
                placeholder="Password"
                secureTextEntry
                editable={!loading}
                autoComplete="password"
                textContentType="password"
                returnKeyType="done"
                placeholderTextColor={theme.textMuted}
            />
            <Text style={styles.errorText}>{passwordError ?? " "}</Text>
        </View>
    );
}
