import { S3Client, PutBucketCorsCommand, CreateBucketCommand } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function setCors() {
  try {
    console.log(`Checking/Creating bucket: ${R2_BUCKET_NAME}...`);
    await s3Client.send(new CreateBucketCommand({ Bucket: R2_BUCKET_NAME }));
    console.log("Bucket exists or was created.");
  } catch (err: any) {
    if (err.name !== 'BucketAlreadyOwnedByYou' && err.name !== 'BucketAlreadyExists') {
      console.log("Note: Bucket creation returned an error (might already exist):", err.name);
    }
  }

  console.log(`Applying CORS configuration to bucket: ${R2_BUCKET_NAME}...`);
  const command = new PutBucketCorsCommand({
    Bucket: R2_BUCKET_NAME,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ["*"],
          AllowedMethods: ["GET", "PUT", "POST", "HEAD", "DELETE"],
          AllowedOrigins: ["*"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3000,
        },
      ],
    },
  });

  try {
    await s3Client.send(command);
    console.log("✅ CORS configuration applied successfully!");
  } catch (err) {
    console.error("❌ Error setting CORS:", err);
  }
}

setCors();
