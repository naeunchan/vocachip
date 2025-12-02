import { useEffect, useMemo, useState } from "react";
import { AI_HEALTH_URL, OPENAI_FEATURE_ENABLED } from "@/config/openAI";

export type AIStatus = "unavailable" | "healthy" | "degraded";

type AIStatusResult = {
	status: AIStatus;
	lastCheckedAt: number | null;
	errorMessage?: string | null;
	refresh: () => void;
};

async function fetchHealth(): Promise<AIStatus> {
	if (!OPENAI_FEATURE_ENABLED || !AI_HEALTH_URL) {
		return "unavailable";
	}

	try {
		const response = await fetch(AI_HEALTH_URL, { method: "GET" });
		if (!response.ok) {
			return "degraded";
		}
		const data = await response.json();
		if (data?.status === "ok" || data?.status === "healthy") {
			return "healthy";
		}
		return "degraded";
	} catch {
		return "degraded";
	}
}

export function useAIStatus(): AIStatusResult {
	const [status, setStatus] = useState<AIStatus>(() => {
		if (!OPENAI_FEATURE_ENABLED || !AI_HEALTH_URL) return "unavailable";
		return "degraded";
	});
	const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [refreshToken, setRefreshToken] = useState(0);

	useEffect(() => {
		if (!OPENAI_FEATURE_ENABLED || !AI_HEALTH_URL) {
			return;
		}

		let canceled = false;
		async function check() {
			const nextStatus = await fetchHealth();
			if (canceled) return;
			setStatus(nextStatus);
			setLastCheckedAt(Date.now());
			setErrorMessage(nextStatus === "degraded" ? "AI 프록시 응답이 원활하지 않습니다." : null);
		}
		void check();
		return () => {
			canceled = true;
		};
	}, [refreshToken]);

	const refresh = useMemo(() => () => setRefreshToken((prev) => prev + 1), []);

	return { status, lastCheckedAt, errorMessage, refresh };
}
