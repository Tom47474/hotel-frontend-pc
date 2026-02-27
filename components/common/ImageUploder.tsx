"use client";

import { useCallback, useRef, useState } from "react";

type UploadImageItem = {
  file: File;
  preview: string;
};

type ImageUploaderProps = {
  onChange?: (files: File[]) => void;
};

export function ImageUploader({ onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<UploadImageItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dragIndex = useRef<number | null>(null);

  /** 处理文件 */
  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;

      const newItems: UploadImageItem[] = Array.from(fileList)
        .filter((f) => f.type.startsWith("image/"))
        .map((file) => ({
          file,
          preview: URL.createObjectURL(file),
        }));

      if (!newItems.length) return;

      const next = [...images, ...newItems];
      setImages(next);
      onChange?.(next.map((i) => i.file));
    },
    [images, onChange]
  );

  /** ====== 拖拽上传相关 ====== */

  const handleUploadDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleUploadDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleUploadDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  /** ====== 图片排序拖拽 ====== */

  const handleDragStart = (index: number) => {
    dragIndex.current = index;
  };

  const handleDropSort = (index: number) => {
    if (dragIndex.current === null) return;

    const updated = [...images];
    const [moved] = updated.splice(dragIndex.current, 1);
    updated.splice(index, 0, moved);

    dragIndex.current = null;
    setImages(updated);
    onChange?.(updated.map((i) => i.file));
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    onChange?.(updated.map((i) => i.file));
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* 上传区域 */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleUploadDragOver}
        onDragLeave={handleUploadDragLeave}
        onDrop={handleUploadDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded border border-dashed px-4 py-6 text-sm transition
          ${
            isDragging
              ? "border-blue-500 bg-blue-50 text-blue-600"
              : "border-zinc-300 text-zinc-500 hover:border-zinc-400 hover:bg-zinc-50"
          }`}
      >
        {isDragging ? "释放鼠标以上传图片" : "点击或拖拽图片到此处上传"}
        <p className="mt-1 text-xs text-zinc-400">支持多张 JPG / PNG</p>
      </div>

      {/* 预览区域 */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((item, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDropSort(index)}
              className="relative h-24 w-full overflow-hidden rounded border border-zinc-200"
            >
              <img
                src={item.preview}
                className="h-full w-full object-cover"
              />

              {/* 主图标识 */}
              {index === 0 && (
                <div className="absolute left-0 top-0 bg-black/60 px-2 py-1 text-xs text-white">
                  主图
                </div>
              )}

              {/* 删除按钮 */}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute right-1 top-1 rounded bg-black/60 px-1 text-xs text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}