const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');
const path = require('path');

const USE_S3 = process.env.USE_S3 === '1';
const BUCKET = process.env.S3_BUCKET || '';

let s3 = null;
if (USE_S3) {
  s3 = new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY
    },
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: !!process.env.S3_ENDPOINT
  });
}

async function uploadToS3(localPath, originalName) {
  if (!USE_S3) return null;
  const key = `${Date.now()}_${path.basename(originalName)}`;
  const body = fs.createReadStream(localPath);
  const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body });
  await s3.send(cmd);
  return key;
}

async function deleteFromS3(key) {
  if (!USE_S3) return;
  const cmd = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  await s3.send(cmd);
}

function getS3Url(key) {
  if (!USE_S3) return `/uploads/${key}`;
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  // return presigned url (1 hour)
  return getSignedUrl(s3, cmd, { expiresIn: 3600 });
}

module.exports = { uploadToS3, deleteFromS3, getS3Url };
