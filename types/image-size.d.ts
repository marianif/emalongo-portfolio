// Next.js bundles image-size at this path but ships no types for it.
// We use only the synchronous buffer signature.
declare module "next/dist/compiled/image-size" {
  export function imageSize(input: Buffer | Uint8Array): {
    width?: number;
    height?: number;
    type?: string;
    orientation?: number;
  };
}
