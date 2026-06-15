import crc32 from "crc-32";
import crypto from "node:crypto";

export interface TeraboxFileHash {
  crc32: number;
  slice: string;
  file: string;
  chunks: string[];
}

function getChunkSize(fileSize: number, isVip = true): number {
  const MiB = 1024 * 1024;
  const GiB = 1024 * MiB;
  const limitSizes = [4, 8, 16, 32, 64, 128];

  if (!isVip) return limitSizes[0] * MiB;

  for (const limit of limitSizes) {
    if (fileSize <= limit * GiB) return limit * MiB;
  }

  return limitSizes[limitSizes.length - 1] * MiB;
}

export function hashBuffer(buffer: Buffer, isVip = true): TeraboxFileHash {
  const sliceSize = 256 * 1024;
  const splitSize = getChunkSize(buffer.length, isVip);

  let crcHash = 0;
  const fileHash = crypto.createHash("md5");
  const sliceHash = crypto.createHash("md5");
  let chunkHash = crypto.createHash("md5");

  const hashData: TeraboxFileHash = {
    crc32: 0,
    slice: "",
    file: "",
    chunks: [],
  };

  let bytesRead = 0;
  let allBytesRead = 0;
  let offset = 0;

  while (offset < buffer.length) {
    const remaining = buffer.length - offset;
    const sliceRemaining = sliceSize - allBytesRead;
    const chunkRemaining = splitSize - bytesRead;
    const sliceAllowed = allBytesRead < sliceSize;
    const readLimit = sliceAllowed
      ? Math.min(remaining, chunkRemaining, sliceRemaining)
      : Math.min(remaining, chunkRemaining);

    const chunk = buffer.subarray(offset, offset + readLimit);
    fileHash.update(chunk);
    crcHash = crc32.buf(chunk, crcHash);
    chunkHash.update(chunk);

    if (sliceAllowed) sliceHash.update(chunk);

    offset += readLimit;
    allBytesRead += readLimit;
    bytesRead += readLimit;

    if (bytesRead >= splitSize) {
      hashData.chunks.push(chunkHash.digest("hex"));
      chunkHash = crypto.createHash("md5");
      bytesRead = 0;
    }
  }

  if (bytesRead > 0) {
    hashData.chunks.push(chunkHash.digest("hex"));
  }

  hashData.crc32 = crcHash >>> 0;
  hashData.slice = sliceHash.digest("hex");
  hashData.file = fileHash.digest("hex");

  return hashData;
}

export { getChunkSize };
