type Locale = "ko" | "en";

const translations: Record<Locale, Record<string, string>> = {
	ko: {
		"auth.login.title": "다시 만나서 반가워요!",
		"auth.signup.title": "처음 오셨군요!",
		"auth.login.subtitle": "계정으로 로그인하거나, 게스트로 간단히 체험해보세요.",
		"auth.signup.subtitle": "간단히 회원가입하고 모든 기능을 이용해보세요.",
		"auth.login.primary": "로그인",
		"auth.signup.primary": "회원가입",
		"auth.toggle.toSignup": "아직 계정이 없으신가요?",
		"auth.toggle.toLogin": "이미 계정이 있으신가요?",
		"auth.toggle.signupAction": "회원가입",
		"auth.toggle.loginAction": "로그인",
		"auth.forgotPassword": "비밀번호를 잊으셨나요?",
		"onboarding.slide.search.title": "검색하고 저장하세요",
		"onboarding.slide.search.description": "사전에서 단어를 찾고 바로 단어장에 저장할 수 있어요.",
		"onboarding.slide.examples.title": "예문과 번역 제공",
		"onboarding.slide.examples.description": "AI가 생성하는 예문과 번역으로 의미를 쉽게 익혀요.",
		"onboarding.slide.favorites.title": "즐겨찾기로 복습",
		"onboarding.slide.favorites.description": "단어를 상태별로 분류해서 체계적으로 복습해보세요.",
		"onboarding.button.next": "다음",
		"onboarding.button.start": "시작하기",
	},
	en: {
		"auth.login.title": "Welcome back!",
		"auth.signup.title": "Nice to meet you!",
		"auth.login.subtitle": "Log in with your account or try the app as a guest.",
		"auth.signup.subtitle": "Sign up quickly to unlock every feature.",
		"auth.login.primary": "Log in",
		"auth.signup.primary": "Sign up",
		"auth.toggle.toSignup": "Don’t have an account yet?",
		"auth.toggle.toLogin": "Already have an account?",
		"auth.toggle.signupAction": "Sign up",
		"auth.toggle.loginAction": "Log in",
		"auth.forgotPassword": "Forgot your password?",
		"onboarding.slide.search.title": "Search & Save",
		"onboarding.slide.search.description": "Find words in the dictionary and save them instantly.",
		"onboarding.slide.examples.title": "Examples & Translations",
		"onboarding.slide.examples.description": "AI-generated examples and translations make meanings stick.",
		"onboarding.slide.favorites.title": "Review Favorites",
		"onboarding.slide.favorites.description": "Organize words by status and review with confidence.",
		"onboarding.button.next": "Next",
		"onboarding.button.start": "Get started",
	},
};

function resolveDefaultLocale(): Locale {
	try {
		const locale = Intl.DateTimeFormat().resolvedOptions().locale;
		if (locale?.toLowerCase().startsWith("ko")) {
			return "ko";
		}
	} catch {
		// Ignore resolution errors and fallback to Korean.
	}
	return "ko";
}

let activeLocale: Locale = resolveDefaultLocale();

export function t(key: string): string {
	const localePack = translations[activeLocale];
	if (localePack?.[key]) {
		return localePack[key];
	}
	const fallback = translations.en[key];
	return fallback ?? key;
}
