const { Storage } = require('@google-cloud/storage');

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  // If using service account key file:
  // keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

/**
 * Upload file to Google Cloud Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} destination - Destination path in bucket
 * @param {string} mimetype - File mimetype
 * @returns {Promise<string>} Public URL of uploaded file
 */
async function uploadFile(fileBuffer, destination, mimetype) {
  const blob = bucket.file(destination);
  const blobStream = blob.createWriteStream({
    resumable: false,
    metadata: {
      contentType: mimetype,
      cacheControl: 'public, max-age=31536000', // 1 year
    }
  });

  return new Promise((resolve, reject) => {
    blobStream.on('error', (err) => {
      console.error('Upload error:', err);
      reject(err);
    });

    blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      resolve(publicUrl);
    });

    blobStream.end(fileBuffer);
  });
}

/**
 * Get signed URL for temporary file access
 * @param {string} filename - File name in bucket
 * @param {number} expiresIn - Expiration time in milliseconds (default: 15 minutes)
 * @returns {Promise<string>} Signed URL
 */
async function getSignedUrl(filename, expiresIn = 15 * 60 * 1000) {
  const [url] = await bucket.file(filename).getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresIn,
  });
  return url;
}

/**
 * Delete file from Google Cloud Storage
 * @param {string} filename - File name in bucket
 * @returns {Promise<void>}
 */
async function deleteFile(filename) {
  await bucket.file(filename).delete();
}

/**
 * Stream file from Google Cloud Storage
 * @param {string} filename - File name in bucket
 * @param {Response} res - Express response object
 */
function streamFile(filename, res) {
  const file = bucket.file(filename);

  file.createReadStream()
    .on('error', (err) => {
      console.error('Stream error:', err);
      res.status(500).send('Error streaming file');
    })
    .on('response', (response) => {
      // Set appropriate headers
      res.setHeader('Content-Type', response.headers['content-type']);
      res.setHeader('Content-Length', response.headers['content-length']);
    })
    .pipe(res);
}

module.exports = {
  uploadFile,
  getSignedUrl,
  deleteFile,
  streamFile
};
