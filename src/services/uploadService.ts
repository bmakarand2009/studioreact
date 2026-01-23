import axios, { AxiosProgressEvent } from 'axios';
import * as tus from 'tus-js-client';
import { environment } from '@/config/environment';
import { settingsService, AccountSettings } from './settingsService';

/**
 * File upload status interface
 */
export interface FileUploadStatus {
  filename: string;
  progress: number;
  hash: string;
  uuid: string;
  upload: tus.Upload | null;
  status: 'uploading' | 'completed' | 'failed';
}

/**
 * Bunny Video Object interface
 */
export interface BunnyVideoObject {
  videoId: string;
  libraryId: number;
  title: string;
  status: string;
  sha256: string;
  expirationTime: number;
  tusEndPoint: string;
  help: string;
}

/**
 * Upload payload interface
 */
export interface UploadPayload {
  mediaType: string;
  fileName: string;
  productType: string;
  productId?: string;
  questionId?: string;
  productName?: string;
  chapterId?: string;
  sectionId?: string;
  isDownloadable?: boolean;
  isHomework?: boolean;
  sequence?: number;
}

/**
 * Cloudinary upload response
 */
export interface CloudinaryResponse {
  public_id: string;
  url: string;
  folder: string;
}

/**
 * File initialization response
 */
export interface FileInitResponse {
  response: {
    fileId: string;
    signedUrl: string;
  };
}

/**
 * Upload Service
 * 
 * Handles all types of media uploads:
 * - Videos (via Bunny CDN using TUS protocol)
 * - Images (via Cloudinary)
 * - Files (via AWS S3 signed URLs)
 * - Links (YouTube/Vimeo)
 * 
 * Features:
 * - Progress tracking
 * - Upload queue management
 * - Retry logic for failed uploads
 * - Asset refresh notifications
 */
class UploadService {
  private baseUrl: string;
  private liveFileStatusArr: FileUploadStatus[] = [];
  private uploadQueue: FileUploadStatus[] = [];
  private isLoadingState: Record<string, boolean> = {};
  private hideSnackbar: boolean = false;
  private assetRefreshCallbacks: Set<() => void> = new Set();
  private accountSettings: AccountSettings | null = null;

  constructor() {
    this.baseUrl = environment.api.baseUrl;
    this.loadAccountSettings();
  }

  /**
   * Load account settings for Cloudinary configuration
   */
  private async loadAccountSettings(): Promise<void> {
    try {
      this.accountSettings = await settingsService.getAccountSettings();
    } catch (error) {
      console.warn('Failed to load account settings:', error);
    }
  }

  /**
   * Generate unique upload ID
   */
  private generateUploadId(fileName: string): string {
    const timestamp = new Date().getTime();
    return `upload_${fileName}_${timestamp}`;
  }

  /**
   * Get auth token from cookies
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    const nameEQ = 'accessToken=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  /**
   * Create axios instance with auth headers
   */
  private getAxiosInstance() {
    const token = this.getAuthToken();
    return axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  }

  /**
   * Initialize file upload - get signed URL
   */
  private async createFileUrl(payload: UploadPayload): Promise<FileInitResponse> {
    const axiosInstance = this.getAxiosInstance();
    const response = await axiosInstance.post<FileInitResponse>('/edmedia/file/init', payload);
    return response.data;
  }

  /**
   * Create file asset after upload
   */
  private async createFileAsset(fileId: string): Promise<any> {
    const axiosInstance = this.getAxiosInstance();
    const response = await axiosInstance.post(`/edmedia/file/${fileId}`, {});
    return response.data;
  }

  /**
   * Initialize video object for Bunny CDN upload
   */
  private async createVideoObject(title: string): Promise<BunnyVideoObject> {
    const axiosInstance = this.getAxiosInstance();
    const response = await axiosInstance.get<BunnyVideoObject>(
      `/edmedia/video/init?title=${encodeURIComponent(title)}`
    );
    return response.data;
  }

  /**
   * Create video asset after upload
   */
  private async createVideoAsset(payload: UploadPayload, result: BunnyVideoObject): Promise<any> {
    const axiosInstance = this.getAxiosInstance();
    const finalPayload = {
      ...payload,
      videoId: result.videoId,
      libraryId: result.libraryId,
    };
    const response = await axiosInstance.post('/edmedia/video', finalPayload);
    return response.data;
  }

  /**
   * Register media asset (for tasset module)
   */
  private async registerMediaAsset(payload: {
    fileName: string;
    folderName: string;
    productType: string;
    imgUrl: string;
    isPublished: boolean;
  }): Promise<any> {
    const axiosInstance = this.getAxiosInstance();
    const response = await axiosInstance.post('/edmedia/pmedia/image', payload);
    return response.data;
  }

  /**
   * Update file status
   */
  public updateFileStatus(fileStatus: FileUploadStatus): void {
    const index = this.liveFileStatusArr.findIndex((f) => f.uuid === fileStatus.uuid);
    if (index !== -1) {
      this.liveFileStatusArr[index] = fileStatus;
    } else {
      this.liveFileStatusArr.push(fileStatus);
    }
    // Trigger status update callbacks
    this.notifyStatusUpdate();
  }

  /**
   * Get current upload statuses
   */
  public getUploadStatuses(): FileUploadStatus[] {
    return [...this.liveFileStatusArr];
  }

  /**
   * Subscribe to upload status updates
   */
  public onStatusUpdate(callback: (statuses: FileUploadStatus[]) => void): () => void {
    const wrappedCallback = () => callback([...this.liveFileStatusArr]);
    this.assetRefreshCallbacks.add(wrappedCallback);
    
    // Return unsubscribe function
    return () => {
      this.assetRefreshCallbacks.delete(wrappedCallback);
    };
  }

  /**
   * Notify all subscribers of status updates
   */
  private notifyStatusUpdate(): void {
    this.assetRefreshCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error('Error in status update callback:', error);
      }
    });
  }

  /**
   * Clear upload statuses
   */
  public clear(all: boolean = false): void {
    if (all) {
      this.liveFileStatusArr = [];
      this.uploadQueue = [];
    } else {
      this.liveFileStatusArr = [];
    }
    this.notifyStatusUpdate();
  }

  /**
   * Delete upload from queue
   */
  public deleteUpload(uuid: string): void {
    this.liveFileStatusArr = this.liveFileStatusArr.filter((f) => f.uuid !== uuid);
    this.uploadQueue = this.uploadQueue.filter((f) => f.uuid !== uuid);
    this.notifyStatusUpdate();
  }

  /**
   * Hide snackbar
   */
  public hide(value: boolean = true): void {
    this.hideSnackbar = value;
  }

  /**
   * Set loading state
   */
  public setLoading(type: Record<string, boolean>): void {
    this.isLoadingState = { ...this.isLoadingState, ...type };
  }

  /**
   * Get loading state
   */
  public getLoading(): Record<string, boolean> {
    return { ...this.isLoadingState };
  }

  /**
   * Check if any upload is in progress
   */
  public get isUploading(): boolean {
    return this.liveFileStatusArr.some((upload) => upload.status === 'uploading');
  }

  /**
   * Upload link (YouTube/Vimeo)
   */
  public async uploadLink(
    payload: UploadPayload,
    callback: (data: any) => void
  ): Promise<void> {
    const fileStatus: FileUploadStatus = {
      filename: 'Link',
      progress: 0,
      hash: '',
      uuid: this.generateUploadId('link'),
      upload: null,
      status: 'uploading',
    };
    this.updateFileStatus(fileStatus);

    try {
      const axiosInstance = this.getAxiosInstance();
      await axiosInstance.post('/edmedia/link', payload);
      this.updateFileStatus({ ...fileStatus, progress: 100, status: 'completed' });
      callback('refresh');
    } catch (error) {
      console.error('Link upload error:', error);
      this.updateFileStatus({ ...fileStatus, progress: -1, status: 'failed' });
      throw error;
    }
  }

  /**
   * Upload image to Cloudinary
   */
  public async uploadImage(
    file: File,
    moduleName: string,
    imageCallback: (data: { type: string; value: string }) => void
  ): Promise<void> {
    const filename = file.name;
    const fileStatus: FileUploadStatus = {
      filename,
      progress: 0,
      hash: '',
      uuid: this.generateUploadId(filename),
      upload: null,
      status: 'uploading',
    };
    this.updateFileStatus(fileStatus);

    try {
      // Ensure account settings are loaded
      if (!this.accountSettings) {
        await this.loadAccountSettings();
      }

      if (!this.accountSettings) {
        throw new Error('Account settings not available');
      }

      // Get Cloudinary config from account settings
      const cloudinaryCloudName = this.accountSettings.cloudinaryCloudName;
      const cloudinaryPreset = this.accountSettings.cloudinaryPreset;
      const orgId = this.accountSettings.orgId;
      const tenantId = this.accountSettings.tenantId || '';

      if (!cloudinaryCloudName || !cloudinaryPreset) {
        throw new Error('Cloudinary configuration not found');
      }

      const baseImageUploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/upload`;
      const formData = new FormData();
      formData.append('upload_preset', cloudinaryPreset);
      formData.append('folder', `${orgId}-${tenantId}`);
      formData.append('file', file);

      const axiosInstance = axios.create();
      const response = await axiosInstance.post<CloudinaryResponse>(baseImageUploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((100 * progressEvent.loaded) / progressEvent.total);
            this.updateFileStatus({ ...fileStatus, progress });
          }
        },
      });

      const cloudResponse = response.data;

      if (moduleName === 'tasset') {
        const payload = {
          fileName: filename,
          folderName: cloudResponse.folder,
          productType: moduleName,
          imgUrl: cloudResponse.public_id,
          isPublished: true,
        };
        const registerResponse = await this.registerMediaAsset(payload);
        if (registerResponse?.data?.imgUrl) {
          imageCallback({ type: 'image', value: registerResponse.data.imgUrl });
          this.updateFileStatus({ ...fileStatus, progress: 100, status: 'completed' });
          this.triggerAssetRefresh();
        }
      } else {
        imageCallback({ type: 'image', value: cloudResponse.public_id });
        this.updateFileStatus({ ...fileStatus, progress: 100, status: 'completed' });
      }
    } catch (error) {
      console.error('Image upload error:', error);
      this.updateFileStatus({ ...fileStatus, progress: -1, status: 'failed' });
      throw error;
    }
  }

  /**
   * Upload video to Bunny CDN using TUS protocol
   */
  public async uploadVideo(
    file: File,
    payload: UploadPayload,
    callback: (data: any) => void
  ): Promise<void> {
    const fileName = file.name;
    const fileStatus: FileUploadStatus = {
      filename: fileName,
      progress: 0,
      hash: '',
      uuid: this.generateUploadId(fileName),
      upload: null,
      status: 'uploading',
    };
    this.updateFileStatus(fileStatus);

    try {
      const result = await this.createVideoObject(fileName);
      fileStatus.hash = result.sha256;

      const upload = new tus.Upload(file, {
        endpoint: result.tusEndPoint,
        retryDelays: [0, 3000, 5000, 10000, 20000, 60000, 60000],
        headers: {
          AuthorizationSignature: result.sha256,
          AuthorizationExpire: String(result.expirationTime),
          VideoId: result.videoId,
          LibraryId: String(result.libraryId),
        },
        metadata: {},
        onError: (error: Error) => {
          console.error('TUS upload error:', error);
          this.updateFileStatus({ ...fileStatus, progress: -1, upload, status: 'failed' });
        },
        onProgress: (bytesUploaded: number, bytesTotal: number) => {
          const progress = (bytesUploaded / bytesTotal) * 100;
          this.updateFileStatus({ ...fileStatus, progress, upload });
        },
        onSuccess: async () => {
          try {
            await this.createVideoAsset(payload, result);
            callback('refresh');
            setTimeout(() => {
              this.updateFileStatus({ ...fileStatus, progress: 100, upload, status: 'completed' });
            }, 1000);
          } catch (error) {
            console.error('Error creating video asset:', error);
            this.updateFileStatus({ ...fileStatus, progress: -1, upload, status: 'failed' });
          }
        },
      });

      fileStatus.upload = upload;

      // Check for previous uploads and resume if found
      const previousUploads = await upload.findPreviousUploads();
      if (previousUploads && previousUploads.length > 0) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }

      upload.start();
    } catch (error) {
      console.error('Video upload initialization error:', error);
      this.updateFileStatus({ ...fileStatus, progress: -1, status: 'failed' });
      throw error;
    }
  }

  /**
   * Upload file to S3 using signed URL
   */
  public async uploadFile(
    file: File,
    payload: UploadPayload,
    callback: (data: any) => void
  ): Promise<void> {
    const fileName = file.name;
    const fileStatus: FileUploadStatus = {
      filename: fileName,
      progress: 0,
      hash: '',
      uuid: this.generateUploadId(fileName),
      upload: null,
      status: 'uploading',
    };
    this.updateFileStatus(fileStatus);

    try {
      const initResult = await this.createFileUrl(payload);
      const signedUrl = initResult.response.signedUrl;
      const fileId = initResult.response.fileId;

      const axiosInstance = axios.create();
      await axiosInstance.put(signedUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((100 * progressEvent.loaded) / progressEvent.total);
            this.updateFileStatus({ ...fileStatus, progress });
          }
        },
      });

      await this.createFileAsset(fileId);
      callback('refresh');
      setTimeout(() => {
        this.updateFileStatus({ ...fileStatus, progress: 100, status: 'completed' });
      }, 1000);
    } catch (error) {
      console.error('File upload error:', error);
      this.updateFileStatus({ ...fileStatus, progress: -1, status: 'failed' });
      throw error;
    }
  }

  /**
   * Get media images
   */
  public async getMediaImages(): Promise<any> {
    const axiosInstance = this.getAxiosInstance();
    const response = await axiosInstance.get('/edmedia/pmedia');
    return response.data;
  }

  /**
   * Get default event value
   */
  public async getDefaultEventValue(): Promise<any> {
    const axiosInstance = this.getAxiosInstance();
    const response = await axiosInstance.get('/snode/spref');
    return response.data;
  }

  /**
   * Delete asset
   */
  public async deleteAsset(assetId: string): Promise<void> {
    const axiosInstance = this.getAxiosInstance();
    await axiosInstance.delete(`/edmedia/asset/${assetId}`);
  }

  /**
   * Generate thumbnail from HTML element
   */
  public async generateThumbnailFromHtml(
    container: HTMLElement,
    name: string,
    callback: (data: { type: string; value: string }) => void
  ): Promise<void> {
    if (!container) {
      return;
    }

    try {
      // Dynamic import of html-to-image to avoid SSR issues
      const { toBlob } = await import('html-to-image');
      const pngBlob = await toBlob(container);
      
      if (!pngBlob) {
        return;
      }

      // Generate filename tag
      const filename = this.generateTag(name);
      const file = new File([pngBlob], `${filename}.png`, { type: 'image/png' });
      await this.uploadImage(file, 'timage', callback);
    } catch (error) {
      console.error('Error generating thumbnail:', error);
    }
  }

  /**
   * Generate tag from name (sanitize for filename)
   */
  private generateTag(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Trigger asset refresh - notify subscribers
   */
  public triggerAssetRefresh(): void {
    this.notifyStatusUpdate();
  }

  /**
   * Subscribe to asset refresh events
   */
  public onAssetRefresh(callback: () => void): () => void {
    this.assetRefreshCallbacks.add(callback);
    return () => {
      this.assetRefreshCallbacks.delete(callback);
    };
  }
}

// Export singleton instance
export const uploadService = new UploadService();
export default uploadService;
