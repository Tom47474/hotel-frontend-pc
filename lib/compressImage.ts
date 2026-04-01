// 前端压缩函数（Client Component）
interface CompressResult {
  blob: Blob;
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: string;
}

async function compressImage(file: File, quality: number = 0.8): Promise<CompressResult> {
  const originalSize = file.size;
  const originalSizeKB = (originalSize / 1024).toFixed(2);
  
  const bitmap = await createImageBitmap(file);
  const maxWidth = 1600;
  const scale = Math.min(1, maxWidth / bitmap.width);
  const w = Math.floor(bitmap.width * scale);
  const h = Math.floor(bitmap.height * scale);

  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d') || null;
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  ctx.drawImage(bitmap, 0, 0, w, h);

  const blob = await canvas.convertToBlob({
    type: 'image/webp',
    quality: quality
  });
  const fileName = file.name.replace(/\.\w+$/, '') + '.webp';
  const compressedFile = new File([blob], fileName, {
    type: 'image/webp',
  });

  const compressedSize = blob.size;
  const compressedSizeKB = (compressedSize / 1024).toFixed(2);
  const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2);

  // 打印压缩前后对比
  console.group('🖼️ 图片压缩详情');
  console.log(`文件名：${file.name}`);
  console.log(`原始尺寸：${bitmap.width} x ${bitmap.height}`);
  console.log(`压缩后尺寸：${w} x ${h}`);
  console.log(`原始大小：${originalSizeKB} KB`);
  console.log(`压缩后大小：${compressedSizeKB} KB`);
  console.log(`压缩率：${compressionRatio}%`);
  console.log(`质量参数：${quality}`);
  console.groupEnd();

  return {
    blob,
    file: compressedFile,
    originalSize,
    compressedSize,
    compressionRatio: `${compressionRatio}%`
  };
}

export default compressImage;