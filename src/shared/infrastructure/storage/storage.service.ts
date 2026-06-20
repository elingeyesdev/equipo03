import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  uploadImage(fileBuffer: Buffer, folder: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error) return reject(error);
          if (result) return resolve(result.secure_url);
          reject(new Error('Upload failed without error'));
        },
      );
      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  }

  async deleteImage(imageUrl: string): Promise<void> {
    const publicId = this.extractPublicId(imageUrl);
    if (!publicId) {
      this.logger.warn(`No se pudo extraer public_id de: ${imageUrl}`);
      return;
    }
    this.logger.log(`Eliminando de Cloudinary: ${publicId}`);
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result !== 'ok' && result.result !== 'not found') {
      this.logger.error(`Cloudinary destroy falló: ${JSON.stringify(result)}`);
    }
  }

  private extractPublicId(url: string): string | null {
    if (!url.includes('cloudinary.com')) return null;
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    return match?.[1] ?? null;
  }
}
