export type MediaAsset = {
  id: string;
  displayUrl: string;
  originalUrl: string;
  thumbnailUrl?: string;
  publicId: string; // Cloudinary public ID for storage in forms (matches Angular pattern)
};

export type GroupedMediaRow = {
  columns: number;
  items: MediaAsset[];
};


