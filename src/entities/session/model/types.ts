export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

export type SessionResponse = {
  user: SessionUser;
};
