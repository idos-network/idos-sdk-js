// A restored connector is already connected on first paint. Signing is offered only after
// the user asks to connect and the connector then transitions from disconnected to connected.
export function shouldAdvanceAfterConnect(input: {
  armed: boolean;
  wasConnected: boolean;
  connected: boolean;
}): boolean {
  return input.armed && input.connected && !input.wasConnected;
}
