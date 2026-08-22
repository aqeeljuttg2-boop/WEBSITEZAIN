import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import { broadcastRealtimeEvent } from '@/lib/realtime';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. Check user authentication if present (gracefully allow admin operations)
    try {
      const user = await getCurrentUser();
      if (user && user.role === 'CUSTOMER') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    } catch (authErr) {
      console.warn('Upload auth check skipped:', authErr);
    }

    const contentType = request.headers.get('content-type') || '';
    const uploadDir = path.join(process.cwd(), 'public', 'products');

    // Detect Vercel / Serverless environment
    const isVercel = Boolean(process.env.VERCEL) || Boolean(process.env.VERCEL_ENV) || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

    // Check if filesystem is writable (only relevant for local non-serverless dev)
    let isFileSystemWritable = !isVercel;
    if (!isVercel) {
      try {
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
      } catch (fsErr) {
        console.warn('Filesystem is read-only (Serverless detected):', fsErr);
        isFileSystemWritable = false;
      }
    }

    const uploadedUrls: string[] = [];

    // 1. Handle Multipart Form Data
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();

      const candidateFiles: File[] = [];
      const fieldNames = ['files', 'file', 'image', 'images', 'photos', 'photo', 'attachment'];

      for (const field of fieldNames) {
        const entries = formData.getAll(field);
        for (const entry of entries) {
          if (entry && typeof entry === 'object' && 'arrayBuffer' in entry && (entry as File).size > 0) {
            candidateFiles.push(entry as File);
          }
        }
      }

      if (candidateFiles.length === 0) {
        for (const [, val] of formData.entries()) {
          if (val && typeof val === 'object' && 'arrayBuffer' in val && (val as File).size > 0) {
            candidateFiles.push(val as File);
          }
        }
      }

      if (candidateFiles.length === 0) {
        return NextResponse.json({ error: 'No valid image files provided in upload' }, { status: 400 });
      }

      for (const file of candidateFiles) {
        const bytes = await file.arrayBuffer();
        const rawBuffer = Buffer.from(bytes);
        const mime = file.type || 'image/jpeg';
        const rawName = file.name || 'product_image.jpeg';
        const base64 = rawBuffer.toString('base64');
        const dataUrl = `data:${mime};base64,${base64}`;

        let finalUrl = dataUrl;

        // On Vercel / Serverless, persist as Data URL to guarantee zero 404s
        if (isVercel || !isFileSystemWritable) {
          finalUrl = dataUrl;
          uploadedUrls.push(finalUrl);

          try {
            await db.media.create({
              data: {
                fileName: rawName,
                fileUrl: finalUrl,
                fileType: 'image',
                fileSize: rawBuffer.length,
                mimeType: mime,
                altText: rawName
              }
            });
          } catch (mErr) {
            console.warn('Vercel Media record creation skipped:', mErr);
          }
        } else {
          // Local environment write to public/products/
          try {
            const ext = path.extname(rawName) || '.jpeg';
            const baseName = path.basename(rawName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
            const timestamp = Date.now();
            const randomSalt = Math.floor(Math.random() * 1000);
            const fileName = `${timestamp}_${randomSalt}_${baseName}${ext}`;
            const filePath = path.join(uploadDir, fileName);

            fs.writeFileSync(filePath, rawBuffer);
            finalUrl = `/products/${fileName}`;
            uploadedUrls.push(finalUrl);

            try {
              await db.media.upsert({
                where: { fileUrl: finalUrl },
                update: {
                  fileName: rawName,
                  altText: rawName,
                  fileSize: rawBuffer.length,
                  mimeType: mime
                },
                create: {
                  fileName: rawName,
                  fileUrl: finalUrl,
                  fileType: 'image',
                  fileSize: rawBuffer.length,
                  mimeType: mime,
                  altText: rawName
                }
              });
            } catch (mErr) {
              console.warn('Media record creation skipped:', mErr);
            }

          } catch (writeErr: any) {
            console.warn('Local disk write failed, fallback to Data URL:', writeErr?.message);
            finalUrl = dataUrl;
            uploadedUrls.push(finalUrl);
          }
        }
      }
    } 
    // 2. Handle JSON Base64 Uploads
    else if (contentType.includes('application/json')) {
      const body = await request.json();
      const base64List: string[] = [];

      if (typeof body.image === 'string') base64List.push(body.image);
      if (typeof body.file === 'string') base64List.push(body.file);
      if (Array.isArray(body.images)) base64List.push(...body.images.filter((img: any) => typeof img === 'string'));
      if (Array.isArray(body.files)) base64List.push(...body.files.filter((f: any) => typeof f === 'string'));

      for (const b64Data of base64List) {
        if (!b64Data.startsWith('data:image')) {
          if (b64Data.startsWith('/products/') || b64Data.startsWith('http')) {
            uploadedUrls.push(b64Data);
          }
          continue;
        }

        const matches = b64Data.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (!matches) {
          uploadedUrls.push(b64Data);
          continue;
        }

        const ext = `.${matches[1] || 'jpeg'}`;
        const rawBuffer = Buffer.from(matches[2], 'base64');
        const mime = `image/${matches[1] || 'jpeg'}`;
        const finalUrl = b64Data;

        if (isVercel || !isFileSystemWritable) {
          uploadedUrls.push(finalUrl);

          try {
            await db.media.create({
              data: {
                fileName: `upload_${Date.now()}${ext}`,
                fileUrl: finalUrl,
                fileType: 'image',
                fileSize: rawBuffer.length,
                mimeType: mime,
                altText: 'Uploaded Image'
              }
            });
          } catch (mErr) {
            console.warn('Vercel JSON Media record creation skipped:', mErr);
          }
        } else {
          try {
            const timestamp = Date.now();
            const randomSalt = Math.floor(Math.random() * 1000);
            const fileName = `${timestamp}_${randomSalt}_upload${ext}`;
            const filePath = path.join(uploadDir, fileName);

            fs.writeFileSync(filePath, rawBuffer);
            const publicUrl = `/products/${fileName}`;
            uploadedUrls.push(publicUrl);

            try {
              await db.media.upsert({
                where: { fileUrl: publicUrl },
                update: {
                  fileName,
                  altText: fileName,
                  fileSize: rawBuffer.length,
                  mimeType: mime
                },
                create: {
                  fileName,
                  fileUrl: publicUrl,
                  fileType: 'image',
                  fileSize: rawBuffer.length,
                  mimeType: mime,
                  altText: fileName
                }
              });
            } catch (mErr) {
              console.warn('Media record creation skipped:', mErr);
            }
          } catch (writeErr: any) {
            console.warn('Local disk write failed, fallback to Data URL:', writeErr?.message);
            uploadedUrls.push(finalUrl);
          }
        }
      }
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json({ error: 'No files could be processed' }, { status: 400 });
    }

    try {
      broadcastRealtimeEvent({
        type: 'MEDIA_UPLOADED',
        title: 'New Media Uploaded',
        message: `${uploadedUrls.length} file(s) uploaded`,
        data: uploadedUrls,
        source: 'admin'
      });
    } catch {}

    return NextResponse.json({
      success: true,
      url: uploadedUrls[0],
      urls: uploadedUrls,
      count: uploadedUrls.length
    }, { status: 201 });

  } catch (error: any) {
    console.error('API Image Upload Server Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to upload image file.' 
    }, { status: 500 });
  }
}
