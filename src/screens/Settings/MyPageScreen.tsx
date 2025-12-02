import React, { useCallback } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MISSING_USER_ERROR_MESSAGE } from "@/screens/App/AppScreen.constants";
import { createMyPageStyles } from "@/screens/Settings/MyPageScreen.styles";
import { useThemedStyles } from "@/theme/useThemedStyles";

type MyPageScreenProps = {
    username: string;
    displayName: string | null;
    onNavigateNickname: () => void;
    onNavigatePassword: () => void;
    onNavigateDeleteAccount: () => void;
};

export function MyPageScreen({ username, onNavigateNickname, onNavigatePassword }: MyPageScreenProps) {
    const styles = useThemedStyles(createMyPageStyles);

    const handleNavigateNickname = useCallback(() => {
        if (!username) {
            Alert.alert("마이 페이지", MISSING_USER_ERROR_MESSAGE);
            return;
        }
        onNavigateNickname();
    }, [onNavigateNickname, username]);

    const handleNavigatePassword = useCallback(() => {
        if (!username) {
            Alert.alert("마이 페이지", MISSING_USER_ERROR_MESSAGE);
            return;
        }
        onNavigatePassword();
    }, [onNavigatePassword, username]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <View style={styles.actionList}>
                        <TouchableOpacity
                            style={styles.actionItem}
                            activeOpacity={0.85}
                            onPress={handleNavigateNickname}
                        >
                            <View style={styles.actionTextContainer}>
                                <Text style={styles.actionTitle}>닉네임 수정</Text>
                            </View>
                            <Text style={styles.actionChevron}>›</Text>
                        </TouchableOpacity>
                        <View style={styles.actionDivider} />
                        <TouchableOpacity
                            style={styles.actionItem}
                            activeOpacity={0.85}
                            onPress={handleNavigatePassword}
                        >
                            <View style={styles.actionTextContainer}>
                                <Text style={styles.actionTitle}>비밀번호 변경</Text>
                            </View>
                            <Text style={styles.actionChevron}>›</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
