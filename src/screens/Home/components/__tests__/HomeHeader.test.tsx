import { render } from "@testing-library/react-native";
import React from "react";

import { HomeHeader } from "@/screens/Home/components/HomeHeader";
import { HOME_HEADER_TEXT } from "@/screens/Home/constants";

describe("HomeHeader", () => {
    it("renders user name when provided", () => {
        const { getByText } = render(<HomeHeader userName="Alex" />);
        expect(getByText(/Alex님/)).toBeTruthy();
        expect(getByText(HOME_HEADER_TEXT.badgeLabel)).toBeTruthy();
    });

    it("falls back to default display name when user name is empty", () => {
        const { getByText } = render(<HomeHeader userName="" />);
        expect(getByText(new RegExp(HOME_HEADER_TEXT.defaultDisplayName))).toBeTruthy();
    });
});
