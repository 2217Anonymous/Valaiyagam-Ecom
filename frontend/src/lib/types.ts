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

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CategoryTreeNode = Category & {
  children: CategoryTreeNode[];
};

export type CategoryInput = {
  name: string;
  slug?: string;
  description?: string;
  parent_id?: number | null;
  is_active?: boolean;
  sort_order?: number;
};
