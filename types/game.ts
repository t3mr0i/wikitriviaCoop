import { Item, PlayedItem } from "./item";

export type { Item, PlayedItem };

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  lives: number;
  ready: boolean;
  ranking?: number;
}

export interface GameState {
  lobbyId: string;
  players: Player[];
  currentRound: number;
  deck: any[];
  played: any[];
  next: any | null;
  nextButOne: any | null;
  badlyPlaced: any | null;
  lives: number;
  gameType: 'coop' | 'versus';
  category: string;
}
