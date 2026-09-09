import { useState } from "react";
import { CHAPTERS } from "../data/chapters";
import { useGame } from "../store/GameContext";
import { ChapterReader } from "./ChapterReader";
import { Modal } from "./Modal";

export function Lorebook() {
  const { state, openLorebook } = useGame();
  const [reading, setReading] = useState<string | null>(null);
  const unlocked = new Set(state.unlockedChapters ?? []);

  return (
    <>
      <Modal
        kicker="The ledger"
        title="Full Lorebook"
        onClose={() => openLorebook(false)}
        wide
        className="collection-modal ledger-volume lorebook-modal"
      >
        <div className="lorebook-grid">
          {CHAPTERS.map((chapter) => {
            const open = unlocked.has(chapter.id);
            return (
              <button
                key={chapter.id}
                type="button"
                className={`lorebook-card ${open ? "unsealed" : "sealed"}`}
                disabled={!open}
                onClick={() => {
                  if (open) setReading(chapter.id);
                }}
              >
                <span className="lorebook-card-art">
                  <img src={chapter.art} alt="" />
                </span>
                <strong>{chapter.title}</strong>
              </button>
            );
          })}
        </div>
      </Modal>
      {reading ? <ChapterReader chapterId={reading} onClose={() => setReading(null)} /> : null}
    </>
  );
}
