import town from "../Assets/bg/town.jpg";
import town2 from "../Assets/bg/town2.jpg";
import town3 from "../Assets/bg/town3.jpg";
import crossroads from "../Assets/bg/crossroads.jpg";
import tavern from "../Assets/bg/tavern.jpg";
import whisperingWoods from "../Assets/bg/whispering_woods.jpg";
import oldKingsRoad from "../Assets/bg/old_kings_road.jpg";
import mirefenCrossing from "../Assets/bg/mirefen_crossing.jpg";
import ruinsCaldara from "../Assets/bg/ruins_caldara.jpg";
import questboard from "../Assets/bg/questboard_bg.png";
import goblinQuest from "../Assets/bg/goblinquest_bg.jpg";

export const BACKGROUNDS = {
  town,
  town2,
  town3,
  crossroads,
  tavern,
  whisperingWoods,
  oldKingsRoad,
  mirefenCrossing,
  ruinsCaldara,
  questboard,
  goblinQuest,
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
