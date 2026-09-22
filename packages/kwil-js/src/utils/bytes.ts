// The GRPC gateway "bytes" type requires base64url encoded strings.
// Convert function to Uint16Array
export function numberToUint16BigEndian(num: number): Uint8Array {
  if (num < 0 || num > 65535 || !Number.isInteger(num)) {
    throw new Error("Number is out of range for uint16");
  }

  const buffer = new ArrayBuffer(2);
  const view = new DataView(buffer);
  view.setUint16(0, num, false); // big endian
  return new Uint8Array(buffer);
}

// Converts a uint8array in uint16 format to a number
export function uint16BigEndianToNumber(uint16: Uint8Array): number {
  if (uint16.length !== 2) {
    throw new Error("uint16 must be 2 bytes");
  }
  const view = new DataView(uint16.buffer);
  return view.getUint16(0, false); // big endian
}

export function numberToUint64LittleEndian(num: number): Uint8Array {
  const buffer = new ArrayBuffer(8);
  new DataView(buffer).setBigUint64(0, BigInt(Math.trunc(num)), true);
  return new Uint8Array(buffer);
}

export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  let totalLength = 0;
  for (const arr of arrays) {
    totalLength += arr.length;
  }
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

export function numberToUint16LittleEndian(number: number): Uint8Array {
  if (number < 0 || number > 0xffff || !Number.isInteger(number)) {
    throw new RangeError("The number must be an integer between 0 and 65535.");
  }

  const buffer = new ArrayBuffer(2); // Create a buffer of 2 bytes
  const view = new DataView(buffer);

  view.setUint16(0, number, true); // Set the number at byte offset 0 in little-endian

  return new Uint8Array(buffer); // Convert to Uint8Array for easier use
}

function numberToUint32LittleEndian(number: number): Uint8Array {
  if (number < 0 || number > 0xffffffff || !Number.isInteger(number)) {
    throw new RangeError("The number must be an integer between 0 and 4294967295.");
  }

  const buffer = new ArrayBuffer(4); // Create a buffer of 4 bytes
  const view = new DataView(buffer);

  view.setUint32(0, number, true); // Write the number at byte offset 0 in little-endian

  return new Uint8Array(buffer); // Convert to Uint8Array for easier use
}

export function numberToUint32BigEndian(number: number): Uint8Array {
  if (number < 0 || number > 0xffffffff || !Number.isInteger(number)) {
    throw new RangeError("The number must be an integer between 0 and 4294967295.");
  }

  const buffer = new ArrayBuffer(4); // Create a buffer of 4 bytes
  const view = new DataView(buffer);

  view.setUint32(0, number, false); // Write the number in big-endian format (false)

  return new Uint8Array(buffer); // Convert to Uint8Array for easier use
}

// prefixBytesLength prefixes a Uint8array with the bytes length (uint32)
export function prefixBytesLength(bytes: Uint8Array): Uint8Array {
  const lengthBytes = numberToUint32LittleEndian(bytes.length);

  return concatBytes(lengthBytes, bytes);
}
