import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    DISPLAY_NAME_AVAILABLE_MESSAGE,
    DISPLAY_NAME_CHECK_REQUIRED_MESSAGE,
    DISPLAY_NAME_NO_CHANGE_MESSAGE,
    DISPLAY_NAME_REQUIRED_ERROR_MESSAGE,
    MISSING_USER_ERROR_MESSAGE,
    PROFILE_UPDATE_ERROR_MESSAGE,
    PROFILE_UPDATE_SUCCESS_MESSAGE,
} from "@/screens/App/AppScreen.constants";
import { createMyPageStyles } from "@/screens/Settings/MyPageScreen.styles";
import { useAppAppearance } from "@/theme/AppearanceContext";
import { useThemedStyles } from "@/theme/useThemedStyles";

type MyPageNicknameScreenProps = {
    username: string;
    displayName: string | null;
    onUpdateProfile: (displayName: string) => Promise<void>;
    onCheckNickname: (displayName: string) => Promise<string>;
    onGoBack: () => void;
};

export function MyPageNicknameScreen({
    username,
    displayName,
    onUpdateProfile,
    onCheckNickname,
    onGoBack,
}: MyPageNicknameScreenProps) {
    const styles = useThemedStyles(createMyPageStyles);
    const { theme } = useAppAppearance();
    const [nickname, setNickname] = useState(displayName ?? "");
    const [error, setError] = useState<string | null>(null);
    const [checkMessage, setCheckMessage] = useState<string | null>(null);
    const [checkStatus, setCheckStatus] = useState<"idle" | "success" | "error">("idle");
    const [checking, setChecking] = useState(false);
    const [validatedNickname, setValidatedNickname] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const trimmedNickname = nickname.trim();
    const originalNickname = displayName?.trim() ?? "";
    const hasChanges = trimmedNickname !== originalNickname;
    const isCheckSatisfied =
        trimmedNickname.length === 0 ? true : checkStatus === "success" && validatedNickname === trimmedNickname;
    const isSubmitDisabled = loading || !hasChanges || !isCheckSatisfied;

    useEffect(() => {
        setNickname(displayName ?? "");
        setCheckMessage(null);
        setCheckStatus("idle");
        setValidatedNickname(displayName ?? "");
    }, [displayName]);

    const handleChangeNickname = useCallback((next: string) => {
        setNickname(next);
        setError(null);
        setCheckMessage(null);
        setCheckStatus("idle");
        setValidatedNickname(null);
    }, []);

    const handleCheckDuplicate = useCallback(async () => {
        if (checking) {
            return;
        }
        const trimmed = nickname.trim();
        if (!trimmed) {
            setCheckStatus("error");
            setCheckMessage(DISPLAY_NAME_REQUIRED_ERROR_MESSAGE);
            return;
        }
        setChecking(true);
        setCheckMessage(null);
        setCheckStatus("idle");
        try {
            const message = await onCheckNickname(trimmed);
            setCheckStatus("success");
            setCheckMessage(message || DISPLAY_NAME_AVAILABLE_MESSAGE);
            setValidatedNickname(trimmed);
        } catch (checkError) {
            const message = checkError instanceof Error ? checkError.message : PROFILE_UPDATE_ERROR_MESSAGE;
            setCheckStatus("error");
            setCheckMessage(message);
            setValidatedNickname(null);
        } finally {
            setChecking(false);
        }
    }, [checking, nickname, onCheckNickname]);

    const handleSubmit = useCallback(async () => {
        if (loading) {
            return;
        }

        if (!username) {
            Alert.alert("마이 페이지", MISSING_USER_ERROR_MESSAGE);
            return;
        }

        if (!hasChanges) {
            setError(DISPLAY_NAME_NO_CHANGE_MESSAGE);
            return;
        }

        if (!isCheckSatisfied) {
            setError(DISPLAY_NAME_CHECK_REQUIRED_MESSAGE);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await onUpdateProfile(nickname);
            Alert.alert("마이 페이지", PROFILE_UPDATE_SUCCESS_MESSAGE, [
                {
                    text: "확인",
                    onPress: onGoBack,
                },
            ]);
        } catch (error) {
            const message = error instanceof Error ? error.message : PROFILE_UPDATE_ERROR_MESSAGE;
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [hasChanges, isCheckSatisfied, loading, nickname, onGoBack, onUpdateProfile, username]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={styles.title}>닉네임 설정</Text>
                    <Text style={styles.sectionDescription}>닉네임을 비워두면 이메일 주소가 대신 표시돼요.</Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={[styles.input, styles.inputFlex]}
                            placeholder="닉네임을 입력하세요"
                            value={nickname}
                            onChangeText={handleChangeNickname}
                            editable={!loading}
                            placeholderTextColor={theme.textMuted}
                            autoCapitalize="none"
                            returnKeyType="done"
                        />
                        <TouchableOpacity
                            style={[styles.checkButton, (checking || loading) && styles.checkButtonDisabled]}
                            onPress={handleCheckDuplicate}
                            disabled={checking || loading}
                            activeOpacity={0.85}
                        >
                            {checking ? (
                                <ActivityIndicator color={theme.accent} />
                            ) : (
                                <Text style={styles.checkButtonText}>중복 확인</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                    {checkMessage ? (
                        <Text style={checkStatus === "success" ? styles.successText : styles.errorText}>
                            {checkMessage}
                        </Text>
                    ) : null}
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    <TouchableOpacity
                        style={[styles.submitButton, (loading || isSubmitDisabled) && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={isSubmitDisabled}
                        activeOpacity={0.9}
                    >
                        {loading ? (
                            <ActivityIndicator color={theme.accentContrast} />
                        ) : (
                            <Text style={styles.submitButtonText}>저장</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
