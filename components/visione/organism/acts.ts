import type { ManifestoRole } from "@/lib/content";
import type { WordAct } from "./KineticText";

/**
 * The charged words of each beat, and how they should behave. Matched against
 * both Italian (authoritative) and English so a word enacts its meaning in
 * either language. Word boundaries are loose on purpose — punctuation rides
 * along with the word token, so we test with includes-style fragments.
 */
export const WORD_ACTS: Record<ManifestoRole, WordAct[]> = {
  // thesis: art rekindles the collective sentience.
  thesis: [{ match: /riaccendere|rekindle/i, kind: "glow" }],

  // urgency: immersion in the imaginary, the world-soul.
  urgency: [
    { match: /immersione|immersion/i, kind: "sink" },
    { match: /Mundi/i, kind: "glow" },
  ],

  // labyrinth: ambiguous forms, erasure and rewriting, chaos, fragments.
  labyrinth: [
    { match: /labirinto|labyrinth/i, kind: "scatter" },
    { match: /cancellature|riscritture|erasures|rewritings/i, kind: "strike" },
    { match: /frammenti|fragments|ammasso|chaotic/i, kind: "scatter" },
    { match: /frantumi|pieces/i, kind: "scatter" },
  ],

  // breath: the image surfaces, takes form.
  breath: [{ match: /affiora|surfaces/i, kind: "rise" }],

  // core: the underground current -> blood and fire.
  core: [
    { match: /torrente|current/i, kind: "rise" },
    { match: /dispersi|scattered/i, kind: "scatter" },
  ],

  // call: descent into the psychic underworld; reaction.
  call: [{ match: /inferi|underworld/i, kind: "bleed" }],

  // promise: new lifeblood to Art.
  promise: [{ match: /linfa|lifeblood|vitale|fresh/i, kind: "glow" }],
};
