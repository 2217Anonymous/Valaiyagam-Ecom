export type Role = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
};

export type User = {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  roles: Role[];
  created_at: string;
  updated_at: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export type CreateUserInput = {
  email: string;
  full_name: string;
  password: string;
  role_ids: number[];
};
