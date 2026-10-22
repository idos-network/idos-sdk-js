import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import base85 from '../base85';

describe('loremipsum', () => {
  it('encodes/decodes loremipsum using ascii85', () => {
    const raw = Buffer.from(fs.readFileSync(path.join(import.meta.dirname, 'loremipsum.raw')));
    const enc = Buffer.from(fs.readFileSync(path.join(import.meta.dirname, 'loremipsum.base85')));

    const decoded = base85.decode(enc, 'ascii85');
    const encoded = base85.encode(raw, 'ascii85');

    expect(decoded).toEqual(raw);
    expect(encoded).toEqual(enc.toString('ascii'));
  });

  it('encodes/decodes loremipsum using z85', () => {
    const raw = Buffer.from(fs.readFileSync(path.join(import.meta.dirname, 'loremipsum.raw')));
    const enc = Buffer.from(fs.readFileSync(path.join(import.meta.dirname, 'loremipsum.z85')));

    const decoded = base85.decode(enc, 'z85');
    const encoded = base85.encode(raw, 'z85');

    expect(decoded).toEqual(raw);
    expect(encoded).toEqual(enc.toString('ascii'));
  });
});
