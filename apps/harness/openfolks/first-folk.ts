import type { ModelSelection } from "../contracts.ts";
import type { Store } from "../store.ts";

export const FIRST_FOLK_NAME = "Assistant";
export const FIRST_FOLK_TITLE = "Ready for whatever you need";

/** Blank first bot for a fresh OpenFolks workspace — not the Job Search crew. */
export function createFirstFolk(store: Store, selection: ModelSelection) {
  return store.createBot({
    name: FIRST_FOLK_NAME,
    title: FIRST_FOLK_TITLE,
    modelSelection: selection,
  });
}
