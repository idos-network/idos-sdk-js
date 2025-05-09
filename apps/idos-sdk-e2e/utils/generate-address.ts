export function generateSimpleEthAddress() {
  // Generate 40 random hex characters (20 bytes)
  const chars = "0123456789abcdef";
  let address = "";
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return `0x${address}`;
}
