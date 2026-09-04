import town from "../Assets/bg/town.jpg";
import town2 from "../Assets/bg/town2.jpg";
import town3 from "../Assets/bg/town3.jpg";
import crossroads from "../Assets/bg/crossroads.jpg";
import tavern from "../Assets/bg/tavern.jpg";
import tavern3 from "../Assets/bg/tavern3.jpg";
import whisperingWoods from "../Assets/bg/whispering_woods.jpg";
import oldKingsRoad from "../Assets/bg/old_kings_road.jpg";
import mirefenCrossing from "../Assets/bg/mirefen_crossing.jpg";
import ruinsCaldara from "../Assets/bg/ruins_caldara.jpg";
import questboard2 from "../Assets/bg/questboard_bg2.jpg";
import questPage from "../Assets/bg/quest_page_bg.png";
import questPage1 from "../Assets/bg/quest_page_1.png";
import questPage2 from "../Assets/bg/quest_page_2.png";
import book from "../Assets/bg/book_bg.png";
import goblinQuest from "../Assets/bg/goblinquest_bg.jpg";
import caravan from "../Assets/bg/caravan.jpg";
import collection from "../Assets/bg/collection_bg.jpg";
import brotherhoodQuest1 from "../Assets/bg/brotherhood_quest1.jpg";
import merchantRoad from "../Assets/bg/merchant_road.jpg";

export const BACKGROUNDS = {
  town,
  town2,
  town3,
  crossroads,
  tavern,
  tavern3,
  whisperingWoods,
  oldKingsRoad,
  mirefenCrossing,
  ruinsCaldara,
  questboard2,
  questPage,
  questPage1,
  questPage2,
  book,
  goblinQuest,
  caravan,
  collection,
  brotherhoodQuest1,
  merchantRoad,
} as const;

const LOCATION_SCENE: Record<string, string> = {
  "whispering-woods": whisperingWoods,
  "old-kings-road": oldKingsRoad,
  "mirefen-crossing": mirefenCrossing,
  "ruins-of-caldara": ruinsCaldara,
};

export function locationScene(locationId: string): string {
  return LOCATION_SCENE[locationId] ?? crossroads;
}
