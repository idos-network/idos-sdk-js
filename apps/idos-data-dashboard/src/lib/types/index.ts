export function castToType<T>(value: unknown) {
  return value as T;
}

export type HumanId = {
  human_id: string;
};

export type Grant = {
  owner: string;
  grantee: string;
  dataId: string;
};
