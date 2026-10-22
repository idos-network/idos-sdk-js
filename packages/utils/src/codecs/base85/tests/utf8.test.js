import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import alphabet from '../alphabets';
import base85 from '../base85';
import * as data from './data';

const json = fs.readFileSync(path.join(import.meta.dirname, 'fixtures/utf8.json'));

describe('utf8 encoding', () => {
  it('encodes json', () => {
    const jsonBase85 = base85.encode(json, 'ascii85');
    const jsonDecoded = base85.decode(jsonBase85, 'ascii85');

    expect(jsonDecoded).not.toBe(false);
    expect(jsonDecoded.length).toBe(json.length);
    expect(jsonDecoded).toEqual(json);
  });
});
