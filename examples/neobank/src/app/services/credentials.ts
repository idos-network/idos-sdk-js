export const fetchSharedCredential = (userId: string) => {
  return fetch(`/api/shared-credential?userId=${userId}`).then((res) => res.json());
};
