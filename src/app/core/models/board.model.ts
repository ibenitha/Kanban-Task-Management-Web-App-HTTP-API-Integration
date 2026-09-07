// A board is a named container — its tasks live separately in BoardService,
// keyed by boardId, so a board object never carries a nested task array.
export interface Board {
  id: number;
  name: string;
  description: string;
  accent: string; // CSS color used for the board's identity accent
  members: string[]; // initials shown as avatar chips, e.g. 'AK'
  updatedAt: number; // Date.now() timestamp
}
