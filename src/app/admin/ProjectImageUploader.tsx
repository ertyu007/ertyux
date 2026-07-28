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
  Check,
  Eye,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

export type ImageItemStatus = "ready" | "uploading" | "done" | "error";

export type ImageItem = {
  id: string;
  type: "existing" | "new";
  url?: string;
  file?: File;
  preview?: string;
  status?: ImageItemStatus;
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
          dragging ? " project-uploader__panel--dragging" : ""
        }`}
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

        <button
          type="button"
          className="project-uploader__drop-button"
          onClick={openFilePicker}
          disabled={!canAdd}
        >
          <UploadCloud size={28} />
          <span>
            <strong>ลากรูปมาวางในกล่องนี้</strong>
            <small>หรือคลิกเพื่อเลือกหลายไฟล์พร้อมกัน</small>
          </span>
          {items.length > 0 ? (
            <span className="project-uploader__add-label">
              <ImagePlus size={15} /> เพิ่มรูป
            </span>
          ) : null}
        </button>

        {items.length > 0 ? (
          <div className="project-uploader__list">
            {items.map((item, index) => {
              const source = item.preview || item.url;
              const isCover = index === 0;

              return (
                <article className="project-uploader__item" key={item.id}>
                  <div className="project-uploader__thumb">
                    {source ? (
                      <img
                        src={source}
                        alt={item.file?.name || `รูปที่ ${index + 1}`}
                      />
                    ) : (
                      <div>ไม่มีรูป</div>
                    )}

                    {isCover ? (
                      <span className="project-uploader__cover">
                        <Star size={11} fill="currentColor" /> ภาพปก
                      </span>
                    ) : null}

                    <StatusBadge status={item.status} />
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
        ) : (
          <div className="project-uploader__empty-note">
            JPG, PNG, WEBP, GIF หรือ AVIF
          </div>
        )}

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
            <img
              src={previewItem.preview || previewItem.url}
              alt={previewItem.file?.name || "ตัวอย่างรูป"}
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
          height: 430px;
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
          flex: 0 0 auto;
          width: 100%;
          min-height: 112px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 18px;
          border: 0;
          border-bottom: 1px dashed #cfd6e0;
          background: #f8fafc;
          color: #475467;
          text-align: left;
          cursor: pointer;
        }

        .project-uploader__drop-button:not(:disabled):hover {
          background: #f0f7fa;
          color: #087ea4;
        }

        .project-uploader__drop-button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .project-uploader__drop-button > span:not(.project-uploader__add-label) {
          display: flex;
          flex-direction: column;
          gap: 3px;
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
          margin-left: 8px;
          padding: 7px 10px;
          border: 1px solid #cfd6e0;
          border-radius: 7px;
          background: #ffffff;
          color: #172033;
          font-size: 12px;
          font-weight: 700;
        }

        .project-uploader__list {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-content: start;
          gap: 10px;
          padding: 12px;
        }

        .project-uploader__item {
          min-width: 0;
          overflow: hidden;
          border: 1px solid #d9dee7;
          border-radius: 8px;
          background: #ffffff;
        }

        .project-uploader__thumb {
          position: relative;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          background: #e9edf2;
        }

        .project-uploader__thumb img,
        .project-uploader__thumb > div {
          width: 100%;
          height: 100%;
        }

        .project-uploader__thumb img {
          display: block;
          object-fit: contain;
          background: #111827;
        }

        .project-uploader__thumb > div {
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
          width: 29px;
          height: 29px;
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

        .project-uploader__empty-note {
          flex: 1;
          display: grid;
          place-items: center;
          color: #667085;
          font-size: 12px;
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
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 6px;
          border-radius: 5px;
          background: rgba(0, 0, 0, 0.76);
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
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
        }

        .project-uploader-preview__panel > button {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 1;
          width: 38px;
          height: 38px;
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
          .project-uploader__panel {
            height: 460px;
          }

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

function StatusBadge({ status }: { status?: ImageItemStatus }) {
  if (!status || status === "ready") return null;

  const content = {
    uploading: {
      icon: <Loader2 size={11} className="project-uploader-status__spinner" />,
      label: "กำลังอัปโหลด",
    },
    done: {
      icon: <Check size={11} />,
      label: "เสร็จแล้ว",
    },
    error: {
      icon: <AlertCircle size={11} />,
      label: "ผิดพลาด",
    },
  }[status];

  return (
    <span className={`project-uploader-status project-uploader-status--${status}`}>
      {content.icon}
      {content.label}
    </span>
  );
}
