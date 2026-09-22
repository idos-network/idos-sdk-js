import { ParamsTypes } from "../core/action";
import { DataInfo } from "../core/database";
import { VarType } from "../core/enums";
import { EncodedParameterValue, EncodedValue } from "../core/payload";
import { bytesToBase64 } from "./base64";
import { encodeValue } from "./kwilEncoding";
import { Base64String, EncodedQueryParams, QueryParams, ValueType } from "./types";
import { isUuid } from "./uuid";

// Used by the selectQuery() method
export function encodeParameters(params: QueryParams): EncodedQueryParams {
  const encodedParams: EncodedQueryParams = {};
  Object.entries(params).forEach(([key, value]) => {
    encodedParams[key] = formatEncodedValueBase64(value);
  });
  return encodedParams;
}

// The selectQuery() method uses base64 encoding for the values here because they are not encoded into a base64 payload string when sent to the server
function formatEncodedValueBase64(val: ValueType | ValueType[]): EncodedParameterValue {
  const base = formatDataType(val);

  // If the value is an array, we need to encode each value in the array
  if (Array.isArray(val)) {
    const encodedValues: Base64String[] = [];
    for (const v of val) {
      encodedValues.push(bytesToBase64(encodeValue(v)));
    }
    return {
      type: base.type,
      data: encodedValues,
    };
  }
  return {
    type: base.type,
    data: [bytesToBase64(encodeValue(base.data))],
  };
}

// Used by the executeSql() method
// The executeSql() method has the entire payload encoded into a base64 string when being sent to the server
// And the structure of the parameters is different as we have name (of the parameter) and value which is not the same as selectQuery()
export function encodeRawStatementParameters(params: QueryParams) {
  return Object.entries(params).map(([key, value]) => {
    const encodedValue = formatEncodedValue(value);

    return {
      name: key,
      value: encodedValue,
    };
  });
}

// Used by the executeSql() method and the encodeActionInputs() method
function formatEncodedValue(val: ValueType | ValueType[], o?: DataInfo): EncodedValue {
  const base = formatDataType(val, o);

  if (Array.isArray(val)) {
    const encodedValues: Uint8Array[] = [];
    for (const v of val) {
      encodedValues.push(encodeValue(v, o?.name));
    }

    return {
      type: base.type,
      data: encodedValues,
    };
  }

  return {
    type: base.type,
    data: [encodeValue(base.data, o?.name)],
  };
}

/**
 * Used when encoding values for an action
 * @param {ValueType[]} values - An array of input values to be executed by an action.
 * @returns formatted values used for an action
 */
export function encodeValueType(values: ParamsTypes[]): EncodedValue[] {
  return values.map((val) => formatEncodedValue(val.v, val.o));
}

function formatDataType(
  val: ValueType | ValueType[],
  o?: DataInfo,
): {
  type: DataInfo;
  data: ValueType;
} {
  // handle override case
  if (o) {
    return {
      type: o,
      data: val,
    };
  }

  const { metadata, varType } = resolveValueType(val);

  const dataType: DataInfo = {
    name: varType,
    is_array: Array.isArray(val),
    metadata,
  };

  return { type: dataType, data: val };
}

export function analyzeNumber(num: number) {
  // Convert the number to a string and handle potential negative sign
  const numStr = Math.abs(num).toString();

  const decimalIndex = numStr.indexOf(".");
  const hasDecimal = decimalIndex !== -1;

  // Precision represents the total number of digits (excluding the decimal point)
  const precision = hasDecimal ? numStr.length - 1 : numStr.length;
  // Scale represents the number of digits after the decimal point
  const scale = hasDecimal ? numStr.length - decimalIndex - 1 : 0;

  // e.g. 123.456
  // precision = 6
  // scale = 3

  return {
    hasDecimal,
    precision,
    scale,
  };
}

export function resolveValueType(value: ValueType | ValueType[]): {
  metadata: [number, number];
  varType: VarType;
} {
  if (Array.isArray(value)) {
    // In Kwil, if there is an array of values, each value in the array must be of the same type.
    return resolveValueType(value[0]);
  }

  let metadata: [number, number] = [0, 0];
  // Default to text string
  // Only other types are null or blob. For client-side tooling, everything else can be sent as a string, and Kwil will handle the conversion.
  let varType: VarType = VarType.TEXT;

  switch (typeof value) {
    case "string":
      if (isUuid(value)) {
        varType = VarType.UUID;
      }
      break;
    case "number":
      const numAnalysis = analyzeNumber(value);

      return {
        metadata: [numAnalysis.precision, numAnalysis.scale],
        varType: numAnalysis.hasDecimal ? VarType.NUMERIC : VarType.INT8,
      };
    case "boolean":
      varType = VarType.BOOL;
      break;
    case "object":
      if (value instanceof Uint8Array) {
        varType = VarType.BYTEA;
        break;
      }
      if (value === null) {
        varType = VarType.NULL;
        break;
      }
    case "undefined":
      varType = VarType.NULL;
      break;
    default:
      throw new Error(
        `Unsupported type: ${typeof value}. If using a uuid, blob, or uint256, please convert to a JavaScript string.`,
      );
  }

  return {
    metadata,
    varType,
  };
}
