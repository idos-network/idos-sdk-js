const KWIL_TX_POLL_DEADLINE_MS = 90_000;
const INITIAL_POLL_INTERVAL_MS = 300;
const POLL_BACKOFF_FACTOR = 1.5;
const MAX_POLL_INTERVAL_MS = 2_000;
const MAX_POLL_JITTER_MS = 100;

export type KwilTxInfo = {
  height: number;
  tx_result: {
    code: number;
    log: string;
  };
};

export class KwilTxFailedError extends Error {
  readonly name = "KwilTxFailedError";

  constructor(
    readonly txHash: string,
    readonly code: number,
    readonly log: string,
    readonly height: number,
  ) {
    super(`Kwil transaction ${txHash} failed at height ${height} (code ${code}): ${log}`);
  }
}

export class KwilTxPollTimeoutError extends Error {
  readonly name = "KwilTxPollTimeoutError";

  constructor(
    readonly txHash: string,
    readonly deadlineMs: number,
  ) {
    super(`Timed out after ${deadlineMs}ms waiting for Kwil transaction ${txHash}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nextPollIntervalMs(currentIntervalMs: number): number {
  return Math.min(currentIntervalMs * POLL_BACKOFF_FACTOR, MAX_POLL_INTERVAL_MS);
}

function pollIntervalWithJitter(intervalMs: number): number {
  return intervalMs + Math.floor(Math.random() * (MAX_POLL_JITTER_MS + 1));
}

function isTxFinalized(txInfo: KwilTxInfo): boolean {
  return txInfo.height > 0;
}

export async function waitForKwilTx(
  txInfo: (txHash: string) => Promise<{ data?: KwilTxInfo }>,
  txHash: string,
  deadlineMs: number = KWIL_TX_POLL_DEADLINE_MS,
): Promise<void> {
  const deadlineAt = Date.now() + deadlineMs;
  let intervalMs = INITIAL_POLL_INTERVAL_MS;

  while (Date.now() < deadlineAt) {
    try {
      const response = await txInfo(txHash);
      const data = response.data;

      if (data && isTxFinalized(data)) {
        if (data.tx_result.code === 0) {
          return;
        }

        throw new KwilTxFailedError(txHash, data.tx_result.code, data.tx_result.log, data.height);
      }
    } catch (error) {
      if (error instanceof KwilTxFailedError) {
        throw error;
      }
    }

    const waitMs = pollIntervalWithJitter(intervalMs);
    const remainingMs = deadlineAt - Date.now();
    if (remainingMs <= 0) {
      break;
    }

    await sleep(Math.min(waitMs, remainingMs));
    intervalMs = nextPollIntervalMs(intervalMs);
  }

  throw new KwilTxPollTimeoutError(txHash, deadlineMs);
}
