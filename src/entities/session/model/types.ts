export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type SessionResponse = {
  user: AuthUser;
};

export type SessionState = {
  user: AuthUser | null;
};
