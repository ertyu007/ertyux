"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import type { UploadedImageProof } from "./actions";

export type ImageItemStatus = "ready" | "uploading" | "done" | "error";

export type ImageItem = {
  id: string;
  type: "existing" | "new";
  url?: string;
  file?: File;
  preview?: string;
  status?: ImageItemStatus;
  upload?: UploadedImageProof;
};

type ProjectImageUploaderProps = {
  items: ImageItem[];
  onChange: (items: ImageItem[]) => void;
  disabled?: boolean;
  busy?: boolean;
  maxFiles?: number;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `new-${crypto.randomUUID()}`;
  }

  return `new-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function fileFingerprint(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function containsFiles(event: DragEvent<HTMLDivElement>): boolean {
  return Array.from(event.dataTransfer.types).includes("Files");
}

export default function ProjectImageUploader({
  items,
  onChange,
  disabled = false,
  busy = false,
  maxFiles = 5,
}: ProjectImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const objectUrlsRef = useRef(new Set<string>());

  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const markImageLoaded = (source: string) => {
    setLoadedImages((current) =>
      current[source] ? current : { ...current, [source]: true }
    );
  };

  const previewItem = useMemo(
    () => items.find((item) => item.id === previewId) ?? null,
    [items, previewId]
  );

  const remainingSlots = Math.max(0, maxFiles - items.length);
  const canAdd = !disabled && !busy && remainingSlots > 0;

  const existingFingerprints = useMemo(() => {
    return new Set(
      items
        .map((item) => item.file)
        .filter((file): file is File => file instanceof File)
        .map(fileFingerprint)
    );
  }, [items]);

  const newItems = useMemo(
    () =>
      items.filter(
        (item): item is ImageItem & { type: "new"; file: File } =>
          item.type === "new" && item.file instanceof File
      ),
    [items]
  );

  const completedCount = newItems.filter(
    (item) => item.status === "done"
  ).length;
  const uploadingCount = newItems.filter(
    (item) => item.status === "uploading"
  ).length;
  const progressPercent =
    newItems.length > 0
      ? Math.round((completedCount / newItems.length) * 100)
      : 100;

  useEffect(() => {
    const activeUrls = new Set(
      items
        .map((item) => item.preview)
        .filter((url): url is string => Boolean(url))
    );

    for (const url of objectUrlsRef.current) {
      if (!activeUrls.has(url)) {
        URL.revokeObjectURL(url);
        objectUrlsRef.current.delete(url);
      }
    }
  }, [items]);

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
      urls.clear();
    };
  }, []);

  useEffect(() => {
    if (!previewItem) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewId(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewItem]);

  const openFilePicker = () => {
    if (canAdd) inputRef.current?.click();
  };

  const addFiles = (inputFiles: FileList | File[]) => {
    if (!canAdd) return;

    const incoming = Array.from(inputFiles);
    if (incoming.length === 0) return;

    const accepted: File[] = [];
    const errors: string[] = [];
    const batchFingerprints = new Set<string>();

    for (const file of incoming) {
      const contentType = file.type.toLowerCase();

      if (!ACCEPTED_TYPES.has(contentType)) {
        errors.push(`${file.name}: ไม่รองรับชนิดไฟล์นี้`);
        continue;
      }

      if (file.size <= 0) {
        errors.push(`${file.name}: ไฟล์ว่าง`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: ขนาดเกิน 5 MB`);
        continue;
      }

      const fingerprint = fileFingerprint(file);
      if (
        existingFingerprints.has(fingerprint) ||
        batchFingerprints.has(fingerprint)
      ) {
        errors.push(`${file.name}: เลือกไฟล์นี้แล้ว`);
        continue;
      }

      batchFingerprints.add(fingerprint);
      accepted.push(file);
    }

    const filesToAdd = accepted.slice(0, remainingSlots);
    if (accepted.length > remainingSlots) {
      errors.push(`เพิ่มได้อีก ${remainingSlots} รูปเท่านั้น`);
    }

    const appendedItems = filesToAdd.map<ImageItem>((file) => {
      const preview = URL.createObjectURL(file);
      objectUrlsRef.current.add(preview);

      return {
        id: makeId(),
        type: "new",
        file,
        preview,
        status: "ready",
      };
    });

    if (appendedItems.length > 0) {
      onChange([...items, ...appendedItems]);
    }

    setMessage(errors.join(" • "));

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(event.target.files);
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (!canAdd || !containsFiles(event)) return;

    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current += 1;
    setDragging(true);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!canAdd || !containsFiles(event)) return;

    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!containsFiles(event)) return;

    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

    if (dragDepthRef.current === 0) setDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    dragDepthRef.current = 0;
    setDragging(false);

    if (canAdd) addFiles(event.dataTransfer.files);
  };

  const removeItem = (id: string) => {
    if (disabled || busy) return;
    onChange(items.filter((item) => item.id !== id));
    if (previewId === id) setPreviewId(null);
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    if (disabled || busy) return;

    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const next = [...items];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange(next);
  };

  const setCover = (id: string) => {
    if (disabled || busy) return;

    const index = items.findIndex((item) => item.id === id);
    if (index <= 0) return;

    const next = [...items];
    const [selected] = next.splice(index, 1);
    next.unshift(selected);
    onChange(next);
  };

  const dropItemAt = (targetId: string) => {
    if (!draggedItemId || draggedItemId === targetId || disabled || busy) return;
    const from = items.findIndex((item) => item.id === draggedItemId);
    const to = items.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
    setDraggedItemId(null);
  };

  const busyTitle = (() => {
    if (newItems.length === 0) return "กำลังบันทึกข้อมูล...";
    if (completedCount === newItems.length) return "อัปโหลดเสร็จ กำลังบันทึกข้อมูล...";
    if (uploadingCount > 0) return "กำลังอัปโหลดรูปภาพ...";
    return "กำลังเตรียมอัปโหลด...";
  })();

  return (
    <div className="project-uploader">
      <div className="project-uploader__header">
        <div>
          <strong>รูปภาพโปรเจกต์</strong>
          <span>สูงสุด {maxFiles} รูป รูปละไม่เกิน 5 MB</span>
        </div>
        <span className="project-uploader__count">
          {items.length}/{maxFiles}
        </span>
      </div>

      <div
        className={`project-uploader__panel${
          items.length === 0 ? " project-uploader__panel--empty" : ""
        }${dragging ? " project-uploader__panel--dragging" : ""}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          onChange={handleInputChange}
          disabled={!canAdd}
          hidden
        />

        {items.length < maxFiles ? (
          <button
            type="button"
            className="project-uploader__drop-button"
            onClick={openFilePicker}
            disabled={!canAdd}
          >
            <UploadCloud size={28} />
            {items.length === 0 ? (
              <span className="project-uploader__empty-copy">
                <small>JPG, PNG, WEBP, GIF หรือ AVIF</small>
              </span>
            ) : null}
            {items.length > 0 ? (
              <span className="project-uploader__add-label">
                <ImagePlus size={15} /> เพิ่มรูป
              </span>
            ) : null}
          </button>
        ) : null}

        {items.length > 0 ? (
          <div className="project-uploader__list">
            {items.map((item, index) => {
              const source = item.preview || item.url;
              const isCover = index === 0;
              const itemStatus = item.status || "ready";

              return (
                <article
                  className={`project-uploader__item project-uploader__item--${itemStatus}`}
                  key={item.id}
                  draggable={!disabled && !busy}
                  onDragStart={() => setDraggedItemId(item.id)}
                  onDragEnd={() => setDraggedItemId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => dropItemAt(item.id)}
                >
                  <div
                    className="project-uploader__thumb"
                    onDoubleClick={() => (isCover ? setPreviewId(item.id) : setCover(item.id))}
                    title={isCover ? "ดับเบิลคลิกเพื่อดูภาพ" : "ลากเพื่อจัดลำดับ หรือดับเบิลคลิกเพื่อตั้งเป็นภาพปก"}
                  >
                    {source ? (
                      <>
                        {!loadedImages[source] ? (
                          <span
                            className="project-uploader__image-skeleton"
                            aria-label="กำลังโหลดรูปภาพ"
                          />
                        ) : null}
                        <img
                          src={source}
                          alt={item.file?.name || `รูปที่ ${index + 1}`}
                          className={loadedImages[source] ? "is-loaded" : ""}
                          onLoad={() => markImageLoaded(source)}
                          onError={() => markImageLoaded(source)}
                        />
                      </>
                    ) : (
                      <div>ไม่มีรูป</div>
                    )}

                    {isCover ? (
                      <span className="project-uploader__cover">
                        <Star size={11} fill="currentColor" /> ภาพปก
                      </span>
                    ) : null}

                    {itemStatus === "error" ? (
                      <div
                        className="project-uploader__status-ring project-uploader__status-ring--error"
                        aria-hidden="true"
                      >
                        <AlertCircle size={18} />
                      </div>
                    ) : null}

                    {itemStatus === "uploading" ? (
                      <span
                        className="project-uploader-status"
                        role="status"
                        aria-label="กำลังอัปโหลด"
                      >
                        <Loader2
                          className="project-uploader-status__spinner"
                          size={14}
                          aria-hidden="true"
                        />
                      </span>
                    ) : null}
                  </div>

                  <div className="project-uploader__item-info">
                    <strong>{item.file?.name || `รูปที่ ${index + 1}`}</strong>
                    <span>
                      {item.file
                        ? formatSize(item.file.size)
                        : "รูปที่บันทึกไว้แล้ว"}
                    </span>
                  </div>

                  <div className="project-uploader__actions">
                    <button
                      type="button"
                      onClick={() => moveItem(index, -1)}
                      disabled={disabled || busy || index === 0}
                      title="เลื่อนไปก่อนหน้า"
                      aria-label="เลื่อนไปก่อนหน้า"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, 1)}
                      disabled={disabled || busy || index === items.length - 1}
                      title="เลื่อนไปถัดไป"
                      aria-label="เลื่อนไปถัดไป"
                    >
                      <ArrowRight size={14} />
                    </button>
                    {!isCover ? (
                      <button
                        type="button"
                        onClick={() => setCover(item.id)}
                        disabled={disabled || busy}
                        title="ตั้งเป็นภาพปก"
                        aria-label="ตั้งเป็นภาพปก"
                      >
                        <Star size={14} />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setPreviewId(item.id)}
                      disabled={!source}
                      title="ดูรูป"
                      aria-label="ดูรูป"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      type="button"
                      className="project-uploader__delete"
                      onClick={() => removeItem(item.id)}
                      disabled={disabled || busy}
                      title="ลบรูป"
                      aria-label="ลบรูป"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}

        {dragging ? (
          <div className="project-uploader__drag-overlay" aria-hidden="true">
            <UploadCloud size={40} />
            <strong>วางไฟล์ตรงนี้</strong>
          </div>
        ) : null}

        {busy ? (
          <div className="project-uploader__busy" aria-live="polite">
            <Loader2 className="project-uploader__spinner" size={30} />
            <strong>{busyTitle}</strong>
            {newItems.length > 0 ? (
              <>
                <span>
                  เสร็จแล้ว {completedCount}/{newItems.length} รูป
                </span>
                <div
                  className="project-uploader__progress"
                  role="progressbar"
                  aria-label="ความคืบหน้าการอัปโหลด"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progressPercent}
                >
                  <span style={{ width: `${progressPercent}%` }} />
                </div>
              </>
            ) : (
              <span>กรุณารอจนกว่าจะบันทึกเสร็จ</span>
            )}
          </div>
        ) : null}
      </div>

      {message ? (
        <div className="project-uploader__message" role="alert">
          <AlertCircle size={16} />
          <span>{message}</span>
          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="ปิดข้อความ"
          >
            <X size={15} />
          </button>
        </div>
      ) : null}

      {previewItem && (previewItem.preview || previewItem.url) ? (
        <div
          className="project-uploader-preview"
          role="dialog"
          aria-modal="true"
          aria-label="ดูตัวอย่างรูป"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewId(null);
          }}
        >
          <div className="project-uploader-preview__panel">
            <button
              type="button"
              onClick={() => setPreviewId(null)}
              aria-label="ปิดตัวอย่าง"
            >
              <X size={20} />
            </button>
            {!loadedImages[previewItem.preview || previewItem.url || ""] ? (
              <span className="project-uploader-preview__skeleton" />
            ) : null}
            <img
              src={previewItem.preview || previewItem.url}
              alt={previewItem.file?.name || "ตัวอย่างรูป"}
              className={
                loadedImages[previewItem.preview || previewItem.url || ""]
                  ? "is-loaded"
                  : ""
              }
              onLoad={() =>
                markImageLoaded(previewItem.preview || previewItem.url || "")
              }
              onError={() =>
                markImageLoaded(previewItem.preview || previewItem.url || "")
              }
            />
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        .project-uploader,
        .project-uploader * {
          box-sizing: border-box;
        }

        .project-uploader {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
          color: #172033;
          font-family: Arial, Helvetica, sans-serif;
        }

        .project-uploader__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .project-uploader__header > div {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .project-uploader__header strong {
          font-size: 14px;
        }

        .project-uploader__header span {
          color: #667085;
          font-size: 12px;
        }

        .project-uploader__count {
          padding: 4px 8px;
          border: 1px solid #d9dee7;
          border-radius: 999px;
          background: #ffffff;
          color: #172033 !important;
          font-weight: 700;
        }

        .project-uploader__panel {
          position: relative;
          flex: 1;
          min-height: 220px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid #cfd6e0;
          border-radius: 10px;
          background: #ffffff;
        }

        .project-uploader__panel--dragging {
          border-color: #087ea4;
          box-shadow: 0 0 0 3px rgba(8, 126, 164, 0.12);
        }

        .project-uploader__drop-button {
          order: 2;
          flex: 0 0 auto;
          min-height: 58px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 12px;
          width: calc(100% - 20px);
          margin: 0 10px 10px;
          padding: 10px 12px;
          border: 1px dashed #cfd6e0;
          border-radius: 8px;
          background: #fafbfc;
          color: #475467;
          text-align: left;
          cursor: pointer;
        }

        .project-uploader__drop-button:not(:disabled):hover {
          background: #f0f7fa;
          color: #087ea4;
        }

        .project-uploader__panel--empty .project-uploader__drop-button {
          flex: 1;
          width: 100%;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 180px;
          margin: 0;
          text-align: center;
        }

        .project-uploader__panel--empty {
          border: 0;
          background: transparent;
        }

        .project-uploader__panel--empty
          .project-uploader__drop-button
          > .project-uploader__empty-copy {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
        }

        .project-uploader__drop-button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .project-uploader__drop-button > span:not(.project-uploader__add-label) {
          display: none;
        }

        .project-uploader__drop-button strong {
          color: #172033;
          font-size: 14px;
        }

        .project-uploader__drop-button small {
          color: #667085;
          font-size: 12px;
        }

        .project-uploader__add-label {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-left: 0;
          padding: 0;
          border: 0;
          background: transparent;
          color: #172033;
          font-size: 12px;
          font-weight: 700;
        }

        .project-uploader__list {
          order: 1;
          min-height: 0;
          overflow: visible;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          align-content: start;
          gap: 8px;
          padding: 10px;
        }

        .project-uploader__item {
          position: relative;
          cursor: grab;
          min-width: 0;
          overflow: hidden;
          border: 1px solid #d9dee7;
          border-radius: 8px;
          background: #ffffff;
        }

        .project-uploader__item-info {
          display: none;
        }

        .project-uploader__actions {
          position: absolute;
          inset: 0;
          z-index: 4;
          align-items: flex-start;
          justify-content: flex-end;
          padding: 4px;
          opacity: 0;
          pointer-events: none;
        }

        .project-uploader__item:hover .project-uploader__actions,
        .project-uploader__item:focus-within .project-uploader__actions {
          opacity: 1;
          pointer-events: auto;
        }

        .project-uploader__actions button:not(.project-uploader__delete) {
          display: none;
        }

        .project-uploader__actions .project-uploader__delete {
          display: grid;
          width: 40px;
          height: 40px;
          padding: 0;
          place-items: center;
          border: 1px solid rgba(255,255,255,0.45);
          border-radius: 50%;
          background: rgba(15, 23, 42, 0.82);
          color: #fff;
        }

        .project-uploader__item--uploading {
          border-color: rgba(8, 126, 164, 0.45);
          box-shadow: 0 0 0 1px rgba(8, 126, 164, 0.14), 0 10px 24px rgba(8, 126, 164, 0.1);
        }

        .project-uploader__item--error {
          border-color: rgba(196, 50, 79, 0.34);
        }

        .project-uploader__thumb {
          position: relative;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          background: #e9edf2;
        }

        .project-uploader__thumb img,
        .project-uploader__thumb > div:not(.project-uploader__status-ring) {
          width: 100%;
          height: 100%;
        }

        .project-uploader__thumb img {
          display: block;
          object-fit: contain;
          background: #111827;
          opacity: 0;
          transition: opacity 160ms ease;
        }

        .project-uploader__thumb img.is-loaded {
          opacity: 1;
        }

        .project-uploader__image-skeleton,
        .project-uploader-preview__skeleton {
          position: absolute;
          inset: 0;
          z-index: 1;
          display: block;
          background:
            linear-gradient(
              100deg,
              transparent 20%,
              rgba(255, 255, 255, 0.72) 45%,
              transparent 70%
            ),
            #e6eaf0;
          background-size: 220% 100%;
          animation: project-image-shimmer 1.1s linear infinite;
        }

        @keyframes project-image-shimmer {
          to {
            background-position: -220% 0;
          }
        }

        .project-uploader__item--uploading .project-uploader__thumb img {
          opacity: 0.82;
          filter: saturate(0.95) brightness(0.95);
        }

        .project-uploader__item--error .project-uploader__thumb img {
          filter: saturate(0.85) grayscale(0.08);
        }

        .project-uploader__thumb > div:not(.project-uploader__status-ring) {
          display: grid;
          place-items: center;
          color: #667085;
          font-size: 12px;
        }

        .project-uploader__cover {
          position: absolute;
          top: 7px;
          left: 7px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 6px;
          border-radius: 5px;
          background: rgba(0, 0, 0, 0.72);
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
        }

        .project-uploader__status-ring {
          position: absolute;
          inset: 50% auto auto 50%;
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border: 2px solid rgba(255,255,255,0.7);
          border-top-color: #1684a7;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          animation: project-uploader-spin 0.9s linear infinite;
          box-shadow: 0 2px 10px rgba(8,126,164,0.28);
        }

        .project-uploader__status-ring::before {
          content: "";
          position: absolute;
          inset: 4px;
          border-radius: 50%;
          background: rgba(15, 23, 42, 0.82);
        }

        .project-uploader__status-ring > svg {
          position: relative;
          z-index: 1;
        }

        .project-uploader__status-ring--error {
          background:
            conic-gradient(#c4324f 100%, rgba(196, 50, 79, 0.16) 0);
          color: #ffffff;
          box-shadow: 0 2px 10px rgba(196, 50, 79, 0.25);
          animation: none;
        }

        .project-uploader__item-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 8px 9px 5px;
        }

        .project-uploader__item-info strong,
        .project-uploader__item-info span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .project-uploader__item-info strong {
          font-size: 12px;
        }

        .project-uploader__item-info span {
          color: #667085;
          font-size: 11px;
        }

        .project-uploader__actions {
          display: flex;
          gap: 5px;
          padding: 5px 8px 8px;
        }

        .project-uploader__actions button {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          padding: 0;
          border: 1px solid #d9dee7;
          border-radius: 6px;
          background: #f8fafc;
          color: #475467;
          cursor: pointer;
        }

        .project-uploader__actions button:hover:not(:disabled) {
          border-color: #087ea4;
          color: #087ea4;
        }

        .project-uploader__actions .project-uploader__delete:hover:not(:disabled) {
          border-color: #c4324f;
          color: #c4324f;
        }

        .project-uploader__actions button:disabled {
          cursor: not-allowed;
          opacity: 0.35;
        }

        .project-uploader__drag-overlay,
        .project-uploader__busy {
          position: absolute;
          inset: 0;
          z-index: 20;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 20px;
          text-align: center;
        }

        .project-uploader__drag-overlay {
          pointer-events: none;
          border: 2px solid #087ea4;
          background: rgba(240, 247, 250, 0.96);
          color: #087ea4;
        }

        .project-uploader__busy {
          background: rgba(255, 255, 255, 0.96);
          color: #172033;
        }

        .project-uploader__busy span {
          color: #667085;
          font-size: 12px;
        }

        .project-uploader__progress {
          width: min(280px, calc(100% - 40px));
          height: 8px;
          overflow: hidden;
          border-radius: 999px;
          background: #e9edf2;
        }

        .project-uploader__progress > span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: #087ea4;
          transition: width 180ms ease;
        }

        .project-uploader__spinner,
        .project-uploader-status__spinner {
          animation: project-uploader-spin 0.8s linear infinite;
        }

        .project-uploader__message {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          padding: 9px 10px;
          border: 1px solid #efb3bf;
          border-radius: 7px;
          background: #fff3f5;
          color: #c4324f;
          font-size: 12px;
          line-height: 1.45;
        }

        .project-uploader__message > span {
          flex: 1;
        }

        .project-uploader__message button {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          padding: 0;
          border: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
        }

        .project-uploader-status {
          position: absolute;
          right: 7px;
          bottom: 7px;
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          padding: 0;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.76);
          color: #ffffff;
        }

        .project-uploader-status--done {
          color: #86efac;
        }

        .project-uploader-status--error {
          color: #fda4af;
        }

        .project-uploader-preview {
          position: fixed;
          inset: 0;
          z-index: 100001;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(15, 23, 42, 0.86);
        }

        .project-uploader-preview__panel {
          position: relative;
          width: min(1000px, 100%);
          height: min(80dvh, 760px);
          overflow: hidden;
          border-radius: 10px;
          background: #0f172a;
        }

        .project-uploader-preview__panel img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: contain;
          opacity: 0;
        }

        .project-uploader-preview__panel img.is-loaded {
          opacity: 1;
        }

        .project-uploader-preview__panel > button {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 2;
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.7);
          color: #ffffff;
          cursor: pointer;
        }

        @keyframes project-uploader-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 620px) {
          .project-uploader__drop-button {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .project-uploader__list {
            grid-template-columns: 1fr;
          }

        }

        @media (prefers-reduced-motion: reduce) {
          .project-uploader__spinner,
          .project-uploader-status__spinner {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
