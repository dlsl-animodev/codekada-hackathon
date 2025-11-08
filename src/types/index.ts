// game object types
export type ObjectType = 'safe' | 'painting' | 'desk';

// message types for ai conversation
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

// puzzle state
export interface PuzzleState {
  id: string;
  solved: boolean;
  attempts: number;
}

// game state
export interface GameState {
  currentRoom: string;
  solvedPuzzles: string[];
  inventory: string[];
  interactionCount: number;
}

// api response types
export interface AIResponse {
  message: string;
  success: boolean;
  error?: string;
}

// three.js component props
export interface InteractableObjectProps {
  type: ObjectType;
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
  onInteract?: (type: ObjectType) => void;
}
