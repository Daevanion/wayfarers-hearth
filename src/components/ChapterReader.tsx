import { useEffect } from "react";
import { createPortal } from "react-dom";
import { CHAPTER_BY_ID } from "../data/chapters";
import { CARD_BY_ID } from "../data/cards";
import { STORY_PORTRAITS } from "../data/storyPortraits";

export function ChapterReader({ chapterId, onClose }: { chapterId: string; onClose: () => void }) {
  const chapter = CHAPTER_BY_ID[chapterId];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      onClose();
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  if (!chapter) return null;

  return createPortal(
    <div
      className="chapter-reader"
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
      role="presentation"
    >
      <article
        className="chapter-reader-panel"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chapter-reader-title"
      >
        <button type="button" className="icon-btn chapter-reader-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <aside className="chapter-cast">
          <ul>
            {chapter.cardIds.map((id) => {
              const template = CARD_BY_ID[id];
              const src = STORY_PORTRAITS[id] ?? template?.portrait;
              if (!template || !src) return null;
              return (
                <li key={id}>
                  <img src={src} alt={template.name} />
                  <span>{template.name}</span>
                </li>
              );
            })}
          </ul>
        </aside>
        <div className="chapter-prose">
          <p className="kicker">Unsealed chapter</p>
          <h2 id="chapter-reader-title">{chapter.title}</h2>
          {chapter.body.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </div>
      </article>
    </div>,
    document.body,
  );
}
