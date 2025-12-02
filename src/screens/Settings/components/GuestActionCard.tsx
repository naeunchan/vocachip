import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { createStyles } from "@/screens/Settings/SettingsScreen.styles";
import { useThemedStyles } from "@/theme/useThemedStyles";

type GuestActionCardProps = {
    onSignUp: () => void;
    onLogin: () => void;
};

export function GuestActionCard({ onSignUp, onLogin }: GuestActionCardProps) {
    const styles = useThemedStyles(createStyles);
    return (
        <View style={styles.guestCard}>
            <Text style={styles.guestTitle}>게스트 모드로 이용 중이에요.</Text>
            <Text style={styles.guestDescription}>계정을 만들면 단어 저장 제한 없이 모든 기능을 사용할 수 있어요.</Text>
            <TouchableOpacity style={styles.primaryCta} onPress={onSignUp} activeOpacity={0.85}>
                <Text style={styles.primaryCtaText}>회원가입 후 계속하기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryCta} onPress={onLogin} activeOpacity={0.85}>
                <Text style={styles.secondaryCtaText}>기존 계정으로 로그인</Text>
            </TouchableOpacity>
        </View>
    );
}
