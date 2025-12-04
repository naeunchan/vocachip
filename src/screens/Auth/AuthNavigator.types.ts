import type { LoginScreenProps } from "@/screens/Auth/LoginScreen.types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

export type AuthStackParamList = {
    Login: undefined;
};

export type AuthNavigatorProps = {
    loginProps: LoginScreenProps;
};
