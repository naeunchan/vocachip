const ADJECTIVES = ["푸른", "행복한", "용감한", "빛나는", "재빠른", "따뜻한", "단단한", "상냥한", "명랑한", "차분한"];

const NOUNS = ["고래", "여우", "돌고래", "참새", "펭귄", "사슴", "고양이", "호랑이", "부엉이", "사자"];

function getRandomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

export function generateRandomDisplayName() {
    const adjective = getRandomItem(ADJECTIVES);
    const noun = getRandomItem(NOUNS);
    const number = Math.floor(Math.random() * 90) + 10; // 10~99
    return `${adjective}${noun}${number}`;
}
