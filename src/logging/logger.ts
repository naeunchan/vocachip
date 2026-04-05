import { getRuntimeConfig } from "@/config/runtime";
import type { AppError } from "@/errors/AppError";

type SentryModule = typeof import("@sentry/react-native");

let initialized = false;
let hasSentryDsn = false;
let sentryModule: SentryModule | null | undefined;

function getSentryModule(): SentryModule | null {
    if (sentryModule !== undefined) {
        return sentryModule;
    }

    try {
        sentryModule = require("@sentry/react-native") as SentryModule;
    } catch (error) {
        sentryModule = null;
        console.warn("[logger] Sentry unavailable in current runtime.", error);
    }

    return sentryModule;
}

function getConsoleErrorMessage(error: unknown) {
    if (error instanceof Error) {
        return error.message || error.name;
    }

    if (typeof error === "string") {
        return error;
    }

    return "Unknown error";
}

function getConsoleContext(context?: Record<string, unknown>) {
    if (!context) {
        return undefined;
    }

    const { componentStack: _componentStack, stack: _stack, ...rest } = context;

    return Object.keys(rest).length > 0 ? rest : undefined;
}

export function initializeLogging() {
    if (initialized) {
        return;
    }
    initialized = true;
    const runtime = getRuntimeConfig();
    const dsn = globalThis.process?.env?.VOCACHIP_SENTRY_DSN ?? runtime.sentryDsn;
    if (!dsn) {
        console.info("[logger] Sentry disabled (missing DSN).");
        return;
    }
    const Sentry = getSentryModule();
    if (!Sentry) {
        console.info("[logger] Sentry disabled (module unavailable).");
        return;
    }
    Sentry.init({
        dsn,
        debug: __DEV__,
        tracesSampleRate: 0.1,
        enableNative: runtime.runtimeTarget !== "apps-in-toss",
    });
    const appVersion = runtime.appVersion || runtime.versionLabel;
    if (appVersion) {
        Sentry.setTag("app_version", String(appVersion));
    }
    hasSentryDsn = true;
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
    const Sentry = hasSentryDsn ? getSentryModule() : null;
    if (hasSentryDsn && Sentry) {
        if (context) {
            Sentry.addBreadcrumb({
                category: "error",
                level: "error",
                message: "app_exception",
                data: context,
            });
        }
        Sentry.captureException(error, { extra: context });
    } else {
        const message = getConsoleErrorMessage(error);
        const consoleContext = getConsoleContext(context);

        if (consoleContext) {
            console.error("[logger] exception", message, consoleContext);
            return;
        }

        console.error("[logger] exception", message);
    }
}

export function captureAppError(error: AppError, context?: Record<string, unknown>) {
    const payload = {
        kind: error.kind,
        code: error.code,
        retryable: error.retryable,
        ...context,
    };
    captureException(error.cause ?? new Error(error.message), payload);
}

export function setUserContext(userId: number | string | null | undefined) {
    const Sentry = hasSentryDsn ? getSentryModule() : null;
    if (hasSentryDsn && Sentry) {
        if (userId) {
            Sentry.setUser({ id: String(userId) });
        } else {
            Sentry.setUser(null);
        }
    }
}
