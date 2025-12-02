import { ExampleUpdate } from "@/api/dictionary/exampleGenerator";
import { DictionaryMode, WordResult } from "@/services/dictionary/types";
import { applyExampleUpdates, clearPendingFlags } from "@/services/dictionary/utils/mergeExampleUpdates";

const buildResult = (): WordResult => ({
    word: "apple",
    phonetic: "/ˈæp.əl/",
    audioUrl: null,
    meanings: [
        {
            partOfSpeech: "noun",
            definitions: [
                {
                    definition: "An apple",
                    example: undefined,
                    originalDefinition: undefined,
                    pendingExample: true,
                    pendingTranslation: true,
                },
            ],
        },
    ],
});

describe("mergeExampleUpdates", () => {
    it("clears pending flags when no updates", () => {
        const result = buildResult();
        const cleared = clearPendingFlags(result);

        expect(cleared.meanings[0].definitions[0].pendingExample).toBe(false);
        expect(cleared.meanings[0].definitions[0].pendingTranslation).toBe(false);
    });

    it("applies example updates and clears flags for en-en", () => {
        const result = buildResult();
        const updates: ExampleUpdate[] = [
            { meaningIndex: 0, definitionIndex: 0, example: "This is an apple.", translatedDefinition: null },
        ];

        const merged = applyExampleUpdates(result, updates, "en-en");
        const definition = merged.meanings[0].definitions[0];

        expect(definition.example).toBe("This is an apple.");
        expect(definition.pendingExample).toBe(false);
        expect(definition.pendingTranslation).toBe(false);
    });

    it("applies translated definition for en-ko mode", () => {
        const result = buildResult();
        const updates: ExampleUpdate[] = [
            {
                meaningIndex: 0,
                definitionIndex: 0,
                example: "This is an apple.",
                translatedDefinition: "이것은 사과입니다.",
            },
        ];

        const merged = applyExampleUpdates(result, updates, "en-ko" as DictionaryMode);
        const definition = merged.meanings[0].definitions[0];

        expect(definition.definition).toBe("이것은 사과입니다.");
        expect(definition.originalDefinition).toBe("An apple");
        expect(definition.pendingTranslation).toBe(false);
    });
});
