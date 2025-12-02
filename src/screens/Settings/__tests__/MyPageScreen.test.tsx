import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Alert } from "react-native";

import { MyPageScreen } from "@/screens/Settings/MyPageScreen";

const createProps = () => ({
    username: "alex",
    displayName: "Alex",
    onNavigateNickname: jest.fn(),
    onNavigatePassword: jest.fn(),
    onNavigateDeleteAccount: jest.fn(),
});

describe("MyPageScreen", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("shows an alert when username is missing for profile navigation", () => {
        const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
        const props = { ...createProps(), username: "" };
        const { getByText } = render(<MyPageScreen {...props} />);

        fireEvent.press(getByText("닉네임 수정"));
        expect(alertSpy).toHaveBeenCalledWith("마이 페이지", expect.any(String));
        expect(props.onNavigateNickname).not.toHaveBeenCalled();
    });

    it("navigates to password screen when tapped", () => {
        const props = createProps();
        const { getByText } = render(<MyPageScreen {...props} />);

        fireEvent.press(getByText("비밀번호 변경"));
        expect(props.onNavigatePassword).toHaveBeenCalled();
    });
});
