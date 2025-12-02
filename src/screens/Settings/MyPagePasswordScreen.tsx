import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    MISSING_USER_ERROR_MESSAGE,
    PASSWORD_MISMATCH_ERROR_MESSAGE,
    PASSWORD_REQUIRED_ERROR_MESSAGE,
    PASSWORD_UPDATE_ERROR_MESSAGE,
    PASSWORD_UPDATE_SUCCESS_MESSAGE,
} from "@/screens/App/AppScreen.constants";
import { createMyPageStyles } from "@/screens/Settings/MyPageScreen.styles";
import { useAppAppearance } from "@/theme/AppearanceContext";
import { useThemedStyles } from "@/theme/useThemedStyles";
import { getGooglePasswordValidationError } from "@/utils/authValidation";

type MyPagePasswordScreenProps = {
    username: string;
    onUpdatePassword: (password: string) => Promise<void>;
    onGoBack: () => void;
};

export function MyPagePasswordScreen({ username, onUpdatePassword, onGoBack }: MyPagePasswordScreenProps) {
    const styles = useThemedStyles(createMyPageStyles);
    const { theme } = useAppAppearance();
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = useCallback(async () => {
        if (loading) {
            return;
        }

        if (!username) {
            Alert.alert("마이 페이지", MISSING_USER_ERROR_MESSAGE);
            return;
        }

        const trimmedPassword = password.trim();
        const trimmedConfirm = passwordConfirm.trim();
        if (!trimmedPassword) {
            setError(PASSWORD_REQUIRED_ERROR_MESSAGE);
            return;
        }
        if (trimmedPassword !== trimmedConfirm) {
            setError(PASSWORD_MISMATCH_ERROR_MESSAGE);
            return;
        }

        const passwordValidationError = getGooglePasswordValidationError(trimmedPassword);
        if (passwordValidationError) {
            setError(passwordValidationError);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await onUpdatePassword(trimmedPassword);
            setPassword("");
            setPasswordConfirm("");
            Alert.alert("마이 페이지", PASSWORD_UPDATE_SUCCESS_MESSAGE, [
                {
                    text: "확인",
                    onPress: onGoBack,
                },
            ]);
        } catch (error) {
            const message = error instanceof Error ? error.message : PASSWORD_UPDATE_ERROR_MESSAGE;
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [loading, onGoBack, onUpdatePassword, password, passwordConfirm, username]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>비밀번호 변경</Text>
                    <Text style={styles.sectionDescription}>
                        영문과 숫자를 조합한 8자 이상의 비밀번호를 입력해주세요.
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder="새 비밀번호"
                        value={password}
                        onChangeText={setPassword}
                        editable={!loading}
                        placeholderTextColor={theme.textMuted}
                        autoCapitalize="none"
                        secureTextEntry
                        textContentType="newPassword"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="새 비밀번호 확인"
                        value={passwordConfirm}
                        onChangeText={setPasswordConfirm}
                        editable={!loading}
                        placeholderTextColor={theme.textMuted}
                        autoCapitalize="none"
                        secureTextEntry
                        textContentType="newPassword"
                    />
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.9}
                    >
                        {loading ? (
                            <ActivityIndicator color={theme.accentContrast} />
                        ) : (
                            <Text style={styles.submitButtonText}>변경</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
