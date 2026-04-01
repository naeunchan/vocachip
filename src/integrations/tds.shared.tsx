import React from "react";
import {
    Pressable,
    type PressableProps,
    type StyleProp,
    Text,
    TextInput,
    type TextInputProps,
    View,
    type ViewStyle,
} from "react-native";

type TDSProviderProps = {
    children: React.ReactNode;
    colorPreference?: "light" | "dark";
};

type ButtonProps = Omit<PressableProps, "style"> & {
    children: React.ReactNode;
    type?: "primary" | "danger" | "light" | "dark";
    style?: "fill" | "weak";
    display?: "block" | "full" | "inline";
    size?: "big" | "large" | "medium" | "tiny";
};

type TextFieldProps = TextInputProps & {
    variant?: "box" | "line" | "big" | "hero";
    label?: string;
    labelOption?: "appear" | "sustain";
};

type TopProps = {
    title: React.ReactNode;
    subtitle1?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
};

export function TDSProvider({ children }: TDSProviderProps) {
    return <>{children}</>;
}

export function Button({ children, ...props }: ButtonProps) {
    return (
        <Pressable {...props}>
            <Text>{children}</Text>
        </Pressable>
    );
}

export function TextField({ label, ...props }: TextFieldProps) {
    return (
        <View>
            {label ? <Text>{label}</Text> : null}
            <TextInput {...props} />
        </View>
    );
}

export function Top({ title, subtitle1, style }: TopProps) {
    return (
        <View style={style}>
            <Text>{title}</Text>
            {subtitle1 ? <Text>{subtitle1}</Text> : null}
        </View>
    );
}
