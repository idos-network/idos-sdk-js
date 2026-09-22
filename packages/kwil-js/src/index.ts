import Client from "./api_client/client";
import { Config as _Config, KwilConfig as _KwilConfig } from "./api_client/config";
import { Kwil as _Kwil } from "./client/kwil";
import { NodeKwil } from "./client/node/nodeKwil";
import { WebKwil } from "./client/web/webKwil";
import {
  ActionInput as _ActionInput,
  ActionBody as _ActionBody,
  CallBody as _CallBody,
  CallBodyNode as _CallBodyNode,
  NamedParams as _NamedParams,
  PositionalParams as _PositionalParams,
} from "./core/action";
import { AuthSuccess as _AuthSuccess, LogoutResponse as _LogoutResponse } from "./core/auth";
import {
  Database as _Database,
  Table as _Table,
  Column as _Column,
  Attribute as _Attribute,
  Index as _Index,
  ActionSchema as _ActionSchema,
  ForeignKey as _ForeignKey,
  ForeignKeyAction as _ForeignKeyAction,
  Extension as _Extension,
  ExtensionConfig as _ExtensionConfig,
  DeployBody as _DeployBody,
  DropBody as _DropBody,
  DataType as _DataType,
} from "./core/database";
import { EnvironmentType } from "./core/enums";
import { KwilSigner } from "./core/kwilSigner";
import { MsgReceipt as _MsgReceipt, Message as _Message } from "./core/message";
import {
  Account as _Account,
  DatasetInfo as _DatasetInfo,
  ChainInfo as _ChainInfo,
  ChainInfoOpts as _ChainInfoOpts,
} from "./core/network";
import { GenericResponse as _GenericResponse } from "./core/resreq";
import { AuthBody as _AuthBody } from "./core/signature";
import { EthSigner as _EthSigner } from "./core/signature";
import { TxReceipt as _TxReceipt } from "./core/tx";
import { Transaction as _Transaction } from "./core/tx";
import { TxResult as _TxResult, TxInfoReceipt as _TxInfoReceipt } from "./core/txQuery";
import { TransferBody as _TransferBody } from "./funder/funding_types";
import { generateDBID as _generateDBID } from "./utils/dbid";
import { QueryParams as _QueryParams, ValueType as _ValueType } from "./utils/types";

namespace Types {
  export type TxReceipt = _TxReceipt;
  export type MsgReceipt<T extends object> = _MsgReceipt<T>;
  export type ActionInput = _ActionInput;
  export type GenericResponse<T> = _GenericResponse<T>;
  export type TxResult = _TxResult;
  export type TxInfoReceipt = _TxInfoReceipt;
  export type Account = _Account;
  export type ActionBody = _ActionBody;
  export type CallBody = _CallBody;
  export type CallBodyNode = _CallBodyNode;
  export type QueryParams = _QueryParams;
  export type ChainInfo = _ChainInfo;
  export type ChainInfoOpts = _ChainInfoOpts;
  export type AuthSuccess<T extends EnvironmentType> = _AuthSuccess<T>;
  export type AuthBody = _AuthBody;
  export type LogoutResponse<T extends EnvironmentType> = _LogoutResponse<T>;
  export type TransferBody = _TransferBody;
  export type Config = _Config;
  export type KwilConfig = _KwilConfig;
  export type EthSigner = _EthSigner;
  export type Kwil<T extends EnvironmentType = EnvironmentType> = _Kwil<T>;
  export type NamedParams = _NamedParams;
  export type PositionalParams = _PositionalParams;
  export type ValueType = _ValueType;

  // below are deprecated and can be removed on next release (kwil-js v0.10)
  export type Database = _Database;
  export type Table = _Table;
  export type Column = _Column;
  export type Attribute = _Attribute;
  export type Index = _Index;
  export type ForeignKey = _ForeignKey;
  export type ForeignKeyAction = _ForeignKeyAction;
  export type ActionSchema = _ActionSchema;
  export type Extension = _Extension;
  export type ExtensionConfig = _ExtensionConfig;
  export type DeployBody = _DeployBody;
  export type DropBody = _DropBody;
  export type DatasetInfo = _DatasetInfo;
}

namespace Utils {
  /**
   * `ActionInput` class is a utility class for creating action inputs.
   * @deprecated This class is deprecated and will be removed in the next major release.  Please use the `params` instead.
   */
  export const ActionInput = _ActionInput;

  /**
   * Generates a unique database identifier (DBID) from the provided owner's public key and a database name.
   * @deprecated This function is deprecated and will be removed in the next major release.
   */
  export const generateDBID = _generateDBID;
  /**
   * `DataType` holds the different data types that can be asserted as action inputs.
   */
  export import DataType = _DataType;
}

export { NodeKwil, WebKwil, KwilSigner, Types, Utils, Client, EnvironmentType };
