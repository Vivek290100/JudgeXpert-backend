// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\utils\s3.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner"
import { CONFIG } from "../config/config"; 


const s3Client = new S3Client({
  region: CONFIG.S3_BUCKET_REGION,
  credentials: {
    accessKeyId: CONFIG.S3_ACCESS_KEY,
    secretAccessKey: CONFIG.S3_SECRET_ACCESS_KEY,
  },
});

export async function uploadToS3(file: Express.Multer.File): Promise<string> {
  const fileExtension = file.originalname.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
  const key = `profile-images/${fileName}`; 

  const params = {
    Bucket: CONFIG.S3_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    await s3Client.send(new PutObjectCommand(params));

    const getObjectParams = {
      Bucket: CONFIG.S3_BUCKET_NAME,
      Key: key,
    };
    const command = new GetObjectCommand(getObjectParams);
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour

    return signedUrl;

  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw new Error("Failed to upload image to S3");
  }
}

export { s3Client };