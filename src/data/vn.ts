import cedricIdle from "../Assets/vn_characters/cedric_idle.png";
import heraIdle from "../Assets/vn_characters/hera_idle.png";

export type VnSpeakerId = "hera" | "cedric";

export interface VnSpeaker {
  id: VnSpeakerId;
  name: string;
  sprite: string;
  side: "left" | "right";
}

export interface VnLine {
  speaker: VnSpeakerId;
  text: string;
}

export interface VnScene {
  id: string;
  lines: VnLine[];
}

export const VN_SPEAKERS: Record<VnSpeakerId, VnSpeaker> = {
  hera: { id: "hera", name: "Hera", sprite: heraIdle, side: "left" },
  cedric: { id: "cedric", name: "Cedric", sprite: cedricIdle, side: "right" },
};

export const VN_SCENES: Record<string, VnScene> = {
  "hearthbound-arrival": {
    id: "hearthbound-arrival",
    lines: [
      { speaker: "hera", text: "Whoaaaaa! We're finally here!" },
      {
        speaker: "hera",
        text: "Cedric! Let's headout to the guild ASAP and see what quests are available!!",
      },
      {
        speaker: "cedric",
        text: "Stop running you brat! We just got here. Besides, Caelan is still struggling behind at the gates, let's go get him first... ok?",
      },
      {
        speaker: "hera",
        text: "Fine... But after that, we're picking up the hardest available quest. Got it??",
      },
      { speaker: "cedric", text: "This girl..." },
    ],
  },
};
