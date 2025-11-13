import { v2 as cloudinary } from "cloudinary";
import { CONFIG } from "../config/config";

cloudinary.config({
  cloud_name: CONFIG.CLOUDINARY_CLOUD_NAME,
  api_key: CONFIG.CLOUDINARY_API_KEY,
  api_secret: CONFIG.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(
  file: Express.Multer.File
): Promise<string> {
  const b64 = file.buffer.toString("base64");
  const dataUri = `data:${file.mimetype};base64,${b64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "judge-xpert/profile-images",
    resource_type: "image",
  });

  return result.secure_url;
}