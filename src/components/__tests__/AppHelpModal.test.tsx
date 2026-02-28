import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

import { AppHelpModal } from "@/components/AppHelpModal/AppHelpModal";

jest.mock("react-native/Libraries/Modal/Modal", () => {
    const React = require("react");
    const { View } = require("react-native");
    const MockModal = ({ visible, children, ...rest }: { visible: boolean; children: React.ReactNode }) =>
        visible ? (
            <View testID="mock-modal" {...rest}>
                {children}
            </View>
        ) : null;
    MockModal.displayName = "MockModal";
    (MockModal as any).default = MockModal;
    (MockModal as any).__esModule = true;
    return MockModal;
});

describe("AppHelpModal", () => {
    it("does not render content when invisible", () => {
        const { queryByText } = render(<AppHelpModal visible={false} onDismiss={jest.fn()} />);
        expect(queryByText("Vocachip 사용 안내")).toBeNull();
    });

    it("renders help content and handles dismiss", () => {
        const onDismiss = jest.fn();
        const { getByText } = render(<AppHelpModal visible onDismiss={onDismiss} />);

        expect(getByText("Vocachip 사용 안내")).toBeTruthy();
        fireEvent.press(getByText("시작하기"));
        expect(onDismiss).toHaveBeenCalled();
    });
});
