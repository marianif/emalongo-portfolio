import Reveal from "@/components/motion/Reveal";

/**
 * A manifesto fragment threaded between featured works. Large Besley, low
 * contrast, lots of air: the painter's voice surfacing out of the dark, not a
 * labelled "quote" block. Sits in the crypt; never a card.
 */
export default function VoiceFragment({ text }: { text: string }) {
  return (
    <Reveal
      as="p"
      className="mx-auto max-w-[24ch] py-[clamp(4rem,12vh,9rem)] text-center font-serif text-[clamp(1.6rem,4.2vw,3rem)] leading-[1.18] text-bone/55 italic"
    >
      {text}
    </Reveal>
  );
}
