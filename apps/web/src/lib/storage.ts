import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

// Configuração do cliente S3 para o Cloudflare R2
export const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Gera uma URL assinada (Presigned URL) para upload direto do frontend.
 * @param fileName O nome original do arquivo
 * @param contentType O tipo MIME do arquivo (ex: image/jpeg)
 * @param folder A pasta onde o arquivo deve ser salvo (default: 'uploads')
 * @returns { uploadUrl: string, fileKey: string, publicUrl: string }
 */
export async function generateUploadUrl(fileName: string, contentType: string, folder: string = 'uploads') {
  // Cria um nome de arquivo único para evitar colisões
  const fileExtension = fileName.split(".").pop();
  const uniqueId = crypto.randomUUID();
  const fileKey = `${folder}/${Date.now()}-${uniqueId}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
  });

  // URL expira em 5 minutos (300 segundos)
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  const publicUrl = `${R2_PUBLIC_URL}/${fileKey}`;

  return {
    uploadUrl,
    fileKey,
    publicUrl,
  };
}

/**
 * Deleta um arquivo do bucket R2.
 * @param fileKey A chave do arquivo no bucket (ex: uploads/123-abc.jpg)
 */
export async function deleteFile(fileKey: string) {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileKey,
  });

  await s3Client.send(command);
}
