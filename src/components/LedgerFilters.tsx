import { useEffect, useState } from "react";
import { CARD_BACK } from "../data/portraits";

export type FilterOption<T extends string> = { id: T; label: string };

type ViewMode = "all" | "set";
type DropId = "element" | "role" | "extra" | null;

export function LedgerToolbar<TExtra extends string>({
  view,
  onView,
  element,
  elementOptions,
  onElement,
  role,
  roleOptions,
  onRole,
  extraLabel,
  extra,
  extraOptions,
  onExtra,
}: {
  view: ViewMode;
  onView: (view: ViewMode) => void;
  element: string;
  elementOptions: FilterOption<string>[];
  onElement: (id: string) => void;
  role: string;
  roleOptions: FilterOption<string>[];
  onRole: (id: string) => void;
  extraLabel: string;
  extra: TExtra;
  extraOptions: FilterOption<TExtra>[];
  onExtra: (id: TExtra) => void;
}) {
  const [open, setOpen] = useState<DropId>(null);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest(".ledger-drops")) setOpen(null);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="ledger-toolbar">
      <div className="filter-chips">
        <button type="button" className={view === "all" ? "chip on" : "chip"} onClick={() => onView("all")}>
          All
        </button>
        <button type="button" className={view === "set" ? "chip on" : "chip"} onClick={() => onView("set")}>
          Set
        </button>
      </div>
      <div className="ledger-drops">
        <FilterDrop
          label="Element"
          value={element}
          options={elementOptions}
          open={open === "element"}
          onToggle={() => setOpen(open === "element" ? null : "element")}
          onChange={(id) => {
            onElement(id);
            setOpen(null);
          }}
        />
        <FilterDrop
          label="Role"
          value={role}
          options={roleOptions}
          open={open === "role"}
          onToggle={() => setOpen(open === "role" ? null : "role")}
          onChange={(id) => {
            onRole(id);
            setOpen(null);
          }}
        />
        <FilterDrop
          label={extraLabel}
          value={extra}
          options={extraOptions}
          open={open === "extra"}
          onToggle={() => setOpen(open === "extra" ? null : "extra")}
          onChange={(id) => {
            onExtra(id as TExtra);
            setOpen(null);
          }}
        />
      </div>
    </div>
  );
}

export function FilterDrop({
  label,
  value,
  options,
  open,
  onToggle,
  onChange,
}: {
  label: string;
  value: string;
  options: FilterOption<string>[];
  open: boolean;
  onToggle: () => void;
  onChange: (id: string) => void;
}) {
  const current = options.find((option) => option.id === value)?.label ?? "Any";
  return (
    <div className="drop">
      <button type="button" className="drop-btn" onClick={onToggle} aria-expanded={open}>
        <span>{label}</span>
        <strong>{current}</strong>
      </button>
      {open ? (
        <ul className="drop-list view-fade">
          {options.map((option) => (
            <li key={option.id}>
              <button type="button" className={option.id === value ? "on" : ""} onClick={() => onChange(option.id)}>
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function VacantSeat() {
  return (
    <div className="collection-card vacant">
      <div className="vacant-frame">
        <img src={CARD_BACK} alt="" />
      </div>
      <p className="assign-meta">Unrecorded</p>
    </div>
  );
}
