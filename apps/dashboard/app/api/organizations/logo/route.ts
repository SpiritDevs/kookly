import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { api } from "@convex/_generated/api";
import { authServer } from "@/lib/auth-server";

const utapi = new UTApi();

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      logoUrl?: unknown;
      logoStorageKey?: unknown;
    };

    if (
      typeof body.logoUrl !== "string" ||
      typeof body.logoStorageKey !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid logo payload." },
        { status: 400 },
      );
    }

    const currentOrganization = await authServer.fetchAuthQuery(
      api.users.currentOnboardingOrganization,
      {},
    );

    if (!currentOrganization) {
      return NextResponse.json(
        { error: "Create the organization before saving a logo." },
        { status: 401 },
      );
    }

    if (
      currentOrganization.logoStorageKey &&
      currentOrganization.logoStorageKey !== body.logoStorageKey
    ) {
      await utapi.deleteFiles(currentOrganization.logoStorageKey, {
        keyType: "customId",
      });
    }

    await authServer.fetchAuthMutation(api.users.saveOrganizationLogo, {
      organizationId: currentOrganization.organizationId,
      logoUrl: body.logoUrl,
      logoStorageKey: body.logoStorageKey,
    });

    return NextResponse.json({
      ok: true,
      organizationId: currentOrganization.organizationId,
      logoUrl: body.logoUrl,
      logoStorageKey: body.logoStorageKey,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "We couldn't save the organization logo.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
