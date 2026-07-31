"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Edit3,
  ExternalLink,
  GitBranch,
  Heart,
  Images,
  Loader2,
  LogOut,
  Plus,
  ArrowUp,
  RotateCcw,
  Trash2,
  Square,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import {
  createProject,
  deleteProject,
  discardProjectUploads,
  logoutAdmin,
  prepareProjectUploads,
  purgeDeletedProject,
  restoreProject,
  updateProject,
  type ProjectImageState,
  type UploadedImageProof,
  type UploadTicket,
} from "./actions";
import type { Project } from "./page";
import ProjectImageUploader, {
  type ImageItem,
} from "./ProjectImageUploader";

type FormState = {
  title: string;
  description: string;
  demo_link: string;
  github_link: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  demo_link: "",
  github_link: "",
};

const subscribeToClient = () => () => {};
const PROJECT_PURGE_DAYS = 30;

function parseProjectImages(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .filter(
          (entry): entry is string =>
            typeof entry === "string" && entry.trim().length > 0
        )
        .slice(0, 5);
    }
  } catch {
    // Old records may contain one URL instead of JSON.
  }

  return [value];
}

function toExistingItems(project: Project): ImageItem[] {
  return parseProjectImages(project.image_url).map((url, index) => ({
    id: `existing-${project.id}-${index}`,
    type: "existing",
    url,
    status: "ready",
  }));
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="admin-field">
      <span>
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}

export default function AdminClient({
  initialProjects,
}: {
  initialProjects: Project[];
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const uploadPromisesRef = useRef(new Map<string, Promise<UploadedImageProof>>());
  const uploadQueueRef = useRef<Promise<void>>(Promise.resolve());
  const cancelledUploadIdsRef = useRef(new Set<string>());

  const mounted = useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false
  );
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pageMessage, setPageMessage] = useState("");
  const [purgeNow, setPurgeNow] = useState(0);

  useEffect(() => {
    if (!editorOpen) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      dialogRef.current
        ?.querySelector<HTMLInputElement>("input[name='title']")
        ?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) {
        setEditorOpen(false);
        setSaveError("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [editorOpen, saving]);

  useEffect(() => {
    const updateClock = () => setPurgeNow(Date.now());
    const timer = window.setTimeout(updateClock, 0);
    const interval = window.setInterval(updateClock, 60 * 1000);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, []);

  const editingProject = useMemo(
    () => projects.find((project) => project.id === editingId) ?? null,
    [editingId, projects]
  );

  const activeProjects = useMemo(
    () => projects.filter((project) => !project.deleted_at),
    [projects]
  );

  const deletedProjects = useMemo(
    () => projects.filter((project) => Boolean(project.deleted_at)),
    [projects]
  );

  const pendingUploads = useMemo(
    () =>
      images.filter(
        (item): item is ImageItem & { type: "new"; file: File } =>
          item.type === "new" &&
          item.file instanceof File &&
          (!item.upload || item.status !== "done")
      ),
    [images]
  );

  const failedUploads = useMemo(
    () =>
      images.filter(
        (item): item is ImageItem & { type: "new"; file: File } =>
          item.type === "new" &&
          item.file instanceof File &&
          item.status === "error"
      ),
    [images]
  );

  const totalImages = useMemo(
    () =>
      activeProjects.reduce(
        (total, project) =>
          total + parseProjectImages(project.image_url).length,
        0
      ),
    [activeProjects]
  );

  const totalLikes = useMemo(
    () =>
      activeProjects.reduce(
        (total, project) => total + Number(project.likes_count || 0),
        0
      ),
    [activeProjects]
  );

  const openCreateEditor = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImages([]);
    setSaveError("");
    setPageMessage("");
    setEditorOpen(true);
  };

  const openEditEditor = (project: Project) => {
    setEditingId(project.id);
    setForm({
      title: project.title,
      description: project.description,
      demo_link: project.demo_link || "",
      github_link: project.github_link || "",
    });
    setImages(toExistingItems(project));
    setSaveError("");
    setPageMessage("");
    setEditorOpen(true);
  };

  const discardDraftImages = (draftImages: ImageItem[]) => {
    const uploads = draftImages
      .filter(
        (item): item is ImageItem & { upload: UploadedImageProof } =>
          item.type === "new" && Boolean(item.upload)
      )
      .map((item) => item.upload);

    if (uploads.length > 0) {
      void discardProjectUploads(uploads).catch(() => undefined);
    }
  };

  const closeEditor = () => {
    if (saving) return;
    for (const item of images) {
      if (item.type === "new" && item.status !== "done") {
        cancelledUploadIdsRef.current.add(item.id);
      }
    }
    discardDraftImages(images);
    setEditorOpen(false);
    setSaveError("");
  };

  const cancelPendingUploads = () => {
    if (saving || pendingUploads.length === 0) return;
    for (const item of pendingUploads) {
      cancelledUploadIdsRef.current.add(item.id);
    }
    discardDraftImages(images);
    setImages((current) => current.filter((item) => item.type === "existing"));
    setSaveError("");
  };

  const handleImagesChange = (nextImages: ImageItem[]) => {
    const nextNewItems = nextImages.filter(
      (item): item is ImageItem & { type: "new"; file: File } =>
        item.type === "new" &&
        item.file instanceof File &&
        !item.upload &&
        item.status === "ready" &&
        !images.some((current) => current.id === item.id)
    );

    startBackgroundUploads(nextNewItems);

    const nextIds = new Set(nextImages.map((item) => item.id));
    discardDraftImages(images.filter((item) => !nextIds.has(item.id)));
    setImages(nextImages);
  };

  const updateImageStatus = (
    id: string,
    status: ImageItem["status"]
  ): void => {
    setImages((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const uploadImageBatch = useCallback(async (
    newItems: Array<ImageItem & { type: "new"; file: File }>
  ): Promise<UploadedImageProof[]> => {
    const prepared = await prepareProjectUploads(
      newItems.map((item) => ({
        clientId: item.id,
        name: item.file.name,
        size: item.file.size,
        contentType: item.file.type,
      }))
    );

    if (!prepared.success || !prepared.uploads) {
      throw new Error(prepared.error || "Unable to prepare image uploads.");
    }

    const ticketsById = new Map<string, UploadTicket>(
      prepared.uploads.map((ticket) => [ticket.clientId, ticket])
    );

    const results = await Promise.all(
      newItems.map(async (item) => {
        try {
          const ticket = ticketsById.get(item.id);
          if (!ticket) {
            throw new Error(`Missing upload ticket for ${item.file.name}.`);
          }

          updateImageStatus(item.id, "uploading");

          const { error } = await supabase.storage
          .from("portfolio")
          .uploadToSignedUrl(ticket.path, ticket.token, item.file, {
            cacheControl: "31536000",
            contentType: item.file.type,
          });

          if (error) {
            throw new Error(`${item.file.name}: ${error.message}`);
          }

          const proof: UploadedImageProof = {
          clientId: ticket.clientId,
          path: ticket.path,
          size: ticket.size,
          contentType: ticket.contentType,
            signature: ticket.signature,
          };

          if (cancelledUploadIdsRef.current.delete(item.id)) {
            void discardProjectUploads([proof]).catch(() => undefined);
            return proof;
          }

          setImages((current) =>
            current.map((currentItem) =>
              currentItem.id === item.id
                ? { ...currentItem, status: "done", upload: proof }
                : currentItem
            )
          );
          return proof;
        } catch (error) {
          updateImageStatus(item.id, "error");
          throw error instanceof Error
            ? error
            : new Error(`${item.file.name}: อัปโหลดไม่สำเร็จ`);
        }
      })
    );

    return results;
  }, []);

  const startBackgroundUploads = useCallback(
    (itemsToUpload: Array<ImageItem & { type: "new"; file: File }>): void => {
      if (itemsToUpload.length === 0) return;

      const batches = itemsToUpload.filter(
        (item) => !uploadPromisesRef.current.has(item.id)
      );
      if (batches.length === 0) return;

      const batchPromise = uploadQueueRef.current
        .then(() => uploadImageBatch(batches))
        .catch((error) => {
        setImages((current) =>
          current.map((currentItem) =>
            batches.some((item) => item.id === currentItem.id) &&
            currentItem.status !== "done"
              ? { ...currentItem, status: "error" }
              : currentItem
          )
        );
        throw error;
      });

      uploadQueueRef.current = batchPromise.then(
        () => undefined,
        () => undefined
      );

      for (const item of batches) {
        const itemPromise = batchPromise.then((uploads) => {
          const upload = uploads.find(
            (candidate) => candidate.clientId === item.id
          );
          if (!upload) {
            throw new Error(`Missing upload result for ${item.file.name}.`);
          }
          return upload;
        });

        uploadPromisesRef.current.set(item.id, itemPromise);
        itemPromise.finally(() => {
          uploadPromisesRef.current.delete(item.id);
        });
        void itemPromise.catch(() => undefined);
      }
    },
    [uploadImageBatch]
  );

  useEffect(() => {
    if (!editorOpen || saving) return;

    const readyItems = images.filter(
      (item): item is ImageItem & { type: "new"; file: File } =>
        item.type === "new" &&
        item.file instanceof File &&
        !item.upload &&
        item.status === "ready"
    );

    startBackgroundUploads(readyItems);
  }, [editorOpen, images, saving, startBackgroundUploads]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    if (!form.title.trim() || !form.description.trim()) {
      setSaveError("กรุณากรอกชื่อโปรเจกต์และรายละเอียดให้ครบ");
      return;
    }

    if (images.length === 0) {
      setSaveError("กรุณาเพิ่มรูปอย่างน้อย 1 รูป");
      return;
    }

    if (pendingUploads.length > 0) {
      setSaveError("รออัปโหลดรูปให้เสร็จก่อนกดบันทึก");
      return;
    }

    if (failedUploads.length > 0) {
      setSaveError("มีรูปที่อัปโหลดไม่สำเร็จ กรุณาลบหรือเพิ่มใหม่");
      return;
    }

    setSaveError("");
    setSaving(true);

    try {
      const uploadedProofs = images
        .filter(
          (item): item is ImageItem & { type: "new"; file: File; upload: UploadedImageProof } =>
            item.type === "new" && item.file instanceof File && Boolean(item.upload)
        )
        .map((item) => item.upload);
      const uploadsByClientId = new Map(
        uploadedProofs.map((upload) => [upload.clientId, upload])
      );

      const payload = new FormData();
      payload.append("title", form.title.trim());
      payload.append("description", form.description.trim());
      payload.append("demo_link", form.demo_link.trim());
      payload.append("github_link", form.github_link.trim());

      let result: Awaited<ReturnType<typeof createProject>>;

      if (editingId) {
        const imageState: ProjectImageState[] = images.map((item) => {
          if (item.type === "existing" && item.url) {
            return { kind: "existing", url: item.url };
          }

          const upload = uploadsByClientId.get(item.id);
          if (!upload) {
            throw new Error("บางรูปยังอัปโหลดไม่เสร็จ");
          }

          return { kind: "uploaded", upload };
        });

        payload.append("image_state", JSON.stringify(imageState));
        result = await updateProject(editingId, payload);
      } else {
        payload.append("uploaded_images", JSON.stringify(uploadedProofs));
        result = await createProject(payload);
      }

      if (!result.success) {
        throw new Error(result.error || "Unable to save this project.");
      }

      setEditorOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      setImages([]);
      setPageMessage(
        result.warning ||
          (editingId ? "บันทึกการแก้ไขแล้ว" : "เพิ่มโปรเจกต์แล้ว")
      );
      router.refresh();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดระหว่างบันทึกข้อมูล"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (project: Project) => {
    if (
      !window.confirm(
        `ย้ายโปรเจกต์ “${project.title}” ไปถังลบใช่หรือไม่? สามารถกู้คืนได้ภายใน ${PROJECT_PURGE_DAYS} วัน`
      )
    ) {
      return;
    }

    setDeletingId(project.id);
    setPageMessage("");

    try {
      const result = await deleteProject(project.id);
      if (!result.success) {
        throw new Error(result.error || "Unable to delete this project.");
      }

      setProjects((current) =>
        current.map((item) =>
          item.id === project.id
            ? { ...item, deleted_at: new Date().toISOString() }
            : item
        )
      );
      setPageMessage(result.warning || "ย้ายโปรเจกต์ไปถังลบแล้ว");
      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดระหว่างลบ"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestore = async (project: Project) => {
    setDeletingId(project.id);
    setPageMessage("");

    try {
      const result = await restoreProject(project.id);
      if (!result.success) {
        throw new Error(result.error || "Unable to restore this project.");
      }

      setProjects((current) =>
        current.map((item) =>
          item.id === project.id ? { ...item, deleted_at: null } : item
        )
      );
      setPageMessage("กู้คืนโปรเจกต์แล้ว");
      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดระหว่างกู้คืน"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const canPurgeProject = (project: Project): boolean => {
    if (!project.deleted_at) return false;

    const deletedAt = new Date(project.deleted_at).getTime();
    if (!Number.isFinite(deletedAt)) return false;

    return purgeNow >= deletedAt + PROJECT_PURGE_DAYS * 24 * 60 * 60 * 1000;
  };

  const handlePurge = async (project: Project) => {
    if (!canPurgeProject(project)) {
      window.alert(`ลบถาวรได้หลังจากอยู่ในถังลบครบ ${PROJECT_PURGE_DAYS} วัน`);
      return;
    }

    if (
      !window.confirm(
        `ลบโปรเจกต์ “${project.title}” ถาวรใช่หรือไม่? การลบนี้กู้คืนไม่ได้`
      )
    ) {
      return;
    }

    setDeletingId(project.id);
    setPageMessage("");

    try {
      const result = await purgeDeletedProject(project.id);
      if (!result.success) {
        throw new Error(result.error || "Unable to permanently delete this project.");
      }

      setProjects((current) =>
        current.filter((item) => item.id !== project.id)
      );
      setPageMessage(result.warning || "ลบโปรเจกต์ถาวรแล้ว");
      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดระหว่างลบถาวร"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = async () => {
    const result = await logoutAdmin();
    if (!result.success) {
      window.alert(result.error || "Logout failed.");
      return;
    }

    router.replace("/admin");
    router.refresh();
  };

  const editor =
    mounted && editorOpen
      ? createPortal(
          <div className="admin-modal-layer">
            <button
              type="button"
              className="admin-modal-backdrop"
              aria-label="ปิดหน้าต่างแก้ไข"
              onClick={closeEditor}
              disabled={saving}
            />

            <div
              ref={dialogRef}
              className="admin-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-editor-title"
            >
              <header className="admin-modal__header">
                <div>
                  <span>{editingProject ? "แก้ไขโปรเจกต์" : "เพิ่มโปรเจกต์"}</span>
                  <h2 id="admin-editor-title">
                    {editingProject?.title || "โปรเจกต์ใหม่"}
                  </h2>
                </div>

                <button
                  type="button"
                  className="admin-icon-button"
                  onClick={closeEditor}
                  disabled={saving}
                  aria-label="ปิด"
                >
                  <X size={20} />
                </button>
              </header>

              <form className="admin-modal__form" onSubmit={handleSubmit}>
                <div className="admin-modal__body">
                  <section className="admin-modal__upload">
                    <ProjectImageUploader
                      items={images}
                      onChange={handleImagesChange}
                      disabled={saving}
                      busy={false}
                      maxFiles={5}
                    />
                  </section>

                  <section className="admin-modal__fields">
                    <Field label="ชื่อโปรเจกต์" required>
                      <input
                        name="title"
                        value={form.title}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            title: event.target.value,
                          }))
                        }
                        maxLength={120}
                        required
                        disabled={saving}
                        placeholder="ตัวอย่าง: Portfolio Website"
                      />
                    </Field>

                    <Field label="รายละเอียด (รองรับ Markdown)" required>
                      <textarea
                        value={form.description}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        maxLength={1200}
                        rows={7}
                        required
                        disabled={saving}
                        placeholder={"## รายละเอียด\n\n1. ขั้นตอนแรก\n2. ขั้นตอนถัดไป\n\n- **จุดเด่น** — คำอธิบาย"}
                      />
                    </Field>

                    <Field label="ลิงก์เว็บไซต์">
                      <input
                        type="url"
                        value={form.demo_link}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            demo_link: event.target.value,
                          }))
                        }
                        disabled={saving}
                        placeholder="https://example.com"
                      />
                    </Field>

                    <Field label="ลิงก์ GitHub">
                      <input
                        type="url"
                        value={form.github_link}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            github_link: event.target.value,
                          }))
                        }
                        disabled={saving}
                        placeholder="https://github.com/user/repository"
                      />
                    </Field>
                  </section>
                </div>

                {saveError ? (
                  <div className="admin-modal__error" role="alert">
                    {saveError}
                  </div>
                ) : null}

                <footer className="admin-modal__footer">
                  <span>{images.length}/5 รูป • รูปแรกเป็นภาพปก</span>

                  <div>
                    <button
                      type="button"
                      className="admin-button admin-button--secondary"
                      onClick={closeEditor}
                      disabled={saving}
                    >
                      ยกเลิก
                    </button>
                    <button
                      type={pendingUploads.length > 0 ? "button" : "submit"}
                      className="admin-button admin-button--primary"
                      disabled={saving || failedUploads.length > 0}
                      onClick={pendingUploads.length > 0 ? cancelPendingUploads : undefined}
                      title={
                        pendingUploads.length > 0
                          ? "ยกเลิกการอัปโหลด"
                          : failedUploads.length > 0
                          ? "แก้รูปที่ผิดพลาดก่อน"
                          : editingId
                          ? "บันทึกการแก้ไข"
                          : "เพิ่มโปรเจกต์"
                      }
                      aria-label={
                        pendingUploads.length > 0
                          ? "ยกเลิกการอัปโหลด"
                          : failedUploads.length > 0
                          ? "แก้รูปที่ผิดพลาดก่อน"
                          : editingId
                          ? "บันทึกการแก้ไข"
                          : "เพิ่มโปรเจกต์"
                      }
                    >
                      {saving ? (
                        <Loader2 className="admin-spin" size={17} />
                      ) : pendingUploads.length > 0 ? (
                        <Square size={17} />
                      ) : failedUploads.length > 0 ? (
                        <Loader2 className="admin-spin" size={17} />
                      ) : (
                        <ArrowUp size={17} />
                      )}
                    </button>
                  </div>
                </footer>
              </form>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <main className="admin-page">
      <div className="admin-page__container">
        <header className="admin-page__header">
          <div>
            <p className="admin-page__eyebrow">Portfolio Admin</p>
            <h1>จัดการโปรเจกต์</h1>
            <p className="admin-page__subtitle">
              เพิ่ม แก้ไข ลบ และจัดการรูปภาพของเว็บไซต์
            </p>
          </div>

          <div className="admin-page__header-actions">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="admin-button admin-button--secondary"
            >
              <ExternalLink size={16} /> ดูเว็บไซต์
            </a>
            <button
              type="button"
              className="admin-button admin-button--secondary"
              onClick={handleLogout}
            >
              <LogOut size={16} /> ออกจากระบบ
            </button>
            <button
              type="button"
              className="admin-button admin-button--primary"
              onClick={openCreateEditor}
            >
              <Plus size={17} /> เพิ่มโปรเจกต์
            </button>
          </div>
        </header>

        {pageMessage ? (
          <div className="admin-page__message" role="status">
            {pageMessage}
            <button
              type="button"
              aria-label="ปิดข้อความ"
              onClick={() => setPageMessage("")}
            >
              <X size={15} />
            </button>
          </div>
        ) : null}

        <section className="admin-stats" aria-label="สรุปข้อมูล">
          <article>
            <span>โปรเจกต์</span>
            <strong>{activeProjects.length}</strong>
          </article>
          <article>
            <span>รูปทั้งหมด</span>
            <strong>{totalImages}</strong>
          </article>
          <article>
            <span>ยอดถูกใจ</span>
            <strong>{totalLikes}</strong>
          </article>
        </section>

        {activeProjects.length === 0 ? (
          <section className="admin-empty">
            <Images size={36} />
            <h2>ยังไม่มีโปรเจกต์</h2>
            <p>กดปุ่มเพิ่มโปรเจกต์เพื่อเริ่มต้น</p>
            <button
              type="button"
              className="admin-button admin-button--primary"
              onClick={openCreateEditor}
            >
              <Plus size={17} /> เพิ่มโปรเจกต์แรก
            </button>
          </section>
        ) : (
          <section className="admin-project-grid" aria-label="รายการโปรเจกต์">
            {activeProjects.map((project) => {
              const projectImages = parseProjectImages(project.image_url);
              const cover = projectImages[0];
              const deleting = deletingId === project.id;

              return (
                <article className="admin-project-card" key={project.id}>
                  <div className="admin-project-card__image">
                    {cover ? (
                      <img src={cover} alt={`ภาพปก ${project.title}`} />
                    ) : (
                      <div className="admin-project-card__placeholder">
                        <Images size={28} />
                      </div>
                    )}
                    <span>
                      <Images size={13} /> {projectImages.length}
                    </span>
                  </div>

                  <div className="admin-project-card__body">
                    <div className="admin-project-card__title-row">
                      <h2>{project.title}</h2>
                      <div>
                        {project.demo_link ? (
                          <a
                            href={project.demo_link}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="เปิดเว็บไซต์"
                          >
                            <ExternalLink size={15} />
                          </a>
                        ) : null}
                        {project.github_link ? (
                          <a
                            href={project.github_link}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="เปิด GitHub"
                          >
                            <GitBranch size={15} />
                          </a>
                        ) : null}
                      </div>
                    </div>

                    <p>{project.description}</p>

                    <div className="admin-project-card__meta">
                      <span>
                        <Heart size={14} /> {project.likes_count || 0}
                      </span>
                      <span>
                        <Images size={14} /> {projectImages.length} รูป
                      </span>
                    </div>

                    <div className="admin-project-card__actions">
                      <button
                        type="button"
                        onClick={() => openEditEditor(project)}
                        disabled={deleting}
                      >
                        <Edit3 size={15} /> แก้ไข
                      </button>
                      <button
                        type="button"
                        className="admin-project-card__delete"
                        onClick={() => handleDelete(project)}
                        disabled={deleting}
                      >
                        {deleting ? (
                          <Loader2 className="admin-spin" size={15} />
                        ) : (
                          <Trash2 size={15} />
                        )}
                        {deleting ? "กำลังลบ" : "ลบ"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {deletedProjects.length > 0 ? (
          <section className="admin-trash" aria-label="ถังลบโปรเจกต์">
            <div className="admin-trash__header">
              <div>
                <span>Recycle Bin</span>
                <h2>โปรเจกต์ที่ลบแล้ว</h2>
              </div>
              <p>กู้คืนได้ทันที ลบถาวรได้หลังอยู่ในถังลบครบ {PROJECT_PURGE_DAYS} วัน</p>
            </div>

            <div className="admin-project-grid">
              {deletedProjects.map((project) => {
                const projectImages = parseProjectImages(project.image_url);
                const cover = projectImages[0];
                const deleting = deletingId === project.id;
                const purgeReady = canPurgeProject(project);

                return (
                  <article
                    className="admin-project-card admin-project-card--deleted"
                    key={project.id}
                  >
                    <div className="admin-project-card__image">
                      {cover ? (
                        <img src={cover} alt={`ภาพปก ${project.title}`} />
                      ) : (
                        <div className="admin-project-card__placeholder">
                          <Images size={28} />
                        </div>
                      )}
                      <span>
                        <Trash2 size={13} /> ถูกลบ
                      </span>
                    </div>

                    <div className="admin-project-card__body">
                      <div className="admin-project-card__title-row">
                        <h2>{project.title}</h2>
                      </div>

                      <p>{project.description}</p>

                      <div className="admin-project-card__meta">
                        <span>
                          <Images size={14} /> {projectImages.length} รูป
                        </span>
                        <span>
                          {project.deleted_at
                            ? new Date(project.deleted_at).toLocaleDateString("th-TH")
                            : "ไม่ทราบวันลบ"}
                        </span>
                      </div>

                      <div className="admin-project-card__actions">
                        <button
                          type="button"
                          onClick={() => handleRestore(project)}
                          disabled={deleting}
                        >
                          {deleting ? (
                            <Loader2 className="admin-spin" size={15} />
                          ) : (
                            <RotateCcw size={15} />
                          )}
                          กู้คืน
                        </button>
                        <button
                          type="button"
                          className="admin-project-card__delete"
                          onClick={() => handlePurge(project)}
                          disabled={deleting || !purgeReady}
                          title={
                            purgeReady
                              ? "ลบถาวร"
                              : `ลบถาวรได้หลังครบ ${PROJECT_PURGE_DAYS} วัน`
                          }
                        >
                          {deleting ? (
                            <Loader2 className="admin-spin" size={15} />
                          ) : (
                            <Trash2 size={15} />
                          )}
                          ลบถาวร
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>

      {editor}

      <style jsx global>{`
        .admin-page,
        .admin-modal-layer {
          --admin-bg: #f5f6f8;
          --admin-surface: #ffffff;
          --admin-surface-alt: #f8fafc;
          --admin-border: #d9dee7;
          --admin-text: #172033;
          --admin-muted: #667085;
          --admin-primary: #087ea4;
          --admin-primary-hover: #066b8c;
          --admin-danger: #c4324f;
          --admin-success: #147d4f;
          color: var(--admin-text);
          font-family: Arial, Helvetica, sans-serif;
        }

        .admin-page * {
          box-sizing: border-box;
        }

        .admin-page {
          min-height: 100svh;
          padding: 32px 20px 56px;
          background: var(--admin-bg);
        }

        .admin-page__container {
          width: min(1180px, 100%);
          margin: 0 auto;
        }

        .admin-page__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 20px;
        }

        .admin-page__eyebrow {
          margin: 0 0 6px;
          color: var(--admin-primary);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .admin-page__header h1 {
          margin: 0;
          color: var(--admin-text);
          font-size: clamp(28px, 3vw, 36px);
          line-height: 1.15;
        }

        .admin-page__subtitle {
          margin: 8px 0 0;
          color: var(--admin-muted);
          font-size: 15px;
        }

        .admin-page__header-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 10px;
        }

        .admin-button {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 16px;
          border-radius: 8px;
          font: inherit;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
        }

        .admin-button--primary {
          border: 1px solid var(--admin-primary);
          background: var(--admin-primary);
          color: #ffffff;
        }

        .admin-button--primary:hover:not(:disabled) {
          border-color: var(--admin-primary-hover);
          background: var(--admin-primary-hover);
        }

        .admin-button--secondary {
          border: 1px solid var(--admin-border);
          background: var(--admin-surface);
          color: var(--admin-text);
        }

        .admin-button--secondary:hover:not(:disabled) {
          border-color: #aeb7c5;
          background: var(--admin-surface-alt);
        }

        .admin-button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .admin-page__message {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
          padding: 12px 14px;
          border: 1px solid #b7ddca;
          border-radius: 8px;
          background: #effaf4;
          color: var(--admin-success);
          font-size: 14px;
        }

        .admin-page__message button {
          display: grid;
          place-items: center;
          border: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
        }

        .admin-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }

        .admin-stats article {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          min-height: 80px;
          padding: 16px 18px;
          border: 1px solid var(--admin-border);
          border-radius: 10px;
          background: var(--admin-surface);
        }

        .admin-stats span {
          color: var(--admin-muted);
          font-size: 14px;
        }

        .admin-stats strong {
          color: var(--admin-text);
          font-size: 24px;
        }

        .admin-project-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 18px;
        }

        .admin-project-card {
          overflow: hidden;
          border: 1px solid var(--admin-border);
          border-radius: 10px;
          background: var(--admin-surface);
        }

        .admin-project-card__image {
          position: relative;
          aspect-ratio: 16 / 10;
          overflow: hidden;
          background: #e9edf2;
        }

        .admin-project-card__image img,
        .admin-project-card__placeholder {
          width: 100%;
          height: 100%;
        }

        .admin-project-card__image img {
          display: block;
          object-fit: cover;
        }

        .admin-project-card__placeholder {
          display: grid;
          place-items: center;
          color: var(--admin-muted);
        }

        .admin-project-card__image > span {
          position: absolute;
          right: 10px;
          bottom: 10px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 8px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.68);
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
        }

        .admin-project-card__body {
          padding: 16px;
        }

        .admin-project-card__title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .admin-project-card__title-row h2 {
          margin: 0;
          color: var(--admin-text);
          font-size: 18px;
          line-height: 1.35;
        }

        .admin-project-card__title-row > div {
          display: flex;
          gap: 6px;
          flex: 0 0 auto;
        }

        .admin-project-card__title-row a {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border: 1px solid var(--admin-border);
          border-radius: 7px;
          color: var(--admin-muted);
        }

        .admin-project-card__body > p {
          display: -webkit-box;
          margin: 10px 0 14px;
          overflow: hidden;
          color: var(--admin-muted);
          font-size: 14px;
          line-height: 1.5;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
          line-clamp: 3;
        }

        .admin-project-card__meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 14px;
          color: var(--admin-muted);
          font-size: 13px;
        }

        .admin-project-card__meta span {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .admin-project-card__actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          padding-top: 14px;
          border-top: 1px solid var(--admin-border);
        }

        .admin-project-card__actions button {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid var(--admin-border);
          border-radius: 7px;
          background: var(--admin-surface-alt);
          color: var(--admin-text);
          font: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .admin-project-card__actions button:hover:not(:disabled) {
          border-color: var(--admin-primary);
          color: var(--admin-primary);
        }

        .admin-project-card__actions .admin-project-card__delete {
          color: var(--admin-danger);
        }

        .admin-project-card__actions .admin-project-card__delete:hover:not(:disabled) {
          border-color: var(--admin-danger);
          color: var(--admin-danger);
        }

        .admin-project-card__actions button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .admin-trash {
          margin-top: 30px;
          padding-top: 24px;
          border-top: 1px solid var(--admin-border);
        }

        .admin-trash__header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 16px;
        }

        .admin-trash__header span {
          color: var(--admin-muted);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .admin-trash__header h2,
        .admin-trash__header p {
          margin: 0;
        }

        .admin-trash__header h2 {
          font-size: 22px;
        }

        .admin-trash__header p {
          max-width: 440px;
          color: var(--admin-muted);
          font-size: 13px;
          line-height: 1.5;
          text-align: right;
        }

        .admin-project-card--deleted {
          background: #fbfcfd;
          opacity: 0.9;
        }

        .admin-project-card--deleted .admin-project-card__image img {
          filter: grayscale(0.75);
        }

        .admin-empty {
          min-height: 380px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 32px;
          border: 1px dashed var(--admin-border);
          border-radius: 10px;
          background: var(--admin-surface);
          text-align: center;
        }

        .admin-empty h2,
        .admin-empty p {
          margin: 0;
        }

        .admin-empty p {
          margin-bottom: 8px;
          color: var(--admin-muted);
        }

        .admin-modal-layer,
        .admin-modal-layer * {
          box-sizing: border-box;
        }

        .admin-modal-layer {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: grid;
          place-items: center;
          padding: 20px;
        }

        .admin-modal-backdrop {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
          background: rgba(15, 23, 42, 0.68);
          cursor: default;
        }

        .admin-modal {
          position: relative;
          z-index: 1;
          width: min(1080px, 100%);
          max-height: calc(100dvh - 40px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid var(--admin-border);
          border-radius: 12px;
          background: var(--admin-surface);
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);
        }

        .admin-modal__header {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 18px;
          border-bottom: 1px solid var(--admin-border);
          background: var(--admin-surface);
        }

        .admin-modal__header span {
          color: var(--admin-muted);
          font-size: 12px;
        }

        .admin-modal__header h2 {
          margin: 3px 0 0;
          color: var(--admin-text);
          font-size: 20px;
        }

        .admin-icon-button {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border: 1px solid var(--admin-border);
          border-radius: 8px;
          background: var(--admin-surface-alt);
          color: var(--admin-text);
          cursor: pointer;
        }

        .admin-modal__form {
          min-height: 0;
          display: flex;
          flex: 1;
          flex-direction: column;
        }

        .admin-modal__body {
          min-height: 0;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-items: stretch;
          gap: 16px;
          padding: 16px;
          overflow-y: auto;
          background: var(--admin-surface-alt);
        }

        .admin-modal__upload,
        .admin-modal__fields {
          min-width: 0;
        }

        .admin-modal__upload {
          min-height: 0;
          align-self: stretch;
        }

        .admin-modal__fields {
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 14px;
          border: 1px solid var(--admin-border);
          border-radius: 10px;
          background: var(--admin-surface);
        }

        .admin-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .admin-field > span {
          color: var(--admin-text);
          font-size: 13px;
          font-weight: 700;
        }

        .admin-field input,
        .admin-field textarea {
          width: 100%;
          border: 1px solid var(--admin-border);
          border-radius: 8px;
          background: #ffffff;
          color: var(--admin-text);
          padding: 11px 12px;
          font: inherit;
          font-size: 14px;
          line-height: 1.5;
          outline: none;
          resize: vertical;
        }

        .admin-field input:focus,
        .admin-field textarea:focus {
          border-color: var(--admin-primary);
          box-shadow: 0 0 0 3px rgba(8, 126, 164, 0.12);
        }

        .admin-modal__error {
          flex: 0 0 auto;
          margin: 0 18px 12px;
          padding: 10px 12px;
          border: 1px solid #efb3bf;
          border-radius: 8px;
          background: #fff3f5;
          color: var(--admin-danger);
          font-size: 13px;
          line-height: 1.5;
        }

        .admin-modal__footer {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 12px 16px;
          border-top: 1px solid var(--admin-border);
          background: var(--admin-surface);
        }

        .admin-modal__footer > span {
          color: var(--admin-muted);
          font-size: 13px;
        }

        .admin-modal__footer > div {
          display: flex;
          gap: 8px;
        }

        .admin-spin {
          animation: admin-spin 0.8s linear infinite;
        }

        @keyframes admin-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 820px) {
          .admin-page__header {
            flex-direction: column;
          }

          .admin-page__header-actions {
            width: 100%;
            justify-content: flex-start;
          }

          .admin-modal__body {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 620px) {
          .admin-page {
            padding: 24px 12px 48px;
          }

          .admin-stats {
            grid-template-columns: 1fr;
          }

          .admin-page__header-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .admin-page__header-actions .admin-button--primary {
            grid-column: 1 / -1;
          }

          .admin-modal-layer {
            padding: 0;
            align-items: stretch;
          }

          .admin-modal {
            width: 100%;
            max-height: 100dvh;
            border: 0;
            border-radius: 0;
          }

          .admin-modal__footer {
            align-items: stretch;
            flex-direction: column;
          }

          .admin-modal__footer > div {
            width: 100%;
          }

          .admin-modal__footer .admin-button {
            flex: 1;
          }
        }
      `}</style>
    </main>
  );
}
