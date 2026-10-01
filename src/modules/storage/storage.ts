import "server-only";

import { serverEnv } from "@/env/server";

import { CloudinaryStorageAdapter } from "./cloudinary-adapter";
import { LocalStorageAdapter } from "./local-adapter";

export const imageStorage =
  serverEnv.STORAGE_DRIVER === "cloudinary"
    ? new CloudinaryStorageAdapter({
        apiKey: serverEnv.CLOUDINARY_API_KEY!,
        apiSecret: serverEnv.CLOUDINARY_API_SECRET!,
        cloudName: serverEnv.CLOUDINARY_CLOUD_NAME!,
      })
    : new LocalStorageAdapter(serverEnv.LOCAL_UPLOAD_DIR);
