import { generateRandomDisplayName } from "@/utils/randomDisplayName";

describe("generateRandomDisplayName", () => {
    afterEach(() => {
        jest.spyOn(Math, "random").mockRestore();
    });

    it("combines adjective, noun, and a 2-digit number", () => {
        jest.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0.9).mockReturnValueOnce(0);

        expect(generateRandomDisplayName()).toBe("푸른사자10");
    });

    it("produces numbers between 10 and 99 inclusive", () => {
        jest.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(0.9999);

        const name = generateRandomDisplayName();
        const numberSuffix = Number(name.replace(/^\D+/, ""));
        expect(numberSuffix).toBe(99);
    });
});
