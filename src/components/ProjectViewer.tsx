"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  ExternalLink,
  Heart,
  Images,
  Share2,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent as ReactKeyboardEvent,
  type SyntheticEvent,
  type TouchEvent,
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
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
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
    setSelectedIndex((current) =>
      current === 0 ? images.length - 1 : current - 1
    );
  }, [hasMultipleImages, images.length]);

  const goNext = useCallback(() => {
    if (!hasMultipleImages) return;
    setSelectedIndex((current) => (current + 1) % images.length);
  }, [hasMultipleImages, images.length]);

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

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;

    if (!start || !hasMultipleImages) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    if (Math.abs(deltaX) >= 55 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) goNext();
      else goPrevious();
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
              className="pgx-viewer__stage"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <img
                key={`${selectedIndex}-${currentImage}`}
                src={currentImage}
                alt={`${project.title} รูปที่ ${selectedIndex + 1}`}
                draggable={false}
                onError={handleImageError}
              />
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
                    onClick={() => setSelectedIndex(index)}
                    aria-label={`แสดงรูปที่ ${index + 1}`}
                    aria-current={index === selectedIndex ? "true" : undefined}
                  >
                    <img
                      src={image}
                      alt=""
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
