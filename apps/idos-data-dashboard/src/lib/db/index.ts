import { WebKwil } from "@kwilteam/kwil-js";
import invariant from "tiny-invariant";

const DB_OWNER = import.meta.env.VITE_DB_OWNER;
const DB_NAME = import.meta.env.VITE_DB_NAME;
const DB_PROVIDER = import.meta.env.VITE_DB_PROVIDER;

invariant(DB_OWNER, `VITE_DB_OWNER variable is missing. Please add it to the .env file`);
invariant(DB_NAME, `VITE_DB_NAME variable is missing. Please add it to the .env file`);
invariant(DB_PROVIDER, `VITE_DB_PROVIDER variable is missing. Please add it to the .env file`);

export const kwil = new WebKwil({
  kwilProvider: DB_PROVIDER,
  logging: import.meta.env.DEV,
});

export const dbId = kwil.getDBID(DB_OWNER, DB_NAME);
