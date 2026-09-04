import { GameProvider, useGame } from "./store/GameContext";
import { TitleScreen } from "./components/TitleScreen";
import { HUD } from "./components/HUD";
import { Plaza } from "./components/Plaza";
import { Guild } from "./components/Guild";
import { Catalogue } from "./components/Catalogue";
import { TavernShop } from "./components/TavernShop";
import { QuestResult } from "./components/QuestResult";
import { Toasts } from "./components/Toasts";
import { Journal } from "./components/Journal";
import { SfxRoot } from "./components/SfxRoot";
import { BgmRoot } from "./components/BgmRoot";
import { Settings } from "./components/Settings";
import { OpeningDraw } from "./components/OpeningDraw";
import { VisualNovel } from "./components/VisualNovel";

function Shell() {
  const { ui } = useGame();
  if (ui.screen === "title") {
    return (
      <>
        <TitleScreen />
        {ui.vnScene ? <VisualNovel /> : null}
        <Settings />
      </>
    );
  }

  return (
    <div className="app map-app">
      <HUD />
      <Plaza />
      {ui.intro ? <OpeningDraw /> : null}
      {ui.guildOpen ? <Guild /> : null}
      {ui.catalogueOpen ? <Catalogue /> : null}
      {ui.tavernOpen ? <TavernShop /> : null}
      <QuestResult />
      {ui.intro ? null : <Journal />}
      {ui.intro ? null : <Toasts />}
      {ui.vnScene ? <VisualNovel /> : null}
      <Settings />
    </div>
  );
}

export default function App() {
  return (
    <SfxRoot>
      <GameProvider>
        <BgmRoot>
          <Shell />
        </BgmRoot>
      </GameProvider>
    </SfxRoot>
  );
}
