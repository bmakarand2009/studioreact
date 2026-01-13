import { GroupedMediaRow, MediaAsset } from './types';

const ROW_PATTERN = [2, 3, 4];

export const groupImagesIntoRows = (assets: MediaAsset[]): GroupedMediaRow[] => {
  if (!assets.length) {
    return [];
  }

  if (assets.length === 1) {
    return [{ columns: 1, items: [...assets] }];
  }

  const rows: GroupedMediaRow[] = [];
  const remaining = [...assets];
  let patternIndex = 0;

  while (remaining.length > 0) {
    const desiredColumns = ROW_PATTERN[patternIndex % ROW_PATTERN.length];

    if (remaining.length === 1 && rows.length) {
      rows[rows.length - 1].items.push(remaining.shift() as MediaAsset);
      break;
    }

    const takeCount = Math.min(desiredColumns, remaining.length);
    const items = remaining.splice(0, takeCount);

    rows.push({
      columns: Math.min(desiredColumns, items.length),
      items,
    });

    patternIndex += 1;
  }

  return rows;
};


