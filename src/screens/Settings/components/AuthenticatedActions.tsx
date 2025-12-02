import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { createStyles } from "@/screens/Settings/SettingsScreen.styles";
import { useThemedStyles } from "@/theme/useThemedStyles";

type AuthenticatedActionsProps = {
    canLogout: boolean;
    onLogout: () => void;
    onNavigateProfile: () => void;
    onNavigateAccountDeletion: () => void;
};

export function AuthenticatedActions({
    canLogout,
    onLogout,
    onNavigateProfile,
    onNavigateAccountDeletion,
}: AuthenticatedActionsProps) {
    const styles = useThemedStyles(createStyles);
    return (
        <View style={styles.section}>
            <Text style={styles.sectionLabel}>계정</Text>
            <View style={styles.sectionCard}>
                <TouchableOpacity
                    style={[styles.row, styles.rowBorder]}
                    activeOpacity={0.6}
                    onPress={onNavigateProfile}
                >
                    <Text style={styles.rowLabel}>계정 정보 관리</Text>
                    <Text style={styles.rowChevron}>›</Text>
                </TouchableOpacity>
                {canLogout ? (
                    <TouchableOpacity style={[styles.row, styles.rowBorder]} activeOpacity={0.6} onPress={onLogout}>
                        <Text style={[styles.rowLabel, styles.rowDangerText]}>로그아웃</Text>
                        <Text style={[styles.rowChevron, styles.rowDangerText]}>›</Text>
                    </TouchableOpacity>
                ) : null}
                <TouchableOpacity style={[styles.row]} activeOpacity={0.6} onPress={onNavigateAccountDeletion}>
                    <Text style={[styles.rowLabel, styles.rowDangerText]}>회원탈퇴</Text>
                    <Text style={[styles.rowChevron, styles.rowDangerText]}>›</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
