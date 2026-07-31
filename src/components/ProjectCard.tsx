"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Heart, Images } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export type ProjectCardModel = {
  id: string;
  title: string;
  description: string;
  image_urls: string[];
  likes_count: number;
  tags?: string[];
};

const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='750' viewBox='0 0 1200 750'%3E%3Crect width='1200' height='750' fill='%2314161c'/%3E%3Cpath d='M440 475l110-120 85 90 70-75 115 125H380z' fill='%234a5568'/%3E%3Ccircle cx='760' cy='260' r='48' fill='%234a5568'/%3E%3Ctext x='600' y='620' fill='%23a0aec0' text-anchor='middle' font-family='Arial' font-size='34'%3ENo image%3C/text%3E%3C/svg%3E";

export default function ProjectCard({
  project,
  index,
  onSelect,
}: {
  project: ProjectCardModel;
  index: number;
  onSelect: (id: string) => void;
}) {
  const images = project.image_urls.filter(
    (url): url is string => typeof url === "string" && url.trim().length > 0
  );

  const cover = images[0] || FALLBACK_IMAGE;
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null);
  const imageSrc = failedImageSrc === cover ? FALLBACK_IMAGE : cover;

  return (
    <motion.article
      className="pgx-card"
      initial={{ opacity: 0, y: 22, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: index * 0.04 }}
      whileHover={{ y: -2 }}
    >
      <motion.button
        type="button"
        className="pgx-card__button"
        onClick={() => onSelect(project.id)}
        aria-label={`เปิดโปรเจกต์ ${project.title}`}
        whileTap={{ scale: 0.995 }}
      >
        <span className="pgx-card__media">
          <Image
            src={imageSrc}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            loading="lazy"
            decoding="async"
            unoptimized={imageSrc === FALLBACK_IMAGE}
            onError={() => setFailedImageSrc(cover)}
          />

          <span className="pgx-card__count">
            <Images size={14} aria-hidden="true" />
            {images.length}
          </span>
        </span>

        <span className="pgx-card__body">
          <span className="pgx-card__title-row">
            <strong>{project.title}</strong>
            <ArrowUpRight size={18} aria-hidden="true" />
          </span>

          <span className="pgx-card__description">
            {project.description}
          </span>

          {project.tags && project.tags.length > 0 && (
            <span className="pgx-card__tags">
              {project.tags.slice(0, 3).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </span>
          )}
        </span>

        <span className="pgx-card__footer">
          <span>
            <Heart size={14} aria-hidden="true" />
            {Math.max(0, project.likes_count || 0)}
          </span>

          <span>ดูรายละเอียด</span>
        </span>
      </motion.button>
    </motion.article>
  );
}
