import "reflect-metadata";
import { base85ToFile, fileToBase85 } from "@idos-network/utils/codecs";
import { Transform, Type, instanceToPlain, plainToInstance } from "class-transformer";
import {
  IsDate,
  IsInstance,
  ValidateIf,
  ValidateNested,
  type ValidationError,
  getMetadataStorage,
  validateSync,
} from "class-validator";

/*
 * A credential subject travels the wire flat: every section is merged into one object with
 * its own name as a prefix (`person` + `firstName` -> `personFirstName`), while `root`
 * contributes its fields unprefixed. `@Section` records the mapping so both directions are
 * derived from the class instead of being generated or hand-written per version.
 */

const SECTIONS = Symbol("idos:sections");

type Ctor<T> = new () => T;

interface SectionMeta {
  property: string;
  prefix: string;
  type: () => Ctor<object>;
}

function flatKey(prefix: string, field: string): string {
  return prefix ? `${prefix}${field.charAt(0).toUpperCase()}${field.slice(1)}` : field;
}

/**
 * Declares a property as a flattened section, and wires up the nested class for
 * class-transformer and class-validator. Pass `prefix: ""` to keep the section's field
 * names as they are — that is what `root` does.
 *
 * Presence stays the caller's business: pair with `@IsDefined()` for a mandatory section
 * or `@IsOptional()` for an optional one.
 */
export function Section(type: () => Ctor<object>, prefix?: string): PropertyDecorator {
  return (target, propertyKey) => {
    const property = String(propertyKey);

    /*
     * Read inherited sections but define our own copy, so a subclass extending a subject
     * sees its parent's sections without mutating the parent's array.
     */
    const own = Reflect.getOwnMetadata(SECTIONS, target.constructor) as SectionMeta[] | undefined;
    const sections = own ?? [
      ...((Reflect.getMetadata(SECTIONS, target.constructor) as SectionMeta[] | undefined) ?? []),
    ];

    sections.push({ property, prefix: prefix ?? property, type });
    Reflect.defineMetadata(SECTIONS, sections, target.constructor);

    Type(type)(target, propertyKey);
    ValidateNested()(target, propertyKey);
  };
}

export function sectionsOf(cls: Ctor<object>): SectionMeta[] {
  return (Reflect.getMetadata(SECTIONS, cls) as SectionMeta[] | undefined) ?? [];
}

/**
 * The field names of a class, taken from its validation metadata — which is why every
 * field needs at least one validation decorator to survive a round trip. Inherited fields
 * are included.
 */
export function fieldsOf(cls: Ctor<object>): string[] {
  const metadata = getMetadataStorage().getTargetValidationMetadatas(cls, cls.name, true, false);

  return [...new Set(metadata.map((entry) => entry.propertyName))];
}

/**
 * Flattens an instance to its wire form. Classes declaring `@Section` properties merge
 * those sections in with their prefixes; anything else contributes its own fields.
 * Undefined values are dropped rather than emitted as explicit `undefined` keys.
 */
export function toFlat<T extends object>(instance: T): Record<string, unknown> {
  const plain = instanceToPlain(instance) as Record<string, unknown>;
  const sections = new Map(
    sectionsOf(instance.constructor as Ctor<object>).map(({ property, prefix }) => [
      property,
      prefix,
    ]),
  );
  const flat: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(plain)) {
    /*
     * A key the class declares as a section is merged in with its prefix; anything else is a
     * field of the class itself, like the subject's `id`, and travels as it is.
     */
    if (!sections.has(key)) {
      if (value !== undefined) flat[key] = value;
      continue;
    }

    if (!value) continue;

    const prefix = sections.get(key) as string;

    for (const [field, nested] of Object.entries(value as Record<string, unknown>)) {
      if (nested !== undefined) flat[flatKey(prefix, field)] = nested;
    }
  }

  return flat;
}

/** The flat wire keys a class accepts: its own fields, plus each section's prefixed fields. */
export function flatFieldsOf(cls: Ctor<object>): Set<string> {
  const sections = sectionsOf(cls);
  const sectionProperties = new Set(sections.map(({ property }) => property));
  const keys = fieldsOf(cls).filter((field) => !sectionProperties.has(field));

  for (const { prefix, type } of sections) {
    for (const field of fieldsOf(type())) keys.push(flatKey(prefix, field));
  }

  return new Set(keys);
}

/**
 * Rebuilds an instance from its wire form, the inverse of `toFlat`. Only keys the class
 * declares are read, so extras a credential happens to carry (`proof`, `@context`, an
 * unknown section) are dropped instead of landing on the instance.
 */
export function fromFlat<T extends object>(cls: Ctor<T>, flat: Record<string, unknown>): T {
  const sections = sectionsOf(cls);
  const sectionProperties = new Set(sections.map(({ property }) => property));
  const nested: Record<string, unknown> = {};

  // The class's own fields — everything it declares that is not a section, like a subject's `id`.
  for (const field of fieldsOf(cls)) {
    if (!sectionProperties.has(field) && Object.hasOwn(flat, field)) nested[field] = flat[field];
  }

  for (const { property, prefix, type } of sections) {
    const section: Record<string, unknown> = {};

    for (const field of fieldsOf(type())) {
      const key = flatKey(prefix, field);

      if (Object.hasOwn(flat, key)) section[field] = flat[key];
    }

    // An absent section stays absent — an empty object would validate as a broken section.
    if (Object.keys(section).length > 0) nested[property] = section;
  }

  return plainToInstance(cls, nested);
}

/**
 * Builds an instance from the subset of a class's fields a caller passed, applying the class's
 * `toClassOnly` transforms — so either form of a value is accepted: an ISO string or a `Date`,
 * ascii85 or a `Buffer`.
 *
 * Fields the caller left out stay absent rather than becoming an explicit `undefined`, which
 * would overwrite a section already added.
 */
export function toClass<T extends object>(cls: Ctor<T>, fields: object): Partial<T> {
  const instance = plainToInstance(cls, fields) as Record<string, unknown>;

  return Object.fromEntries(Object.keys(fields).map((key) => [key, instance[key]])) as Partial<T>;
}

function describe(errors: ValidationError[], path = ""): string[] {
  return errors.flatMap((error) => {
    const at = path ? `${path}.${error.property}` : error.property;

    return [
      ...Object.values(error.constraints ?? {}).map((message) => `${at}: ${message}`),
      ...describe(error.children ?? [], at),
    ];
  });
}

export class CredentialValidationError extends Error {
  override readonly name = "CredentialValidationError";

  constructor(
    label: string,
    readonly errors: ValidationError[],
  ) {
    super(`Invalid ${label}: ${describe(errors).join("; ")}`);
  }
}

/** Throws `CredentialValidationError` unless `instance` and its sections are valid. */
export function assertValid(label: string, instance: object): void {
  const errors = validateSync(instance);

  if (errors.length > 0) throw new CredentialValidationError(label, errors);
}

/**
 * Validates this property when `predicate` holds, and whenever it carries a value — so a
 * conditionally required field is still type-checked when the condition is off.
 *
 * Do not combine with `@IsOptional()`: that skips every validator on an absent value,
 * including this one.
 */
export function RequiredWhen(predicate: (object: any) => boolean): PropertyDecorator {
  return (target, propertyKey) =>
    ValidateIf(
      (object: Record<string, unknown>) =>
        predicate(object) || object[String(propertyKey)] !== undefined,
    )(target, propertyKey);
}

/** `RequiredWhen`, for the common case of a field required by the presence of another. */
export function RequiredWith(property: string): PropertyDecorator {
  return RequiredWhen((object: Record<string, unknown>) => object[property] !== undefined);
}

/*
 * Codecs: the encoded side is what a serialized credential carries, the decoded side is
 * what a subject holds. A field declares its representation once, and neither direction
 * inspects value types at serialization time.
 */

function decorate(...decorators: PropertyDecorator[]): PropertyDecorator {
  return (target, propertyKey) => {
    for (const decorator of decorators) decorator(target, propertyKey);
  };
}

/** A date carried as an ISO 8601 string on the wire, held as a `Date` in a subject. */
export function IsoDateField(): PropertyDecorator {
  return decorate(
    Transform(({ value }) => (value instanceof Date ? value.toISOString() : value), {
      toPlainOnly: true,
    }),
    Transform(({ value }) => (typeof value === "string" ? new Date(value) : value), {
      toClassOnly: true,
    }),
    // `new Date("nonsense")` yields an Invalid Date, which `IsDate` rejects.
    IsDate(),
  );
}

/** `fileToBase85` always emits delimited ascii85; `base85.decode` accepts anything. */
const ASCII85_FRAMED = /^<~[\s\S]*~>$/;

/** A file carried as ascii85 on the wire, held as a `Buffer` in a subject. */
export function Base85FileField(): PropertyDecorator {
  return decorate(
    Transform(({ value }) => (Buffer.isBuffer(value) ? fileToBase85(value) : value), {
      toPlainOnly: true,
    }),
    /*
     * Undecodable input is handed on untouched so `IsInstance` reports it, rather than
     * being turned into a `false` that reads like an intentional value.
     */
    Transform(
      ({ value }) => {
        if (typeof value !== "string" || !ASCII85_FRAMED.test(value)) return value;

        return base85ToFile(value) || value;
      },
      { toClassOnly: true },
    ),
    IsInstance(Buffer, {
      message: ({ property }) => `${property} must be a file encoded as delimited ascii85`,
    }),
  );
}
