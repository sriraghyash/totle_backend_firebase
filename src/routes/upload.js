/*import express from "express";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
dotenv.config();

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT, // e.g. https://ae9ae237bb3b4e9bfd8c3e9f82873da9.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // important for R2
});

router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  const filename = `${Date.now()}-${req.file.originalname}`;

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: filename,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    res.send({
      message: "✅ File uploaded successfully",
      filename,
      url: `${process.env.R2_PUBLIC_BASE}/${filename}`, // make sure R2_PUBLIC_BASE ends without slash
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).send("Failed to upload file");
  }
});
router.get("/list", async (req, res) => {
  try {
    const data = await client.send(
      new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME,
      })
    );

    const files = (data.Contents || []).map((item) => ({
      key: item.Key,
      lastModified: item.LastModified,
      size: item.Size,
      // Public Dev URL for direct access
      url: `${process.env.R2_PUBLIC_BASE}/${encodeURIComponent(item.Key)}`,
    }));

    res.json({ files });
  } catch (error) {
    console.error("❌ List error:", error);
    res.status(500).send("Failed to list files");
  }
});
export default router;
*/
import express from "express";
import multer from "multer";
import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// S3 Client for uploads
const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT, // Backend S3 API endpoint
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

// Upload route
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  const filename = `${Date.now()}-${req.file.originalname}`;

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: filename,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    res.send({
      message: "✅ File uploaded successfully",
      filename,
      url: `${process.env.R2_PUBLIC_BASE}/${encodeURIComponent(filename)}`, // Public access URL
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).send("Failed to upload file");
  }
});

// List route
router.get("/list", async (req, res) => {
  try {
    const data = await client.send(
      new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME,
      })
    );

    const files = (data.Contents || []).map((item) => ({
      key: item.Key,
      lastModified: item.LastModified,
      size: item.Size,
      url: `${process.env.R2_PUBLIC_BASE}/${encodeURIComponent(item.Key)}`, // Always public URL for viewing
    }));

    res.json({ files });
  } catch (error) {
    console.error("❌ List error:", error);
    res.status(500).send("Failed to list files");
  }
});

export default router;

