/**
 * StudiRad Cloudinary Media & Document Storage Service
 * Handles uploading course covers, clinical study materials (PDF, PPTX, DOCX, video clips)
 * seamlessly via Cloudinary CDN with high availability and no CORS issues.
 */

export interface UploadResult {
  url: string;
  provider: 'cloudinary' | 'local_server';
  publicId?: string;
}

/**
 * Upload a File object to Cloudinary storage via the StudiRad backend proxy.
 * Converts the file to base64 and posts to /api/upload.
 */
export async function uploadFileToCloudinary(
  file: File,
  folder: string = 'studirad_materials'
): Promise<string> {
  // Step 1: Read the file as a Base64 data URL
  const fileData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

  // Step 2: POST to /api/upload
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileData,
      fileName: file.name,
      folder,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Upload failed with HTTP ${response.status}`);
  }

  const result: UploadResult = await response.json();
  return result.url;
}
