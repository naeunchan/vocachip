import { render } from "@testing-library/react-native";
import React from "react";

import { LoadingState } from "@/components/LoadingState/LoadingState";

describe("LoadingState", () => {
    it("renders spinner and message", () => {
        const { getByText, UNSAFE_getByType } = render(<LoadingState message="불러오는 중..." />);

        expect(getByText("불러오는 중...")).toBeTruthy();
        expect(UNSAFE_getByType(require("react-native").ActivityIndicator)).toBeTruthy();
    });
});
