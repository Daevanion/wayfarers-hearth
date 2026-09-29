import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CARD_BY_ID } from "../data/cards";
import {
  abandonDelve,
  chooseDelveNode,
  continueDelve,
  craftTokenFromShards,
  debugGrantRoadReady,
  delveAct,
  ensureDelveOffers,
  finishDelve,
  resolveDelveEvent,
  selectDelveBlessing,
  startDelve,
} from "../game/delve";
import { spendDuplicateXp } from "../game/formulas";
import {
  buyPacks,
  debugCompleteQuests as finishDebugQuests,
  debugRedrawBoard as redrawDebugBoard,
  debugUnlockLore as unsealDebugLore,
  dismissSecretNotice,
  dispatchQuest,
  resolveQuest,
  rolloverBoard,
} from "../game/quests";
import { createNewGame, loadSave, persist, clearSave } from "../game/save";
import type { DelveActionId, GameState, PackResult, Toast, UiState } from "../types";

interface GameApi {
  state: GameState;
  ui: UiState;
  now: number;
  begin: () => void;
  reset: () => void;
  finishIntro: () => void;
  inspect: (id: string | null) => void;
  dispatchTeam: (questKey: string, team: string[]) => string | null;
  resolve: (questKey: string) => string | null;
  buyCardPack: (kind: "gold" | "token", count?: number) => PackResult[] | null;
  spendDuplicates: (cardId: string) => void;
  dismissOutcome: () => void;
  openGuild: (open: boolean) => void;
  openCatalogue: (open: boolean) => void;
  openTavern: (open: boolean) => void;
  openLorebook: (open: boolean) => void;
  openQuestBoard: (open: boolean, view?: UiState["questBoardView"]) => void;
  openSpecialOrder: (chapterId?: string) => void;
  grantDebugFunds: () => void;
  debugRedrawBoard: () => void;
  debugCompleteQuests: () => void;
  debugUnlockLore: () => void;
  startVn: (sceneId: string) => void;
  endVn: () => void;
  dismissToast: (id: string) => void;
  openHearthroads: (open: boolean) => void;
  startDelveRun: (offerKey: string, team: string[]) => string | null;
  chooseRoadNode: (nodeId: string) => string | null;
  actOnRoad: (actorId: string, action: DelveActionId, targetId?: string) => string | null;
  continueRoad: () => string | null;
  resolveRoadEvent: (choiceId: string) => string | null;
  pickRoadBlessing: (blessingId: string) => string | null;
  abandonRoad: () => string | null;
  finishRoad: () => string | null;
  craftShards: () => string | null;
  debugGrantRoads: () => void;
}

const GameContext = createContext<GameApi | null>(null);

function emptyUi(partial: Partial<UiState> = {}): UiState {
  return {
    screen: "title",
    inspecting: null,
    guildOpen: false,
    catalogueOpen: false,
    tavernOpen: false,
    lorebookOpen: false,
    questBoardOpen: false,
    questBoardView: "bounties",
    intro: null,
    vnScene: null,
    outcome: null,
    toasts: [],
    ...partial,
  };
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState | null>(() => loadSave());
  const [now, setNow] = useState(() => Date.now());
  const [ui, setUi] = useState<UiState>(() => emptyUi({ screen: loadSave() ? "plaza" : "title" }));
  const seenLog = useRef<string | null>(state?.journal[0]?.id ?? null);
  const introRef = useRef(ui.intro);
  introRef.current = ui.intro;

  const pushToast = useCallback((text: string, kind: Toast["kind"]) => {
    const toast: Toast = { id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text, kind };
    setUi((u) => ({ ...u, toasts: [...u.toasts.slice(-4), toast] }));
    window.setTimeout(() => {
      setUi((u) => ({ ...u, toasts: u.toasts.filter((t) => t.id !== toast.id) }));
    }, 5200);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      setState((prev) => (prev ? ensureDelveOffers(rolloverBoard(prev, t)) : prev));
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!state) return;
    persist(state);
    const latest = state.journal[0];
    if (!latest || latest.id === seenLog.current) return;
    const first = seenLog.current == null;
    seenLog.current = latest.id;
    if (first) return;
    if (introRef.current) return;
    pushToast(latest.text, latest.kind);
  }, [state, pushToast]);

  const api: GameApi = useMemo(() => {
    const live = state ?? createNewGame();
    const current = () => {
      if (!state) throw new Error("No hearth is lit.");
      return state;
    };
    return {
      state: live,
      ui,
      now,
      begin: () => {
        const fresh = createNewGame();
        seenLog.current = fresh.journal[0]?.id ?? null;
        setState(fresh);
        setUi(emptyUi({ screen: "plaza", intro: "sealed" }));
      },
      reset: () => {
        clearSave();
        seenLog.current = null;
        setState(null);
        setUi(emptyUi());
      },
      finishIntro: () => {
        setUi(() =>
          emptyUi({
            screen: "plaza",
            toasts: [
              {
                id: "begin",
                text: "Three names to start. Take a bounty, match the traits, send them out.",
                kind: "system",
              },
            ],
          }),
        );
      },
      inspect: (id) => setUi((u) => ({ ...u, inspecting: id })),
      dispatchTeam: (questKey, team) => {
        const result = dispatchQuest(current(), questKey, team, Date.now());
        if (result.error) {
          pushToast(result.error, "fail");
          return result.error;
        }
        setState(result.state);
        return null;
      },
      resolve: (questKey) => {
        const result = resolveQuest(current(), questKey, Date.now());
        if (result.error) {
          pushToast(result.error, "fail");
          return result.error;
        }
        setState(result.state);
        if (result.outcome) {
          const outcome = result.outcome;
          setUi((u) => ({ ...u, outcome }));
        }
        return null;
      },
      buyCardPack: (kind, count = 1) => {
        const result = buyPacks(current(), kind, count);
        if (result.error) {
          pushToast(result.error, "fail");
          return null;
        }
        setState(result.state);
        return result.results ?? null;
      },
      spendDuplicates: (cardId) => {
        const live = current();
        const owned = live.cards.find((card) => card.id === cardId);
        if (!owned || (owned.duplicateXp ?? 0) <= 0) return;
        const { card, leveled } = spendDuplicateXp(owned);
        setState({
          ...live,
          cards: live.cards.map((entry) => (entry.id === cardId ? card : entry)),
        });
        if (leveled) pushToast(`${CARD_BY_ID[cardId]?.name ?? "A companion"} rises in rank.`, "recruit");
      },
      dismissOutcome: () => setUi((u) => ({ ...u, outcome: null })),
      openGuild: (open) =>
        setUi((u) => ({
          ...u,
          guildOpen: open,
          catalogueOpen: false,
          tavernOpen: false,
          lorebookOpen: false,
          questBoardOpen: false,
        })),
      openCatalogue: (open) =>
        setUi((u) => ({
          ...u,
          catalogueOpen: open,
          guildOpen: false,
          tavernOpen: false,
          lorebookOpen: false,
          questBoardOpen: false,
        })),
      openTavern: (open) =>
        setUi((u) => ({
          ...u,
          tavernOpen: open,
          guildOpen: false,
          catalogueOpen: false,
          lorebookOpen: false,
          questBoardOpen: false,
        })),
      openLorebook: (open) =>
        setUi((u) => ({
          ...u,
          lorebookOpen: open,
          guildOpen: false,
          catalogueOpen: false,
          tavernOpen: false,
          questBoardOpen: false,
        })),
      openQuestBoard: (open, view) =>
        setUi((u) => ({
          ...u,
          questBoardOpen: open,
          questBoardView: open ? (view ?? (u.questBoardOpen ? u.questBoardView : "bounties")) : u.questBoardView,
          guildOpen: open ? false : u.guildOpen,
          catalogueOpen: open ? false : u.catalogueOpen,
          tavernOpen: open ? false : u.tavernOpen,
          lorebookOpen: open ? false : u.lorebookOpen,
        })),
      openSpecialOrder: (chapterId) => {
        if (chapterId) setState((prev) => (prev ? dismissSecretNotice(prev, chapterId) : prev));
        setUi((u) => ({
          ...u,
          questBoardOpen: true,
          questBoardView: "special",
          guildOpen: false,
          catalogueOpen: false,
          tavernOpen: false,
          lorebookOpen: false,
        }));
      },
      grantDebugFunds: () => {
        setState((prev) => {
          if (!prev) return prev;
          return { ...prev, gold: prev.gold + 1000, tokens: prev.tokens + 100, tokenShards: (prev.tokenShards ?? 0) + 16 };
        });
      },
      debugRedrawBoard: () => {
        setState((prev) => (prev ? redrawDebugBoard(prev, Date.now()) : prev));
      },
      debugCompleteQuests: () => {
        setState((prev) => (prev ? finishDebugQuests(prev, Date.now()) : prev));
      },
      debugUnlockLore: () => {
        setState((prev) => (prev ? unsealDebugLore(prev) : prev));
      },
      startVn: (sceneId) =>
        setUi((u) => ({
          ...u,
          vnScene: sceneId,
          guildOpen: false,
          catalogueOpen: false,
          tavernOpen: false,
          lorebookOpen: false,
          questBoardOpen: false,
        })),
      endVn: () => setUi((u) => ({ ...u, vnScene: null })),
      dismissToast: (id) => setUi((u) => ({ ...u, toasts: u.toasts.filter((t) => t.id !== id) })),
      openHearthroads: (open) => {
        if (open) setState((prev) => (prev ? ensureDelveOffers(prev) : prev));
        setUi((u) => ({
          ...u,
          screen: open ? "hearthroads" : "plaza",
          guildOpen: false,
          catalogueOpen: false,
          tavernOpen: false,
          lorebookOpen: false,
          questBoardOpen: false,
        }));
      },
      startDelveRun: (offerKey, team) => {
        const result = startDelve(current(), offerKey, team, Date.now());
        if (result.error) {
          pushToast(result.error, "fail");
          return result.error;
        }
        setState(result.state);
        return null;
      },
      chooseRoadNode: (nodeId) => {
        const result = chooseDelveNode(current(), nodeId);
        if (result.error) {
          pushToast(result.error, "fail");
          return result.error;
        }
        setState(result.state);
        return null;
      },
      actOnRoad: (actorId, action, targetId) => {
        const result = delveAct(current(), actorId, action, targetId);
        if (result.error) {
          pushToast(result.error, "fail");
          return result.error;
        }
        setState(result.state);
        return null;
      },
      continueRoad: () => {
        const result = continueDelve(current());
        if (result.error) {
          pushToast(result.error, "fail");
          return result.error;
        }
        setState(result.state);
        return null;
      },
      resolveRoadEvent: (choiceId) => {
        const result = resolveDelveEvent(current(), choiceId);
        if (result.error) {
          pushToast(result.error, "fail");
          return result.error;
        }
        setState(result.state);
        return null;
      },
      pickRoadBlessing: (blessingId) => {
        const result = selectDelveBlessing(current(), blessingId);
        if (result.error) {
          pushToast(result.error, "fail");
          return result.error;
        }
        setState(result.state);
        return null;
      },
      abandonRoad: () => {
        const result = abandonDelve(current());
        if (result.error) {
          pushToast(result.error, "fail");
          return result.error;
        }
        setState(result.state);
        return null;
      },
      finishRoad: () => {
        const result = finishDelve(current(), Date.now());
        if (result.error) {
          pushToast(result.error, "fail");
          return result.error;
        }
        setState(result.state);
        setUi((u) => ({ ...u, screen: "plaza" }));
        return null;
      },
      craftShards: () => {
        const result = craftTokenFromShards(current());
        if (result.error) {
          pushToast(result.error, "fail");
          return result.error;
        }
        setState(result.state);
        pushToast("A recruitment token is struck from shard-glass.", "recruit");
        return null;
      },
      debugGrantRoads: () => {
        setState((prev) => (prev ? debugGrantRoadReady(prev) : prev));
      },
    };
  }, [state, ui, now, pushToast]);

  return <GameContext.Provider value={api}>{children}</GameContext.Provider>;
}

export function useGame(): GameApi {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
