export type LearningStatus = "memorize" | "review" | "mastered";
export type QuizResult = "correct" | "wrong";

export interface DictionaryDefinitionItem {
  meaning: string;
  example: string;
}

export interface DictionarySection {
  label: string;
  items: DictionaryDefinitionItem[];
}

export interface VocabularyEntry {
  id: string;
  word: string;
  phonetic: string;
  audioUrl?: string | null;
  partOfSpeech: string;
  meaning: string;
  definition: string;
  usageTip: string;
  saved: boolean;
  status: LearningStatus;
  exampleVariants: string[];
  dictionarySections?: DictionarySection[];
  reviewIntervalDays: number;
  nextReviewAt: string | null;
  lastReviewedAt: string | null;
  correctStreak: number;
  wrongCount: number;
  lastWrongAt: string | null;
  lastQuizResult: QuizResult | null;
}

export const statusLabels: Record<LearningStatus, string> = {
  memorize: "새 단어",
  review: "복습",
  mastered: "완료",
};

export const statusDescriptions: Record<LearningStatus, string> = {
  memorize: "막 저장했거나 아직 충분히 익숙하지 않은 단어를 먼저 익혀요.",
  review: "오늘 다시 확인해야 하는 단어를 모아뒀어요.",
  mastered: "지금까지 잘 기억하고 있는 단어를 정리해 뒀어요.",
};

export const defaultSearchHistory: string[] = [];
export const defaultStreakDays = 0;

export const defaultWordLearningProgress = {
  reviewIntervalDays: 0,
  nextReviewAt: null,
  lastReviewedAt: null,
  correctStreak: 0,
  wrongCount: 0,
  lastWrongAt: null,
  lastQuizResult: null,
} as const satisfies Pick<
  VocabularyEntry,
  | "reviewIntervalDays"
  | "nextReviewAt"
  | "lastReviewedAt"
  | "correctStreak"
  | "wrongCount"
  | "lastWrongAt"
  | "lastQuizResult"
>;

const searchableWords: VocabularyEntry[] = [
  {
    id: "take",
    word: "take",
    phonetic: "/teɪk/",
    partOfSpeech: "noun",
    meaning: "행동, 해석",
    definition:
      "the act of taking something or a person's particular opinion on a situation",
    usageTip:
      "동사 외에도 명사로 자주 쓰이며 관점이나 해석을 말할 때 유용해요.",
    saved: false,
    status: "memorize",
    exampleVariants: [
      "Taking a moment to breathe is essential.",
      "His take on the issue was insightful and unique.",
      "She decided to take the job after the interview.",
    ],
    dictionarySections: [
      {
        label: "Noun",
        items: [
          {
            meaning: "The act or process of taking something.",
            example: "Taking a moment to breathe is essential.",
          },
          {
            meaning:
              "Something taken or a person's interpretation of a situation.",
            example: "His take on the issue was insightful and unique.",
          },
        ],
      },
      {
        label: "Verb",
        items: [
          {
            meaning: "To get into your hands, possession, or control.",
            example: "She decided to take the job after the interview.",
          },
          {
            meaning: "To accept or receive something that is offered.",
            example: "He took my advice and applied for the position.",
          },
        ],
      },
    ],
  },
  {
    id: "make",
    word: "make",
    phonetic: "/meɪk/",
    partOfSpeech: "noun",
    meaning: "종류, 제작 방식",
    definition: "a brand, kind, model, or the way in which something is made",
    usageTip:
      "가장 기본적인 동사지만 명사로는 제품 종류나 스타일을 가리킬 때도 써요.",
    saved: false,
    status: "memorize",
    exampleVariants: [
      "This is the latest make of smartphone.",
      "The car was built with a unique make and model.",
      "She can make a cake from scratch.",
    ],
    dictionarySections: [
      {
        label: "Noun",
        items: [
          {
            meaning: "A brand, model, or kind of something.",
            example: "This is the latest make of smartphone.",
          },
          {
            meaning: "A particular style or form in which something is built.",
            example: "The car was built with a unique make and model.",
          },
        ],
      },
      {
        label: "Verb",
        items: [
          {
            meaning: "To create, build, or produce something.",
            example: "She can make a cake from scratch.",
          },
          {
            meaning: "To act in a particular way or cause a result.",
            example: "He tends to make excuses for being late.",
          },
        ],
      },
    ],
  },
  {
    id: "clarify",
    word: "clarify",
    phonetic: "/ˈklær.ə.faɪ/",
    partOfSpeech: "verb",
    meaning: "명확하게 하다",
    definition: "to make an idea, situation, or statement easier to understand",
    usageTip: "모호했던 내용을 분명하게 정리할 때 자주 써요.",
    saved: true,
    status: "memorize",
    exampleVariants: [
      "Could you clarify the final deadline before we leave the meeting?",
      "The chart clarifies how fast the new users stayed active this week.",
      "She clarified the concept with a short and simple example.",
    ],
  },
  {
    id: "retain",
    word: "retain",
    phonetic: "/rɪˈteɪn/",
    partOfSpeech: "verb",
    meaning: "유지하다, 기억하다",
    definition: "to keep something and continue to have it",
    usageTip: "정보를 기억하거나 기존 상태를 유지할 때 모두 쓸 수 있어요.",
    saved: true,
    status: "review",
    exampleVariants: [
      "It is easier to retain a word when you hear it in different sentences.",
      "The service retained most of its weekly users after the update.",
      "She retained the key phrase by reviewing it before bed.",
    ],
  },
  {
    id: "diligent",
    word: "diligent",
    phonetic: "/ˈdɪl.ɪ.dʒənt/",
    partOfSpeech: "adjective",
    meaning: "성실한",
    definition: "careful and using a lot of effort in your work or study",
    usageTip: "꾸준히 노력하는 태도를 긍정적으로 표현할 때 좋아요.",
    saved: true,
    status: "memorize",
    exampleVariants: [
      "He is diligent about reviewing one English word every morning.",
      "A diligent teammate usually writes clear notes after each meeting.",
      "Her diligent study routine made the new vocabulary stick longer.",
    ],
  },
  {
    id: "sustain",
    word: "sustain",
    phonetic: "/səˈsteɪn/",
    partOfSpeech: "verb",
    meaning: "지속하다",
    definition: "to keep something going for a period of time",
    usageTip: "성과나 습관을 오래 유지하는 맥락에서 자주 등장해요.",
    saved: true,
    status: "review",
    exampleVariants: [
      "Small habits are easier to sustain than dramatic study plans.",
      "The team found a way to sustain user growth without extra ads.",
      "Drinking water and sleeping well helped him sustain his focus.",
    ],
  },
  {
    id: "subtle",
    word: "subtle",
    phonetic: "/ˈsʌt.əl/",
    partOfSpeech: "adjective",
    meaning: "미묘한",
    definition: "not obvious; small but important enough to notice",
    usageTip: "강한 차이보다는 은근한 차이나 뉘앙스를 말할 때 적합해요.",
    saved: true,
    status: "mastered",
    exampleVariants: [
      "There was a subtle change in her tone after the feedback session.",
      "The app uses subtle animations to guide the user between steps.",
      "He noticed a subtle difference between the two dictionary entries.",
    ],
  },
  {
    id: "grasp",
    word: "grasp",
    phonetic: "/ɡræsp/",
    partOfSpeech: "verb",
    meaning: "이해하다, 꽉 잡다",
    definition: "to understand something difficult or to hold something firmly",
    usageTip: "추상적 이해와 물리적 동작 둘 다 표현할 수 있는 단어예요.",
    saved: true,
    status: "memorize",
    exampleVariants: [
      "Once you grasp the pattern, the new words feel less intimidating.",
      "She quickly grasped why the customer was confused by the message.",
      "It took a few examples before I fully grasped the grammar point.",
    ],
  },
  {
    id: "convey",
    word: "convey",
    phonetic: "/kənˈveɪ/",
    partOfSpeech: "verb",
    meaning: "전달하다",
    definition: "to communicate an idea, feeling, or information to someone",
    usageTip: "의미나 감정을 정확하게 전한다는 뉘앙스가 있어요.",
    saved: true,
    status: "review",
    exampleVariants: [
      "A short diagram can convey the message faster than a long paragraph.",
      "Her face conveyed relief before she said anything.",
      "He tried to convey the benefit in plain and simple English.",
    ],
  },
  {
    id: "immerse",
    word: "immerse",
    phonetic: "/ɪˈmɝːs/",
    partOfSpeech: "verb",
    meaning: "몰입시키다",
    definition: "to become completely involved in something",
    usageTip: "언어 환경이나 활동 속에 깊게 들어가는 느낌이 강해요.",
    saved: true,
    status: "mastered",
    exampleVariants: [
      "She immersed herself in English podcasts during her commute.",
      "The short quiz helps users immerse themselves in real usage quickly.",
      "Traveling abroad is one way to immerse yourself in daily conversation.",
    ],
  },
  {
    id: "resilient",
    word: "resilient",
    phonetic: "/rɪˈzɪl.jənt/",
    partOfSpeech: "adjective",
    meaning: "회복력이 있는",
    definition: "able to recover quickly after difficulties or change",
    usageTip: "조직, 사람, 제품 모두에 쓸 수 있는 실무 단어예요.",
    saved: true,
    status: "memorize",
    exampleVariants: [
      "A resilient learner keeps going even after a rough practice test.",
      "The service needs a resilient system before the public launch.",
      "She stayed resilient when the first few interviews did not go well.",
    ],
  },
  {
    id: "vivid",
    word: "vivid",
    phonetic: "/ˈvɪv.ɪd/",
    partOfSpeech: "adjective",
    meaning: "생생한",
    definition: "producing clear, powerful, and detailed images in the mind",
    usageTip: "기억, 묘사, 색감이 매우 또렷하다는 뜻으로 자주 써요.",
    saved: true,
    status: "review",
    exampleVariants: [
      "The article used vivid verbs to make the story easy to imagine.",
      "I still have a vivid memory of hearing that phrase for the first time.",
      "Her vivid explanation made the abstract idea feel concrete.",
    ],
  },
  {
    id: "concise",
    word: "concise",
    phonetic: "/kənˈsaɪs/",
    partOfSpeech: "adjective",
    meaning: "간결한",
    definition: "giving a lot of information clearly in a few words",
    usageTip: "메시지, 문장, 발표 자료가 군더더기 없이 짧을 때 잘 어울려요.",
    saved: false,
    status: "memorize",
    exampleVariants: [
      "A concise summary is easier to scan on a small mobile screen.",
      "She rewrote the note so it felt concise and direct.",
      "The best definitions are concise without losing the core meaning.",
    ],
  },
  {
    id: "adapt",
    word: "adapt",
    phonetic: "/əˈdæpt/",
    partOfSpeech: "verb",
    meaning: "적응하다, 맞추다",
    definition: "to change your behavior or idea to fit a new situation",
    usageTip: "환경에 스스로 적응하거나 무엇을 맞게 바꾸는 경우 모두 가능해요.",
    saved: false,
    status: "memorize",
    exampleVariants: [
      "You need to adapt your study plan when your schedule changes.",
      "The copy was adapted for users who are still new to English learning.",
      "She adapted quickly to the faster pace of the new team.",
    ],
  },
  {
    id: "reluctant",
    word: "reluctant",
    phonetic: "/rɪˈlʌk.tənt/",
    partOfSpeech: "adjective",
    meaning: "꺼리는, 내키지 않는",
    definition: "not willing to do something and therefore slow to do it",
    usageTip: "하기 싫어서 망설이는 감정을 비교적 부드럽게 표현해요.",
    saved: false,
    status: "memorize",
    exampleVariants: [
      "He was reluctant to speak before checking the exact meaning.",
      "Some beginners feel reluctant to use new words out loud.",
      "She sounded reluctant, but she still agreed to try the quiz.",
    ],
  },
  {
    id: "thrive",
    word: "thrive",
    phonetic: "/θraɪv/",
    partOfSpeech: "verb",
    meaning: "번영하다, 잘 자라다",
    definition: "to grow strongly and do very well",
    usageTip: "사람, 서비스, 식물 등 폭넓게 쓸 수 있고 긍정적인 느낌이 강해요.",
    saved: false,
    status: "memorize",
    exampleVariants: [
      "Learners thrive when the feedback is quick and encouraging.",
      "The product can thrive if retention stays strong after week one.",
      "He thrives in environments where he can ask many questions.",
    ],
  },
];

export const defaultWords: VocabularyEntry[] = searchableWords.map((word) => ({
  ...defaultWordLearningProgress,
  ...word,
  saved: false,
  status: "memorize",
}));
