export const MAX_LISTING_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_LISTING_IMAGES = 15;

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

function startsWith(bytes: Uint8Array, signature: number[], offset = 0) {
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

export function validateListingImageMetadata(file: {
  type: string;
  size: number;
}) {
  const extension = extensions[file.type];
  if (!extension) throw new Error("image_type_invalid");
  if (file.size < 12 || file.size > MAX_LISTING_IMAGE_BYTES) {
    throw new Error("image_size_invalid");
  }
  return extension;
}

export async function validateListingImage(file: File) {
  const extension = validateListingImageMetadata(file);

  const bytes = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  const valid =
    (file.type === "image/jpeg" && startsWith(bytes, [0xff, 0xd8, 0xff])) ||
    (file.type === "image/png" &&
      startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ||
    (file.type === "image/webp" &&
      startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
      startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) ||
    (file.type === "image/avif" &&
      startsWith(bytes, [0x66, 0x74, 0x79, 0x70], 4) &&
      (startsWith(bytes, [0x61, 0x76, 0x69, 0x66], 8) ||
        startsWith(bytes, [0x61, 0x76, 0x69, 0x73], 8)));
  if (!valid) throw new Error("image_signature_invalid");
  return extension;
}
