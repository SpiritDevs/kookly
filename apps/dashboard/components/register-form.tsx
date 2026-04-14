"use client";

import { useGT, useLocale } from "gt-next";
import { useMutation } from "convex/react";
import {
  Apple,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { useState, useTransition } from "react";
import { api } from "@convex/_generated/api";
import { pickDashboardLanguage } from "@convex/lib/dashboardLanguage";
import { GoogleGlyph } from "@/components/google-glyph";
import { AuthMessage } from "@/components/auth-message";
import { PasswordFieldWithStrength } from "@/components/password-field-with-strength";
import { Field, TextInput, buttonClasses } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-strength";

function GitHubGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.18-3.37-1.18-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.5 9.5 0 0 1 12 6.84c.85 0 1.71.11 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.86v2.77c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"
      />
    </svg>
  );
}

function GitLabGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="currentColor" d="M12 21.53 16.42 7.9h-8.84L12 21.53Z" />
      <path fill="currentColor" d="M12 21.53 7.58 7.9H3.9L12 21.53Z" opacity="0.72" />
      <path
        fill="currentColor"
        d="M3.9 7.9 2.56 12.02a.91.91 0 0 0 .33 1.02L12 21.53 3.9 7.9Z"
        opacity="0.54"
      />
      <path
        fill="currentColor"
        d="M20.1 7.9 21.44 12.02a.91.91 0 0 1-.33 1.02L12 21.53 20.1 7.9Z"
        opacity="0.54"
      />
      <path fill="currentColor" d="M12 21.53 16.42 7.9h3.68L12 21.53Z" opacity="0.72" />
      <path fill="currentColor" d="M7.58 7.9 9.38 2.37c.1-.3.51-.3.61 0L12 7.9H7.58Z" />
      <path fill="currentColor" d="M12 7.9 14 2.37c.1-.3.51-.3.61 0l1.81 5.53H12Z" />
    </svg>
  );
}

const ssoProviders = [
  {
    key: "google",
    label: "Google",
    icon: <GoogleGlyph className="size-4" />,
  },
  {
    key: "apple",
    label: "Apple",
    icon: <Apple className="size-4" strokeWidth={1.9} />,
  },
  {
    key: "passkey",
    label: "Passkey",
    icon: <KeyRound className="size-4" strokeWidth={1.9} />,
  },
  {
    key: "github",
    label: "GitHub",
    icon: <GitHubGlyph />,
  },
  {
    key: "gitlab",
    label: "GitLab",
    icon: <GitLabGlyph />,
  },
  {
    key: "saml",
    label: "SAML",
    icon: <ShieldCheck className="size-4" strokeWidth={1.9} />,
  },
] as const;

const SIGN_UP_LANGUAGE_PERSIST_ATTEMPTS = 5;
const SIGN_UP_LANGUAGE_PERSIST_DELAY_MS = 250;

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getErrorMessage(error: unknown, gt: ReturnType<typeof useGT>) {
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }

    if ("error" in error && typeof error.error === "object" && error.error) {
      const nestedError = error.error as { message?: unknown };

      if (typeof nestedError.message === "string") {
        return nestedError.message;
      }
    }
  }

  return gt("We couldn’t create your account. Try again in a moment.");
}

function isTransientDashboardLanguageError(error: unknown) {
  const message =
    typeof error === "string"
      ? error
      : error &&
          typeof error === "object" &&
          "message" in error &&
          typeof error.message === "string"
        ? error.message
        : null;

  if (!message) {
    return false;
  }

  return (
    message.includes("Unauthorized") || message.includes("Unauthenticated")
  );
}

export function RegisterForm() {
  const gt = useGT();
  const locale = useLocale();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const persistDashboardLanguage = useMutation(api.users.setDashboardLanguage);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(
        gt("Password must be at least {minPasswordLength} characters.", {
          minPasswordLength: MIN_PASSWORD_LENGTH,
        }),
      );
      return;
    }

    const given = firstName.trim();
    const family = lastName.trim();
    if (!given || !family) {
      setErrorMessage(gt("Please enter your first and last name."));
      return;
    }

    startTransition(async () => {
      try {
        const dashboardLanguage = pickDashboardLanguage(
          typeof navigator === "undefined"
            ? [locale]
            : [...navigator.languages, navigator.language, locale],
        );
        const result = await authClient.signUp.email({
          name: `${given} ${family}`,
          email,
          password,
        });

        if (result.error) {
          setErrorMessage(getErrorMessage(result.error, gt));
          return;
        }

        for (
          let attempt = 0;
          attempt < SIGN_UP_LANGUAGE_PERSIST_ATTEMPTS;
          attempt += 1
        ) {
          try {
            await persistDashboardLanguage({
              dashboardLanguage,
            });
            break;
          } catch (error) {
            const isLastAttempt =
              attempt === SIGN_UP_LANGUAGE_PERSIST_ATTEMPTS - 1;

            if (!isTransientDashboardLanguageError(error)) {
              throw error;
            }

            if (isLastAttempt) {
              break;
            }

            await delay(SIGN_UP_LANGUAGE_PERSIST_DELAY_MS);
          }
        }

        window.location.assign("/onboarding");
      } catch (error) {
        setErrorMessage(getErrorMessage(error, gt));
      }
    });
  };

  return (
    <>
      <div className="grid grid-cols-6 gap-2">
        {ssoProviders.map((provider) => (
          <button
            key={provider.key}
            type="button"
            disabled
            aria-label={gt(provider.label)}
            title={gt(provider.label)}
            className={buttonClasses({
              variant: "secondary",
              className:
                "h-11 w-full rounded-lg border-[var(--line)] bg-white/78 px-0 text-[var(--panel-ink)] shadow-[inset_0_1px_0_color-mix(in_srgb,white_84%,transparent)] hover:border-[var(--line)] hover:bg-white/78 hover:shadow-[inset_0_1px_0_color-mix(in_srgb,white_84%,transparent)] disabled:border-[color-mix(in_srgb,var(--line)_84%,white)] disabled:bg-white/66 disabled:text-[color-mix(in_srgb,var(--panel-ink)_78%,white)] disabled:opacity-100",
            })}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--canvas)_35%,white)] text-[var(--panel-ink)]">
              {provider.icon}
            </span>
          </button>
        ))}
      </div>

      <div className="relative flex items-center gap-4 py-1">
        <div className="h-px flex-1 bg-[var(--line)]" />
        <span className="shrink-0 font-[family-name:var(--font-dashboard-mono)] text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--ink-muted)]">
          {gt("or email")}
        </span>
        <div className="h-px flex-1 bg-[var(--line)]" />
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
          <Field label={gt("First name")}>
            <TextInput
              type="text"
              name="firstName"
              placeholder={gt("Alex")}
              autoComplete="given-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
              className="rounded-lg border-[var(--line)] bg-white/90 shadow-[inset_0_1px_0_color-mix(in_srgb,white_80%,transparent)]"
            />
          </Field>
          <Field label={gt("Last name")}>
            <TextInput
              type="text"
              name="lastName"
              placeholder={gt("Mercer")}
              autoComplete="family-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
              className="rounded-lg border-[var(--line)] bg-white/90 shadow-[inset_0_1px_0_color-mix(in_srgb,white_80%,transparent)]"
            />
          </Field>
        </div>
        <Field label={gt("Work email")}>
          <TextInput
            type="email"
            name="email"
            placeholder={gt("you@company.com")}
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="rounded-lg border-[var(--line)] bg-white/90 shadow-[inset_0_1px_0_color-mix(in_srgb,white_80%,transparent)]"
          />
        </Field>
        <PasswordFieldWithStrength
          hint={gt("At least {minPasswordLength} characters", {
            minPasswordLength: MIN_PASSWORD_LENGTH,
          })}
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          inputClassName="rounded-lg border-[var(--line)] bg-white/90 shadow-[inset_0_1px_0_color-mix(in_srgb,white_80%,transparent)]"
        />
        {errorMessage ? <AuthMessage tone="danger">{errorMessage}</AuthMessage> : null}
        <button
          type="submit"
          disabled={isPending}
          className={buttonClasses({
            className:
              "h-12 w-full rounded-lg text-[15px] font-semibold shadow-[0_12px_40px_-12px_color-mix(in_srgb,var(--accent)_55%,transparent)]",
          })}
        >
          {isPending
            ? gt("Creating account...")
            : gt("Continue to onboarding")}
        </button>
      </form>
    </>
  );
}
