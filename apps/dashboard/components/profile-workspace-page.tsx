"use client";

import { useGT } from "gt-next";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  dashboardLanguages,
  type DashboardLanguage,
  normalizeDashboardLanguage,
} from "@convex/lib/dashboardLanguage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  WorkspaceErrorCard,
  WorkspaceLoadingCard,
  Stack,
} from "@/components/dashboard-workspace-ui";
import { Icon } from "@/components/icons";
import {
  Badge,
  Field,
  TextInput,
  buttonClasses,
  cn,
  inputClasses,
} from "@/components/ui";
import { useUploadThing } from "@/lib/uploadthing";
import {
  pickBrandColor,
  workspaceInitials,
  WorkspaceAvatar,
} from "@/components/workspace-avatar";

const MAX_BIO_LENGTH = 2000;

const LANGUAGE_LABEL: Record<DashboardLanguage, string> = {
  en: "English",
  de: "German",
  es: "Spanish",
  fr: "French",
  ja: "Japanese",
  "pt-BR": "Portuguese (Brazil)",
};

const PROFILE_ACCENT_SWATCHES = [
  "#bef264",
  "#facc15",
  "#fdba74",
  "#fca5a5",
  "#f9a8d4",
  "#86efac",
  "#7dd3fc",
  "#93c5fd",
  "#c4b5fd",
  "#d8b4fe",
] as const;

const allowedProfileImageTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

function resolveUploadedFileUrl(
  uploadedFile:
    | {
        ufsUrl?: string | null;
        appUrl?: string | null;
        url?: string | null;
        serverData?: { imageUrl?: string | null } | null;
      }
    | null
    | undefined,
) {
  return (
    uploadedFile?.ufsUrl ??
    uploadedFile?.appUrl ??
    uploadedFile?.url ??
    uploadedFile?.serverData?.imageUrl ??
    null
  );
}

const PROFILE_CARD_CLASS_NAME =
  "border-[color-mix(in_srgb,var(--line)_65%,white)] bg-[color-mix(in_srgb,var(--panel)_92%,white)] shadow-[var(--shadow-xl)]";

export function ProfileWorkspacePage({
  orgSlug,
}: Readonly<{
  orgSlug: string;
}>) {
  const gt = useGT();
  const profile = useQuery(api.users.viewerProfile, { orgSlug });
  const updateProfile = useMutation(api.users.updateViewerProfile);
  const updateAppearance = useMutation(api.users.updateViewerAppearance);
  const persistLanguage = useMutation(api.users.setDashboardLanguage);
  const { startUpload, isUploading } = useUploadThing("profileImage");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [dashboardLanguage, setDashboardLanguage] =
    useState<DashboardLanguage>("en");
  const [profileAccentColor, setProfileAccentColor] = useState<string | null>(
    null,
  );
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [appearanceError, setAppearanceError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }
    setFirstName(profile.user.firstName);
    setLastName(profile.user.lastName);
    setBio(profile.user.bio);
    setDashboardLanguage(profile.membership.dashboardLanguage);
    setProfileAccentColor(profile.user.profileAccentColor);
    setProfileImageUrl(profile.user.imageUrl);
  }, [profile]);

  if (profile === undefined) {
    return <WorkspaceLoadingCard label={gt("Loading profile")} />;
  }

  if (profile === null) {
    return (
      <WorkspaceErrorCard message={gt("This workspace could not be loaded.")} />
    );
  }

  const { user, membership, workspaces } = profile;
  const displayName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const initialsSource = displayName || user.fullName;
  const hasProfileChanges =
    firstName !== user.firstName ||
    lastName !== user.lastName ||
    bio !== user.bio;
  const colorValue = pickBrandColor(
    profileAccentColor ?? user.profileAccentColor,
  );
  const avatarImageUrl = profileImageUrl ?? user.imageUrl;

  function saveProfile() {
    if (!hasProfileChanges) {
      return;
    }

    startTransition(async () => {
      await updateProfile({
        orgSlug,
        firstName,
        lastName,
        bio,
      });
    });
  }

  function onLanguageChange(next: DashboardLanguage) {
    setDashboardLanguage(next);
    startTransition(async () => {
      await persistLanguage({ dashboardLanguage: next });
    });
  }

  function onAccentColorSelect(nextColor: string) {
    if (nextColor === profileAccentColor || isPending || isUploading) {
      return;
    }

    const previousColor = profileAccentColor;
    setAppearanceError(null);
    setProfileAccentColor(nextColor);

    startTransition(async () => {
      try {
        await updateAppearance({
          orgSlug,
          profileAccentColor: nextColor,
        });
      } catch (error) {
        setProfileAccentColor(previousColor);
        setAppearanceError(
          error instanceof Error
            ? error.message
            : gt("We couldn’t update your avatar color."),
        );
      }
    });
  }

  function onProfileImagePick(file: File | null) {
    if (!file) {
      return;
    }

    if (!allowedProfileImageTypes.has(file.type)) {
      setAppearanceError(gt("Profile image must be a PNG, JPG, or WebP file."));
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setAppearanceError(gt("Profile image must be 4 MB or smaller."));
      return;
    }

    setAppearanceError(null);

    startTransition(async () => {
      try {
        const uploadResult = await startUpload([file]);
        const uploadedImage = uploadResult?.[0];
        const uploadedImageUrl = resolveUploadedFileUrl(uploadedImage);

        if (!uploadedImageUrl) {
          throw new Error(
            gt("Profile image upload finished without a file URL."),
          );
        }

        await updateAppearance({
          orgSlug,
          imageUrl: uploadedImageUrl,
        });
        setProfileImageUrl(uploadedImageUrl);
      } catch (error) {
        setAppearanceError(
          error instanceof Error
            ? error.message
            : gt("We couldn’t update your profile image."),
        );
      }
    });
  }

  function onRemoveProfileImage() {
    if (!avatarImageUrl || isPending || isUploading) {
      return;
    }

    const previousImageUrl = profileImageUrl;
    setAppearanceError(null);
    setProfileImageUrl(null);

    startTransition(async () => {
      try {
        await updateAppearance({
          orgSlug,
          imageUrl: null,
        });
      } catch (error) {
        setProfileImageUrl(previousImageUrl);
        setAppearanceError(
          error instanceof Error
            ? error.message
            : gt("We couldn’t remove your profile image."),
        );
      }
    });
  }

  return (
    <Stack className="mx-auto max-w-2xl gap-6 pb-10">
      <Card className={PROFILE_CARD_CLASS_NAME}>
        <CardHeader className="gap-6 border-b border-[color-mix(in_srgb,var(--line)_65%,white)] pb-6">
          <div>
            <h1 className="font-[family-name:var(--font-dashboard-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--panel-ink)]">
              {gt("Profile")}
            </h1>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              {gt("Manage how you appear in this workspace.")}
            </p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 py-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              onProfileImagePick(file);
              event.target.value = "";
            }}
          />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center gap-3 sm:items-start">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="cursor-pointer rounded-full transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_18%,white)]"
                    aria-label={gt("Edit profile avatar")}
                    disabled={isPending || isUploading}
                  >
                    <Avatar
                      className="size-24 rounded-full border border-white/80 shadow-[0_0_0_3px_var(--profile-avatar-ring)]"
                      style={
                        {
                          "--profile-avatar-ring": colorValue,
                        } as React.CSSProperties
                      }
                    >
                      {avatarImageUrl ? (
                        <AvatarImage src={avatarImageUrl} alt="" />
                      ) : null}
                      <AvatarFallback
                        className="rounded-full text-lg font-semibold text-zinc-950"
                        style={{ backgroundColor: colorValue }}
                      >
                        {workspaceInitials(initialsSource)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="center"
                  sideOffset={10}
                  className="w-fit min-w-0 rounded-lg p-2"
                >
                  <div className="grid grid-cols-5 justify-center gap-1.5 px-2.5 pb-2">
                    {PROFILE_ACCENT_SWATCHES.map((swatch) => {
                      const isSelected =
                        colorValue.toLowerCase() === swatch.toLowerCase();

                      return (
                        <button
                          key={swatch}
                          type="button"
                          className={cn(
                            "flex size-8 items-center justify-center rounded-full border border-white/80 shadow-[inset_0_1px_0_color-mix(in_srgb,white_80%,transparent)] transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_18%,white)]",
                            isSelected &&
                              "border-transparent shadow-none ring-2 ring-[var(--panel-ink)]",
                          )}
                          style={{ backgroundColor: swatch }}
                          onClick={() => onAccentColorSelect(swatch)}
                          disabled={isPending || isUploading}
                          aria-label={gt("Select avatar color")}
                          aria-pressed={isSelected}
                        >
                          {isSelected ? (
                            <Icon
                              name="check"
                              className="size-4 text-zinc-950"
                            />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  <DropdownMenuSeparator />
                  {avatarImageUrl ? (
                    <>
                      <DropdownMenuItem
                        className="justify-center text-center hover:!bg-slate-100 hover:!text-[var(--panel-ink)] data-[highlighted]:!bg-slate-100 data-[highlighted]:!text-[var(--panel-ink)]"
                        disabled={isPending || isUploading}
                        onSelect={(event) => {
                          event.preventDefault();
                          fileInputRef.current?.click();
                        }}
                      >
                        <span>
                          {isUploading
                            ? gt("Uploading...")
                            : gt("Replace profile image")}
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="justify-center text-center text-red-600 hover:!bg-red-50 hover:!text-red-700 focus:bg-red-50 focus:text-red-700 data-[highlighted]:!bg-red-50 data-[highlighted]:!text-red-700"
                        disabled={isPending || isUploading}
                        onSelect={(event) => {
                          event.preventDefault();
                          onRemoveProfileImage();
                        }}
                      >
                        <span>{gt("Remove profile image")}</span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem
                      className="justify-center text-center hover:!bg-slate-100 hover:!text-[var(--panel-ink)] data-[highlighted]:!bg-slate-100 data-[highlighted]:!text-[var(--panel-ink)]"
                      disabled={isPending || isUploading}
                      onSelect={(event) => {
                        event.preventDefault();
                        fileInputRef.current?.click();
                      }}
                    >
                      <span>
                        {isUploading
                          ? gt("Uploading...")
                          : gt("Upload profile image")}
                      </span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              {appearanceError ? (
                <p className="max-w-40 text-center text-xs text-[var(--danger,#a42b2b)] sm:text-left">
                  {appearanceError}
                </p>
              ) : null}
            </div>
            <div className="grid min-w-0 flex-1 gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={gt("First name")}>
                  <TextInput
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                  />
                </Field>
                <Field label={gt("Last name")}>
                  <TextInput
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                  />
                </Field>
              </div>
              <Field
                label={gt("Email")}
                hint={gt("Managed by your sign-in provider")}
              >
                <TextInput value={user.email} readOnly disabled />
              </Field>
            </div>
          </div>
          <Field label={gt("Bio")} hint={`${bio.length}/${MAX_BIO_LENGTH}`}>
            <Textarea
              value={bio}
              maxLength={MAX_BIO_LENGTH}
              onChange={(e) => setBio(e.target.value)}
              className="min-h-28 py-3 text-[var(--panel-ink)]"
              placeholder={gt("What should people know about you?")}
            />
          </Field>
        </CardContent>
        <CardFooter className="justify-end border-[color-mix(in_srgb,var(--line)_65%,white)] bg-[color-mix(in_srgb,var(--panel)_88%,white)]">
          <button
            type="button"
            className={cn(
              buttonClasses({ size: "sm" }),
              "min-h-9 px-3 text-[13px]",
            )}
            disabled={!hasProfileChanges || isPending}
            onClick={() => saveProfile()}
          >
            {gt("Save profile")}
          </button>
        </CardFooter>
      </Card>

      <Card className={PROFILE_CARD_CLASS_NAME}>
        <CardHeader>
          <CardTitle className="text-[var(--panel-ink)]">
            {gt("This workspace")}
          </CardTitle>
          <CardDescription className="text-[var(--ink-muted)]">
            {gt("Your role and preferences for this organization.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-[var(--ink-muted)]">
              {gt("Role")}
            </span>
            <Badge tone="accent">{membership.roleLabel}</Badge>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dash-lang" className="text-[var(--panel-ink)]">
              {gt("Dashboard language")}
            </Label>
            <select
              id="dash-lang"
              value={dashboardLanguage}
              onChange={(e) => {
                const next = normalizeDashboardLanguage(e.target.value);
                if (next) {
                  onLanguageChange(next);
                }
              }}
              className={cn(inputClasses, "cursor-pointer")}
            >
              {dashboardLanguages.map((code) => (
                <option key={code} value={code}>
                  {LANGUAGE_LABEL[code]}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className={PROFILE_CARD_CLASS_NAME}>
        <CardHeader>
          <CardTitle className="text-[var(--panel-ink)]">
            {gt("Workspaces")}
          </CardTitle>
          <CardDescription className="text-[var(--ink-muted)]">
            {gt("Organizations you belong to.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-0">
          <ul className="divide-y divide-[var(--line)]">
            {workspaces.map((w) => (
              <li key={w.slug}>
                <Link
                  href={`/${w.slug}`}
                  className="flex items-center gap-3 py-3 transition hover:bg-white/50"
                >
                  <WorkspaceAvatar
                    name={w.name}
                    logoUrl={w.logoUrl}
                    brandColor={w.brandColor}
                    className="size-9"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[var(--panel-ink)]">
                      {w.name}
                    </span>
                    <span className="block truncate text-xs text-[var(--ink-muted)]">
                      /{w.slug}
                    </span>
                  </span>
                  {w.isCurrent ? (
                    <Badge tone="neutral">{gt("Current")}</Badge>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className={PROFILE_CARD_CLASS_NAME}>
        <CardHeader>
          <CardTitle className="text-[var(--panel-ink)]">
            {gt("Sign-in and security")}
          </CardTitle>
          <CardDescription className="text-[var(--ink-muted)]">
            {gt(
              "Password, sessions, and connected accounts are managed in account security.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <p className="text-sm text-[var(--panel-ink)]">
            <span className="text-[var(--ink-muted)]">
              {gt("Primary email")}:
            </span>{" "}
            {user.email}
          </p>
          <Separator className="bg-[var(--line)]" />
          <Link
            href={`/${orgSlug}/settings/account/security`}
            className={cn(
              buttonClasses({ variant: "secondary", size: "md" }),
              "inline-flex w-fit",
            )}
          >
            {gt("Open security settings")}
          </Link>
        </CardContent>
      </Card>
    </Stack>
  );
}
