import { AttributeType, IndexType, VarType } from "./enums";
import { CompiledKuneiform } from "./payload";

/**
 * @typedef {Object} DeployBody is the interface for deploying a database with the `kwil.deploy()` method.
 *
 * @property {CompiledKuneiform} schema - The compiled Kuneiform schema to deploy.
 * @property {string?} description (optional) - The description of the database.
 * @property {number} nonce (optional) - The nonce of the transaction.
 */
export interface DeployBody {
  schema: CompiledKuneiform;
  description?: string;
  nonce?: number;
}

/**
 * @typedef {Object} DropBody is the interface for dropping a database with the `kwil.drop()` method.
 *
 * @property {string} dbid - The database ID of the database to drop.
 * @property {string?} description (optional) - The description of the database.
 * @property {number} nonce (optional) - The nonce of the transaction.
 */
export interface DropBody {
  dbid: string;
  description?: string;
  nonce?: number;
}

export interface DataInfo {
  name: VarType;
  is_array: boolean;
  metadata?: Array<number> | Array<never> | null;
}

type DataInfoFactory = (p: number, s: number) => DataInfo;

export namespace DataType {
  export const Uuid: DataInfo = {
    name: VarType.UUID,
    is_array: false,
    metadata: [0, 0],
  };
  export const UuidArray: DataInfo = {
    name: VarType.UUID,
    is_array: true,
    metadata: [0, 0],
  };
  export const Text: DataInfo = {
    name: VarType.TEXT,
    is_array: false,
    metadata: [0, 0],
  };
  export const TextArray: DataInfo = {
    name: VarType.TEXT,
    is_array: true,
    metadata: [0, 0],
  };
  export const Int: DataInfo = {
    name: VarType.INT8,
    is_array: false,
    metadata: [0, 0],
  };
  export const IntArray: DataInfo = {
    name: VarType.INT8,
    is_array: true,
    metadata: [0, 0],
  };
  export const Boolean: DataInfo = {
    name: VarType.BOOL,
    is_array: false,
    metadata: [0, 0],
  };
  export const BooleanArray: DataInfo = {
    name: VarType.BOOL,
    is_array: true,
    metadata: [0, 0],
  };
  export const Numeric: DataInfoFactory = (precision: number, scale: number) => ({
    name: VarType.NUMERIC,
    is_array: false,
    metadata: [precision, scale],
  });
  export const NumericArray: DataInfoFactory = (precision: number, scale: number) => ({
    name: VarType.NUMERIC,
    is_array: true,
    metadata: [precision, scale],
  });
  export const Null: DataInfo = {
    name: VarType.NULL,
    is_array: false,
    metadata: [0, 0],
  };
  export const NullArray: DataInfo = {
    name: VarType.NULL,
    is_array: true,
    metadata: [0, 0],
  };
  export const Bytea: DataInfo = {
    name: VarType.BYTEA,
    is_array: false,
    metadata: [0, 0],
  };
  export const ByteaArray: DataInfo = {
    name: VarType.BYTEA,
    is_array: true,
    metadata: [0, 0],
  };
}

/** DEPRECATED */
/* EVERYTHING BELOW CAN BE REMOVED WHEN DEPRECATED APIS ARE REMOVED */

export interface Database {
  owner: Uint8Array;
  name: string;
  extensions: ReadonlyArray<Extension>;
  tables: ReadonlyArray<Table>;
  actions: ReadonlyArray<ActionSchema>;
  procedures: ReadonlyArray<Procedure>;
  foreign_calls: ReadonlyArray<ForeignProcedure>;
}

export interface Table {
  name: string;
  columns: ReadonlyArray<Column>;
  indexes: ReadonlyArray<Index>;
  foreign_keys: ReadonlyArray<ForeignKey>;
}

export interface Column {
  name: string;
  type: DataInfo;
  attributes: ReadonlyArray<Attribute>;
}

export interface Attribute {
  type: AttributeType;
  value: string;
}

export interface Index {
  name: string;
  columns: ReadonlyArray<string>;
  type: IndexType;
}

export interface ForeignKey {
  child_keys: ReadonlyArray<string>;
  parent_keys: ReadonlyArray<string>;
  parent_table: string;
  actions: ReadonlyArray<ForeignKeyAction>;
}

export interface ForeignKeyAction {
  on: string;
  do: string;
}

export interface ActionSchema {
  name: string;
  annotations: ReadonlyArray<string>;
  parameters: ReadonlyArray<string>;
  public: boolean;
  modifiers: ReadonlyArray<string>;
  body: string;
}

export interface Extension {
  name: string;
  initialization: ReadonlyArray<ExtensionConfig>;
  alias: string;
}

export interface ExtensionConfig {
  name: string;
  value: string;
}

export interface Procedure {
  name: string;
  parameters: ReadonlyArray<NamedType>;
  public: boolean;
  modifiers: ReadonlyArray<string>;
  body: string;
  return_types: ProcedureReturn;
  annotations: ReadonlyArray<string>;
}

export interface NamedType {
  name: string;
  type: DataInfo;
}
export interface ProcedureReturn {
  is_table: boolean;
  fields: ReadonlyArray<NamedType>;
}

export interface ForeignProcedure {
  name: string;
  parameters: ReadonlyArray<DataInfo>;
  return_types: ProcedureReturn;
}
