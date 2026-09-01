// A board is just a named container — its tasks live separately in
// BoardService, keyed by boardId, so a board object never carries a
// nested array of tasks around with it.
export interface Board {
  id: number;
  name: string;
  description: string;
  createdAt: number; // Date.now() timestamp, used to sort by "recent"
}
