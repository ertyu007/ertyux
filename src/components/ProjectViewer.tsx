"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  ExternalLink,
  Heart,
  Images,
  Maximize2,
  Share2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type SyntheticEvent,
} from "react";
import { createPortal } from "react-dom";

import { supabase } from "@/lib/supabase";

export type ProjectViewerProject = {
  id: string;
  title: string;
  description: string;
  image_urls: string[];
  likes_count: number;
  demo_link?: string;
  github_link?: string;
  tags?: string[];
};

type ProjectViewerProps = {
  project: ProjectViewerProject;
  onClose: () => void;
  onLike?: (id: string, newCount: number) => void;
};

const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='675' viewBox='0 0 1200 675'%3E%3Crect width='1200' height='675' fill='%23090a0e'/%3E%3Cpath d='M430 445l125-135 90 95 80-85 130 145H365z' fill='%234a5568'/%3E%3Ccircle cx='780' cy='225' r='50' fill='%234a5568'/%3E%3Ctext x='600' y='565' fill='%23a0aec0' text-anchor='middle' font-family='Arial' font-size='32'%3ENo image available%3C/text%3E%3C/svg%3E";

const subscribeToClient = () => () => {};

function drawCanvasGrid(
  context: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  context.fillStyle = "#05060a";
  context.fillRect(0, 0, width, height);

  const drawLines = (step: number, color: string, lineWidth: number) => {
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = lineWidth;

    for (let x = 0; x <= width; x += step) {
      context.moveTo(x + 0.5, 0);
      context.lineTo(x + 0.5, height);
    }

    for (let y = 0; y <= height; y += step) {
      context.moveTo(0, y + 0.5);
      context.lineTo(width, y + 0.5);
    }

    context.stroke();
  };

  drawLines(24, "rgba(255,255,255,0.035)", 1);
  drawLines(96, "rgba(94,234,212,0.08)", 1);

  const glow = context.createRadialGradient(
    width / 2,
    height * 0.42,
    0,
    width / 2,
    height * 0.42,
    Math.max(width, height) * 0.55
  );
  glow.addColorStop(0, "rgba(94,234,212,0.10)");
  glow.addColorStop(1, "rgba(94,234,212,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  const vignette = context.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.18,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.68
  );
  vignette.addColorStop(0, "rgba(5,6,10,0)");
  vignette.addColorStop(1, "rgba(5,6,10,0.68)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => !element.hasAttribute("hidden"));
}

export default function ProjectViewer({
  project,
  onClose,
  onLike,
}: ProjectViewerProps) {
  const panelRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number } | null>(
    null
  );
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mounted = useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [likesCount, setLikesCount] = useState(
    Math.max(0, project.likes_count || 0)
  );
  const [hasLiked, setHasLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [loadedImageSrc, setLoadedImageSrc] = useState<string>("");

  const images = useMemo(
    () =>
      project.image_urls
        .filter(
          (url): url is string =>
            typeof url === "string" && url.trim().length > 0
        )
        .slice(0, 5),
    [project.image_urls]
  );

  const currentImage = images[selectedIndex] || FALLBACK_IMAGE;
  const hasMultipleImages = images.length > 1;

  const resetCanvasView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const value: unknown = JSON.parse(
          localStorage.getItem("liked_projects") || "[]"
        );

        setHasLiked(
          Array.isArray(value) && value.some((item) => item === project.id)
        );
      } catch {
        setHasLiked(false);
      }
    });
  }, [project.id]);

  const goPrevious = useCallback(() => {
    if (!hasMultipleImages) return;
    resetCanvasView();
    setSelectedIndex((current) =>
      current === 0 ? images.length - 1 : current - 1
    );
  }, [hasMultipleImages, images.length, resetCanvasView]);

  const goNext = useCallback(() => {
    if (!hasMultipleImages) return;
    resetCanvasView();
    setSelectedIndex((current) => (current + 1) % images.length);
  }, [hasMultipleImages, images.length, resetCanvasView]);

  useEffect(() => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const frame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = getFocusableElements(panelRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      previousFocusRef.current?.focus();

      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current);
      }
    };
  }, [goNext, goPrevious, onClose]);

  const handleImageError = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      if (event.currentTarget.src !== FALLBACK_IMAGE) {
        event.currentTarget.src = FALLBACK_IMAGE;
      }
    },
    []
  );

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const updateSize = () => {
      const rect = stage.getBoundingClientRect();
      setCanvasSize({
        width: Math.max(1, Math.round(rect.width)),
        height: Math.max(1, Math.round(rect.height)),
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(stage);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const image = new Image();
    image.decoding = "async";
    image.loading = "eager";
    image.fetchPriority = "high";
    image.onload = () => {
      imageRef.current = image;
      setLoadedImageSrc(currentImage);
      setPan((current) => ({ ...current }));
    };
    image.onerror = () => {
      if (image.src !== FALLBACK_IMAGE) {
        image.src = FALLBACK_IMAGE;
      }
    };
    image.src = currentImage;

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [currentImage]);

  const currentImageReady = loadedImageSrc === currentImage;

  useEffect(() => {
    if (images.length <= 1) return;

    const preload = (src: string) => {
      const image = new Image();
      image.decoding = "async";
      image.loading = "lazy";
      image.fetchPriority = "low";
      image.src = src;
    };

    const prefetchNeighbors = () => {
      const neighbors = [
        images[(selectedIndex + 1) % images.length],
        images[(selectedIndex - 1 + images.length) % images.length],
      ].filter((src, index, list) => Boolean(src) && list.indexOf(src) === index);

      neighbors.forEach(preload);
    };

    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(prefetchNeighbors, { timeout: 1500 })
      : window.setTimeout(prefetchNeighbors, 500);

    return () => {
      if (typeof idle === "number") {
        window.clearTimeout(idle);
      } else {
        window.cancelIdleCallback?.(idle);
      }
    };
  }, [images, selectedIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || canvasSize.width <= 0 || canvasSize.height <= 0) {
      return;
    }

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvasSize.width * pixelRatio);
    canvas.height = Math.round(canvasSize.height * pixelRatio);
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, canvasSize.width, canvasSize.height);
    drawCanvasGrid(context, canvasSize.width, canvasSize.height);

    const containScale = Math.min(
      canvasSize.width / image.naturalWidth,
      canvasSize.height / image.naturalHeight
    );
    const drawWidth = image.naturalWidth * containScale * zoom;
    const drawHeight = image.naturalHeight * containScale * zoom;
    const drawX = (canvasSize.width - drawWidth) / 2 + pan.x;
    const drawY = (canvasSize.height - drawHeight) / 2 + pan.y;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  }, [canvasSize, pan, zoom]);

  const updateZoom = useCallback((nextZoom: number) => {
    setZoom(Math.min(5, Math.max(0.5, nextZoom)));
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const handleWheel = (event: globalThis.WheelEvent) => {
      event.preventDefault();
      const direction = event.deltaY > 0 ? -0.12 : 0.12;
      setZoom((current) => Math.min(5, Math.max(0.5, current + direction)));
    };

    stage.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      stage.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    const handleGesture = (event: Event) => {
      event.preventDefault();
    };

    document.addEventListener("gesturestart", handleGesture);
    document.addEventListener("gesturechange", handleGesture);
    document.addEventListener("gestureend", handleGesture);

    return () => {
      document.removeEventListener("gesturestart", handleGesture);
      document.removeEventListener("gesturechange", handleGesture);
      document.removeEventListener("gestureend", handleGesture);
    };
  }, []);

  const handleCanvasPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (zoom <= 1) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handleCanvasPointerMove = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    dragRef.current = { ...drag, x: event.clientX, y: event.clientY };
    setPan((current) => ({ x: current.x + deltaX, y: current.y + deltaY }));
  };

  const handleCanvasPointerEnd = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  const handleLike = async () => {
    if (hasLiked || liking) return;

    const previousCount = likesCount;
    const nextCount = previousCount + 1;

    setLiking(true);
    setHasLiked(true);
    setLikesCount(nextCount);
    setStatusMessage("");
    onLike?.(project.id, nextCount);

    let previousLikedProjects: unknown = [];

    try {
      previousLikedProjects = JSON.parse(
        localStorage.getItem("liked_projects") || "[]"
      );

      const likedProjects = Array.isArray(previousLikedProjects)
        ? previousLikedProjects
        : [];

      localStorage.setItem(
        "liked_projects",
        JSON.stringify([...new Set([...likedProjects, project.id])])
      );

      const { error } = await supabase
        .from("projects")
        .update({ likes_count: nextCount })
        .eq("id", project.id);

      if (error) throw error;
    } catch (error) {
      console.error("Could not update project like:", error);
      setHasLiked(false);
      setLikesCount(previousCount);
      setStatusMessage("บันทึก Like ไม่สำเร็จ กรุณาลองใหม่");
      onLike?.(project.id, previousCount);

      const previous = Array.isArray(previousLikedProjects)
        ? previousLikedProjects.filter((item) => item !== project.id)
        : [];
      localStorage.setItem("liked_projects", JSON.stringify(previous));
    } finally {
      setLiking(false);
    }
  };

  const showCopiedState = () => {
    setCopied(true);
    setStatusMessage("คัดลอกลิงก์แล้ว");

    if (copiedTimerRef.current) {
      clearTimeout(copiedTimerRef.current);
    }

    copiedTimerRef.current = setTimeout(() => {
      setCopied(false);
      setStatusMessage("");
    }, 1800);
  };

  const handleShare = async () => {
    const shareData = {
      title: project.title,
      text: project.description,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareData.url);
      showCopiedState();
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = shareData.url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      showCopiedState();
    }
  };

  const handlePanelKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" && event.target === event.currentTarget) {
      closeButtonRef.current?.focus();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="pgx-viewer" role="presentation">
      <button
        type="button"
        className="pgx-viewer__backdrop"
        aria-label="ปิดรายละเอียดโปรเจกต์"
        onClick={onClose}
      />

      <section
        ref={panelRef}
        className="pgx-viewer__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pgx-viewer-title"
        tabIndex={-1}
        onKeyDown={handlePanelKeyDown}
      >
        <header className="pgx-viewer__header">
          <div>
            <span>Project details</span>
            <h2 id="pgx-viewer-title">{project.title}</h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="pgx-viewer__close"
            onClick={onClose}
            aria-label="ปิด"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="pgx-viewer__body">
          <section className="pgx-viewer__gallery" aria-label="รูปภาพโปรเจกต์">
            <div
              ref={stageRef}
              className="pgx-viewer__stage"
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerEnd}
              onPointerCancel={handleCanvasPointerEnd}
              onDoubleClick={resetCanvasView}
            >
              <canvas
                ref={canvasRef}
                aria-label={`${project.title} รูปที่ ${selectedIndex + 1}`}
              />
              {!currentImageReady && (
                <div className="pgx-viewer__loading" aria-hidden="true">
                  กำลังโหลดรูป...
                </div>
              )}
              <div className="pgx-viewer__zoom-controls">
                <button
                  type="button"
                  onClick={() => updateZoom(zoom - 0.25)}
                  aria-label="ซูมออก"
                >
                  <ZoomOut size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={resetCanvasView}
                  aria-label="รีเซ็ตมุมมอง"
                >
                  <Maximize2 size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => updateZoom(zoom + 0.25)}
                  aria-label="ซูมเข้า"
                >
                  <ZoomIn size={15} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="pgx-viewer__controls">
              <button
                type="button"
                onClick={goPrevious}
                disabled={!hasMultipleImages}
                aria-label="รูปก่อนหน้า"
              >
                <ChevronLeft size={20} aria-hidden="true" />
              </button>

              <span>
                <Images size={14} aria-hidden="true" />
                {images.length > 0 ? selectedIndex + 1 : 0} / {images.length}
              </span>

              <button
                type="button"
                onClick={goNext}
                disabled={!hasMultipleImages}
                aria-label="รูปถัดไป"
              >
                <ChevronRight size={20} aria-hidden="true" />
              </button>
            </div>

            {hasMultipleImages && (
              <div className="pgx-viewer__thumbs" aria-label="เลือกรูปภาพ">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    className={index === selectedIndex ? "is-active" : ""}
                    onClick={() => {
                      resetCanvasView();
                      setSelectedIndex(index);
                    }}
                    aria-label={`แสดงรูปที่ ${index + 1}`}
                    aria-current={index === selectedIndex ? "true" : undefined}
                  >
                    <img
                      src={image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      aria-hidden="true"
                      draggable={false}
                      onError={handleImageError}
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside className="pgx-viewer__details">
            <div className="pgx-viewer__details-scroll">
              {project.tags && project.tags.length > 0 && (
                <div className="pgx-viewer__tags">
                  {project.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              )}

              <h3>รายละเอียด</h3>
              <p>{project.description}</p>

              <div className="pgx-viewer__actions">
                <button
                  type="button"
                  className={hasLiked ? "is-liked" : ""}
                  onClick={handleLike}
                  disabled={hasLiked || liking}
                >
                  <Heart
                    size={17}
                    fill={hasLiked ? "currentColor" : "none"}
                    aria-hidden="true"
                  />
                  {likesCount}
                </button>

                <button type="button" onClick={handleShare}>
                  {copied ? (
                    <Check size={17} aria-hidden="true" />
                  ) : (
                    <Share2 size={17} aria-hidden="true" />
                  )}
                  {copied ? "คัดลอกแล้ว" : "แชร์"}
                </button>
              </div>

              {statusMessage && (
                <p className="pgx-viewer__status" role="status">
                  {statusMessage}
                </p>
              )}
            </div>

            {(project.demo_link || project.github_link) && (
              <div className="pgx-viewer__links">
                {project.demo_link && (
                  <a
                    href={project.demo_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink size={17} aria-hidden="true" />
                    Live demo
                  </a>
                )}

                {project.github_link && (
                  <a
                    href={project.github_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Code2 size={17} aria-hidden="true" />
                    Source code
                  </a>
                )}
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>,
    document.body
  );
}
