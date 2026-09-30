---
"@idos-network/utils": patch
---

Replace the `base85` dependency with a native ascii85 codec: ~5x faster encoding, ~8x faster decoding, and files ending in 1–3 zero bytes no longer get truncated.
