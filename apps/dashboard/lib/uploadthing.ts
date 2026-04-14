"use client";

import { generateReactHelpers } from "@uploadthing/react";
import type { FileRouter } from "uploadthing/server";

const useUploadThingInternal: ReturnType<
  typeof generateReactHelpers<FileRouter>
>["useUploadThing"] = generateReactHelpers<FileRouter>({
  url: "/api/uploadthing",
}).useUploadThing;

export const useUploadThing = useUploadThingInternal;
