import { Item, PlayedItem } from "./item";

interface Player {
  id: string;
  name: string;
  isHost: boolean;
}

export interface GameState {
  lobbyId: string;
  players: Player[];
  currentRound: number;
  deck: any[];
  played: any[];
  next: any | null;
  nextButOne: any | null;
  lives: number;
  badlyPlaced: any | null;
}
