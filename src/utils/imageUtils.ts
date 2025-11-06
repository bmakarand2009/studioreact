import { Course } from '@/types/course';

/**
 * Utility class for handling image transformations and Cloudinary URLs
 */
export class ImageUtils {
  private static PLACEHOLDER = 
    'https://res.cloudinary.com/wajooba/image/upload/c_thumb,h_320,w_480/v1692705773/master/placeholder.jpg';

  /**
   * Build optimized Cloudinary URL
   * @param cloudName - Cloudinary cloud name from tenant config
   * @param imagePath - Image path from API (e.g., "tenant-id/path.jpg")
   * @param width - Desired width in pixels
   * @param height - Desired height in pixels
   * @param crop - Crop mode: 'fill', 'fit', 'scale', 'thumb'
   * @returns Optimized Cloudinary URL
   */
  static buildCloudinaryUrl(
    cloudName: string,
    imagePath: string | undefined,
    width: number = 480,
    height: number = 320,
    crop: 'fill' | 'fit' | 'scale' | 'thumb' = 'fill'
  ): string {
    if (!imagePath || !cloudName) {
      return this.PLACEHOLDER;
    }

    // Remove leading slash if present
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;

    return `https://res.cloudinary.com/${cloudName}/image/upload/c_${crop},h_${height},w_${width}/${cleanPath}`;
  }

  /**
   * Get course image with fallback to placeholder
   * @param course - Course object with image1 property
   * @param cloudName - Cloudinary cloud name (optional)
   * @param width - Desired width (default: 480)
   * @param height - Desired height (default: 320)
   * @returns Cloudinary URL or placeholder
   */
  static getCourseImage(
    course: Course | { image1?: string },
    cloudName?: string,
    width: number = 480,
    height: number = 320
  ): string {
    if (!course.image1) {
      return this.PLACEHOLDER;
    }

    if (cloudName) {
      return this.buildCloudinaryUrl(cloudName, course.image1, width, height, 'fill');
    }

    return this.PLACEHOLDER;
  }

  /**
   * Get thumbnail image
   */
  static getCourseThumbnail(course: Course | { image1?: string }, cloudName?: string): string {
    return this.getCourseImage(course, cloudName, 240, 160);
  }

  /**
   * Get card image
   */
  static getCourseCardImage(course: Course | { image1?: string }, cloudName?: string): string {
    return this.getCourseImage(course, cloudName, 480, 320);
  }

  /**
   * Get hero image
   */
  static getCourseHeroImage(course: Course | { image1?: string }, cloudName?: string): string {
    return this.getCourseImage(course, cloudName, 1200, 600);
  }

  /**
   * Get event image with fallback
   * Event images use h_200,w_310 sizing and different field name
   * @param event - Event object with imageUrl property
   * @param cloudName - Cloudinary cloud name (optional)
   * @returns Cloudinary URL or placeholder
   */
  static getEventCardImage(event: { imageUrl?: string }, cloudName?: string): string {
    if (!event.imageUrl) {
      return this.PLACEHOLDER;
    }

    // If URL already includes http, use as-is (external URL)
    if (event.imageUrl.includes('http')) {
      return event.imageUrl;
    }

    if (cloudName) {
      // Remove leading slash if present
      const cleanPath = event.imageUrl.startsWith('/') ? event.imageUrl.substring(1) : event.imageUrl;
      return `https://res.cloudinary.com/${cloudName}/image/upload/h_200,w_310/${cleanPath}`;
    }

    return this.PLACEHOLDER;
  }
}

