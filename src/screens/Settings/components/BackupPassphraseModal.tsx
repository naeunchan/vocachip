import React from "react";
import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";

import { createStyles } from "@/screens/Settings/SettingsScreen.styles";
import { t } from "@/shared/i18n";
import { useThemedStyles } from "@/theme/useThemedStyles";

type BackupPassphraseModalProps = {
    visible: boolean;
    backupAction: "export" | "import" | null;
    passphrase: string;
    backupError: string | null;
    onChangePassphrase: (text: string) => void;
    onClose: () => void;
    onConfirm: () => void;
};

export function BackupPassphraseModal({
    visible,
    backupAction,
    passphrase,
    backupError,
    onChangePassphrase,
    onClose,
    onConfirm,
}: BackupPassphraseModalProps) {
    const styles = useThemedStyles(createStyles);
    const isExportAction = backupAction === "export";

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.passphraseCard}>
                    <Text style={styles.passphraseTitle}>
                        {isExportAction ? t("settings.link.backupExport") : t("settings.link.backupImport")}
                    </Text>
                    <Text style={styles.passphraseSubtitle}>
                        {isExportAction ? t("settings.backup.exportHint") : t("settings.backup.importHint")}
                    </Text>
                    <TextInput
                        value={passphrase}
                        onChangeText={onChangePassphrase}
                        secureTextEntry
                        placeholder="암호 입력"
                        style={styles.passphraseInput}
                        autoFocus
                    />
                    {backupError ? <Text style={styles.passphraseError}>{backupError}</Text> : null}
                    <View style={styles.passphraseActions}>
                        <TouchableOpacity onPress={onClose} style={styles.passphraseButtonGhost}>
                            <Text style={styles.passphraseButtonGhostText}>취소</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onConfirm} style={styles.passphraseButton}>
                            <Text style={styles.passphraseButtonText}>확인</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
