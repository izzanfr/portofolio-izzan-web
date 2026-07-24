import fs from "node:fs";
import path from "node:path";
import credentials from "@/content/certifications.json";

export type Certificate = {
  name: string;
  issuer: string;
  date: string;
  featured: boolean;
  image: string;
  description: string;
  covers: string[];
  /** Intrinsic pixel size, read from the file so next/image can size and
      optimise a masonry thumbnail without shipping the full-res scan. */
  width: number;
  height: number;
};

const FALLBACK = { width: 1600, height: 1131 };

/**
 * Reads intrinsic dimensions straight from the file header — no dependency.
 * Handles the two formats the certificate scans use (PNG and JPEG); anything
 * else falls back to a 4/3 guess.
 */
function imageSize(file: string): { width: number; height: number } {
  const buf = fs.readFileSync(file);

  // PNG: 8-byte signature, then the IHDR chunk (width/height as big-endian u32).
  if (buf.length >= 24 && buf.toString("ascii", 12, 16) === "IHDR") {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }

  // JPEG: walk the marker segments to the Start-Of-Frame, which carries the size.
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    while (offset + 1 < buf.length) {
      if (buf[offset] !== 0xff) {
        offset++;
        continue;
      }
      let marker = buf[offset + 1];
      while (marker === 0xff && offset + 1 < buf.length) {
        offset++;
        marker = buf[offset + 1];
      }
      offset += 2;
      // Standalone markers carry no length segment.
      if (marker === 0xd8 || marker === 0xd9 || marker === 0x01) continue;
      if (marker >= 0xd0 && marker <= 0xd7) continue;
      if (offset + 2 > buf.length) break;
      const length = buf.readUInt16BE(offset);
      // SOF0–SOF15, excluding the non-frame markers in that range.
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: buf.readUInt16BE(offset + 3), width: buf.readUInt16BE(offset + 5) };
      }
      offset += length;
    }
  }

  return FALLBACK;
}

export function getCertificates(): Certificate[] {
  return credentials.certifications.map((certificate) => {
    const file = path.join(process.cwd(), "public", certificate.image.replace(/^\//, ""));
    let dimensions = FALLBACK;
    try {
      dimensions = imageSize(file);
    } catch {
      // Missing/unreadable file — keep the fallback ratio rather than crash the build.
    }
    return { ...certificate, ...dimensions };
  });
}
