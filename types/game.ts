import { Item, PlayedItem } from "./item";

export interface GameState {
  badlyPlaced: null;
  deck: Item[];
  imageCache: [];
  lives: 3;
  next: Item | null;
  nextButOne: Item | null;
  played: PlayedItem[];
}
