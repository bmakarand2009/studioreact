/**
 * Upload plugin types and interfaces
 */

export type MediaType = 'video' | 'audio' | 'image' | 'pdf' | 'link' | 'description' | 'other';

export type UploadStatus = 'uploading' | 'completed' | 'failed';

export interface FileUploadStatus {
  filename: string;
  progress: number;
  hash: string;
  uuid: string;
  upload: any | null;
  status: UploadStatus;
}

export interface UploadPayload {
  mediaType: MediaType;
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

export interface AssetData {
  _id: string;
  mediaType: MediaType;
  fileName: string;
  s3url?: string;
  url?: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  dynamicPreview?: string;
  videoId?: string;
  libraryId?: number;
  videoStatus?: string;
  playVideo?: boolean;
}

export interface UploadMediaFileProps {
  title?: string;
  helpText?: string;
  moduleName?: string;
  allowMultipleUploads?: boolean;
  buttonName?: string;
  assetData?: AssetData[];
  isUploadDisabled?: boolean;
  isStudentFile?: boolean;
  isFranchiseCourse?: boolean;
  imageUrl?: string;
  description?: string | null;
  showPreview?: boolean;
  isShowScorm?: boolean;
  isSingleUploadBlock?: boolean;
  horizontalPosition?: 'start' | 'center' | 'end';
  width?: string;
  isDownloadable?: boolean;
  productData?: {
    productId?: string;
    questionId?: string;
    productName?: string;
    chapterId?: string;
    sectionId?: string;
    isHomework?: boolean;
  };
  allowedMedia?: MediaType[];
  onOutput?: (data: any) => void;
  /** Cloudinary cloud name - required to build preview URLs for images stored in Cloudinary */
  cloudName?: string;
}

export interface AvailableFileMimeTypes {
  video: string[];
  audio: string[];
  image: string[];
  pdf: string[];
}
