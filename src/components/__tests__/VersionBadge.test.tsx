import { render } from "@testing-library/react-native";
import React from "react";

import { VersionBadge } from "@/components/VersionBadge/VersionBadge";

describe("VersionBadge", () => {
    it("renders version label", () => {
        const { getByText } = render(<VersionBadge label="1.2.3" />);

        expect(getByText("버전 1.2.3")).toBeTruthy();
    });
});
