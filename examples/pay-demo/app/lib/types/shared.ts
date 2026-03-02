export type Country = {
  code: string;
  name: string;
  flag: string;
  currency: string;
};

export type JsonSchemaProperty = {
  type?: string;
  title?: string;
  enum?: string[];
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
};

export type JsonSchema = {
  $schema: string;
  type: string;
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
};

export type OnRampProviderId = "noah" | "hifi" | "transak";

export type Asset = {
  id: string;
  name: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
};
