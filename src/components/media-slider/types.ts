export type MediaAsset = {
  id: string;
  displayUrl: string;
  originalUrl: string;
  thumbnailUrl?: string;
};

export type GroupedMediaRow = {
  columns: number;
  items: MediaAsset[];
};


