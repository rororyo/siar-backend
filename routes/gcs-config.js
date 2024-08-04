import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';

dotenv.config();

const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

const storage = new Storage({
  projectId: credentials.project_id,
  credentials,
});

const bucketName = process.env.GCS_BUCKET_NAME;

export { storage, bucketName };
