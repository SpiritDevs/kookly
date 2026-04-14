import { api } from "@convex/_generated/api";
import { authServer } from "@/lib/auth-server";
import {
  createRouteHandler,
  createUploadthing,
  type FileRouter,
  UTFiles,
} from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

const allowedLogoMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/svg+xml",
]);

const allowedProfileImageMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

function sanitizeFileName(fileName: string) {
  const trimmedName = fileName.trim();
  const dotIndex = trimmedName.lastIndexOf(".");
  const baseName = dotIndex >= 0 ? trimmedName.slice(0, dotIndex) : trimmedName;
  const extension = dotIndex >= 0 ? trimmedName.slice(dotIndex + 1).toLowerCase() : "bin";
  const safeBaseName = baseName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const safeExtension = extension.replace(/[^a-z0-9]+/g, "").slice(0, 10) || "bin";

  return `${safeBaseName || "logo"}-${Date.now()}.${safeExtension}`;
}

const uploadRouter: FileRouter = {
  onboardingOrganizationLogo: f({
    image: {
      maxFileSize: "2MB",
      maxFileCount: 1,
      minFileCount: 1,
    },
  })
    .middleware(async ({ files }) => {
      const currentViewer = await authServer.fetchAuthQuery(
        api.users.viewerRoutingState,
        {},
      );

      if (!currentViewer) {
        throw new UploadThingError("Sign in before uploading a logo.");
      }

      const viewerKey = "appUserId" in currentViewer
        ? currentViewer.appUserId
        : currentViewer.authUserId;

      const overrides = files.map((file) => {
        if (!allowedLogoMimeTypes.has(file.type)) {
          throw new UploadThingError("Only PNG, JPG, or SVG logos are supported.");
        }

        const sanitizedName = sanitizeFileName(file.name);

        return {
          ...file,
          name: sanitizedName,
          customId: `${viewerKey}/onboarding/branding/logo/${sanitizedName}`,
        };
      });

      return {
        viewerKey,
        [UTFiles]: overrides,
      };
    })
    .onUploadComplete(async ({ file }) => {
      if (!file.customId) {
        throw new UploadThingError("Upload completed without a storage key.");
      }

      return {
        logoUrl: file.ufsUrl,
        logoStorageKey: file.customId,
      };
    }),
  organizationLogo: f({
    image: {
      maxFileSize: "2MB",
      maxFileCount: 1,
      minFileCount: 1,
    },
  })
    .middleware(async ({ files }) => {
      const currentOrganization = await authServer.fetchAuthQuery(
        api.users.currentOnboardingOrganization,
        {},
      );

      if (!currentOrganization) {
        throw new UploadThingError("Create the organization before uploading a logo.");
      }

      const overrides = files.map((file) => {
        if (!allowedLogoMimeTypes.has(file.type)) {
          throw new UploadThingError("Only PNG, JPG, or SVG logos are supported.");
        }

        const sanitizedName = sanitizeFileName(file.name);

        return {
          ...file,
          name: sanitizedName,
          customId: `${currentOrganization.organizationId}/branding/logo/${sanitizedName}`,
        };
      });

      return {
        organizationId: currentOrganization.organizationId,
        [UTFiles]: overrides,
      };
    })
    .onUploadComplete(async ({ file }) => {
      if (!file.customId) {
        throw new UploadThingError("Upload completed without a storage key.");
      }

      return {
        logoUrl: file.ufsUrl,
        logoStorageKey: file.customId,
      };
    }),
  profileImage: f(
    {
      image: {
        maxFileSize: "4MB",
        maxFileCount: 1,
        minFileCount: 1,
      },
    },
    { awaitServerData: false },
  )
    .middleware(async ({ files }) => {
      const currentViewer = await authServer.fetchAuthQuery(
        api.users.viewerRoutingState,
        {},
      );

      if (!currentViewer) {
        throw new UploadThingError("Sign in before uploading a profile image.");
      }

      const viewerKey = "appUserId" in currentViewer
        ? currentViewer.appUserId
        : currentViewer.authUserId;

      const overrides = files.map((file) => {
        if (!allowedProfileImageMimeTypes.has(file.type)) {
          throw new UploadThingError("Only PNG, JPG, or WebP profile images are supported.");
        }

        const sanitizedName = sanitizeFileName(file.name);

        return {
          ...file,
          name: sanitizedName,
          customId: `${viewerKey}/profile/image/${sanitizedName}`,
        };
      });

      return {
        viewerKey,
        [UTFiles]: overrides,
      };
    })
    .onUploadComplete(async ({ file }) => ({
      imageUrl: file.ufsUrl,
    })),
};

export const uploadthingRouteHandler = createRouteHandler({
  router: uploadRouter,
});
