const {
  CreateBucketCommand,
  HeadBucketCommand,
  S3Client,
} = require('@aws-sdk/client-s3');

const client = new S3Client({
  endpoint: process.env.AWS_S3_ENDPOINT,
  region: process.env.AWS_S3_REGION || 'ap-south-1',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function ensureBucket() {
  const bucket = process.env.AWS_S3_BUCKET;
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch (error) {
    if (error.$metadata?.httpStatusCode !== 404 && error.name !== 'NotFound') {
      throw error;
    }
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
  }
}

ensureBucket().catch((error) => {
  console.error(`Unable to initialize object storage: ${error.message}`);
  process.exitCode = 1;
});
