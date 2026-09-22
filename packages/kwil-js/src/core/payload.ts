import { Base64String, PartialNillable } from "../utils/types";
import {
  ActionSchema,
  Attribute,
  Column,
  Extension,
  Index,
  Table,
  Database,
  Procedure,
  ForeignProcedure,
  DataInfo,
  ProcedureReturn,
  NamedType,
} from "./database";
import { PayloadType } from "./enums";
import { AccountId } from "./network";

/**
 * `AllPayloads` is the union of all payload types.
 */
export type AllPayloads =
  | UnencodedActionPayload<PayloadType.CALL_ACTION | PayloadType.EXECUTE_ACTION>
  | TransferPayload
  | RawStatementPayload;

export type UnencodedActionPayload<T extends PayloadType.CALL_ACTION | PayloadType.EXECUTE_ACTION> =
  {
    dbid: string; // May become namespace in the future
    action: string;
    arguments: T extends PayloadType.EXECUTE_ACTION ? EncodedValue[][] : EncodedValue[] | undefined;
  };

export interface EncodedValue {
  type: DataInfo;
  data: Uint8Array[];
}

export interface EncodedParameterValue {
  type: DataInfo;
  data: Base64String[];
}

export interface RawStatementPayload {
  statement: string;
  parameters: NamedValue[];
}

interface NamedValue {
  // name is the name of the parameter
  // E.g,. for a query `INSERT INTO table VALUES $value`, the name would be $name
  name: string;
  // value is same shape as `params.params[$variable_name]` from the selectQuery EXCEPT, rather than converting values to base64, you only need to conver them to Uint8array.
  value: EncodedValue;
}

/**
 * `TransferPayload` is the payload for transferring funds.
 * The generic allows the Builder to be typed to the correct payload type.
 * The `to` field is typed to either a Uint8Array or a base64 string depending on the encoding status.
 * The `amount` field is typed to a string because it is a decimal value.
 */
export interface TransferPayload {
  to: AccountId;
  amount: string;
}

/** DEPRECATED */
/* EVERYTHNG BELOW CAN BE REMOVED WHEN DEPRECATED APIS ARE REMOVED */

/**
 * `CompiledKuneiform` is the compiled version of the Kuneiform schema. This is the schema that is used to deploy a database.
 * The schema follows the Database Interface {@link Database}, with each field being optional.
 */
export interface CompiledKuneiform {
  owner: Uint8Array | string | null;
  name: string;
  tables: PartialNillable<CompiledTable>[] | null;
  actions: PartialNillable<ActionSchema>[] | null;
  extensions: PartialNillable<Extension>[] | null;
  procedures: PartialNillable<CompiledProcedure>[] | null;
  foreign_calls: PartialNillable<CompiledForeignProcedure>[] | null;
}

// The CompiledXXX types are used to replace the enums in the Database interface with strings.
export type CompiledTable = Omit<Table, "columns" | "indexes"> & {
  columns: ReadonlyArray<CompiledColumn>;
  indexes: ReadonlyArray<CompiledIndex>;
};

type CompiledColumn = Omit<Column, "attributes" | "type"> & {
  attributes: ReadonlyArray<CompiledAttribute>;
  type: CompiledDataType;
};

export type CompiledDataType = Omit<DataInfo, "name" | "metadata"> & {
  name: string;
  metadata?: Array<number> | Array<never> | null;
};

type CompiledAttribute = Omit<Attribute, "type"> & {
  type: string;
};

type CompiledIndex = Omit<Index, "type"> & {
  type: string;
};

export type CompiledProcedure = Omit<Procedure, "return_types" | "parameters"> & {
  parameters: ReadonlyArray<CompiledNamedType>;
  return_types: CompiledProcedureReturn | Array<never>;
};

type CompiledProcedureReturn = Omit<ProcedureReturn, "fields"> & {
  fields: ReadonlyArray<CompiledNamedType>;
};

type CompiledNamedType = Omit<NamedType, "type"> & {
  type: CompiledDataType;
};

export type CompiledForeignProcedure = Omit<ForeignProcedure, "return_types" | "parameters"> & {
  parameters: ReadonlyArray<CompiledDataType>;
  return_types: CompiledProcedureReturn | Array<never>;
};
