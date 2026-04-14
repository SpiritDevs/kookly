import { getGT } from "gt-next/server";
import Link from "next/link";
import { AuthenticatedLoginRedirect } from "@/components/authenticated-login-redirect";
import { ConvexProviderBoundary } from "@/components/convex-provider-boundary";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const gt = await getGT();

  return (
    <>
      <ConvexProviderBoundary fallback={null}>
        <AuthenticatedLoginRedirect />
      </ConvexProviderBoundary>
      <div className="relative min-h-dvh overflow-hidden bg-[var(--canvas)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          aria-hidden
        >
          <div className="absolute left-1/2 top-[-8rem] h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] blur-[110px]" />
          <div className="absolute bottom-[-8rem] right-[-4rem] h-[20rem] w-[20rem] rounded-full bg-[color-mix(in_srgb,var(--success)_10%,transparent)] blur-[110px]" />
          <div className="absolute left-[-5rem] top-1/3 h-[16rem] w-[16rem] rounded-full bg-[color-mix(in_srgb,var(--panel-ink)_5%,transparent)] blur-[95px]" />
        </div>

        <div className="absolute right-6 top-4 z-[2] sm:right-8 sm:top-4 lg:right-10 lg:top-4">
          <span className="rounded-full border border-[color-mix(in_srgb,var(--line)_78%,white)] bg-white/70 px-3 py-1 font-[family-name:var(--font-dashboard-mono)] text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--ink-muted)] shadow-[0_10px_30px_-18px_color-mix(in_srgb,var(--panel-ink)_20%,transparent)] backdrop-blur-sm">
            {gt("Private beta")}
          </span>
        </div>

        <div className="relative z-[1] flex min-h-dvh items-center justify-center px-6 py-10 sm:px-8 lg:px-10">
          <main className="w-full max-w-[33rem]">
            <div
              className="relative overflow-hidden rounded-lg border border-[color-mix(in_srgb,var(--line)_82%,white)] bg-[color-mix(in_srgb,var(--panel)_92%,white)] p-6 shadow-[0_32px_90px_-40px_color-mix(in_srgb,var(--panel-ink)_22%,transparent)] backdrop-blur-xl sm:p-8"
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.65]"
                aria-hidden
                style={{
                  background:
                    "linear-gradient(180deg, color-mix(in_srgb, white 72%, transparent), transparent 28%), radial-gradient(circle at top, color-mix(in_srgb, var(--accent) 10%, transparent), transparent 42%)",
                }}
              />
              <div
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--accent-strong)_18%,white),transparent)]"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.08]"
                aria-hidden
                style={{
                  backgroundImage:
                    "linear-gradient(to right, color-mix(in_srgb,var(--line)_55%,transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in_srgb,var(--line)_55%,transparent) 1px, transparent 1px)",
                  backgroundPosition: "center",
                  backgroundSize: "36px 36px",
                }}
              />

              <div className="relative space-y-8">
                <header className="space-y-5">
                  <div className="space-y-2">
                    <h1 className="text-[clamp(2rem,5vw,2.75rem)] font-semibold tracking-[-0.055em] text-[var(--panel-ink)]">
                      {gt("Welcome back")}
                    </h1>
                    <p className="max-w-sm text-sm leading-6 text-[var(--ink-muted)] sm:text-[0.95rem]">
                      {gt("Use your work email to enter the dashboard and pick up where your schedule left off.")}
                    </p>
                  </div>
                </header>

                <LoginForm />
              </div>
            </div>

            <p
              className="mt-6 text-center text-sm text-[var(--ink-muted)]"
              style={{
                textWrap: "balance",
              }}
            >
              {gt("New here?")}{" "}
              <Link
                href="/register"
                className="font-semibold text-[var(--panel-ink)] underline decoration-[color-mix(in_srgb,var(--accent)_44%,transparent)] underline-offset-[6px] transition hover:text-[var(--accent-strong)] hover:decoration-[var(--accent-strong)]"
              >
                {gt("Create an account")}
              </Link>
            </p>
          </main>
        </div>
      </div>
    </>
  );
}
