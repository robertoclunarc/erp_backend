export interface IUser {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  full_name: string;
  role_id: number;
  status: 'active' | 'inactive';
  created_by: number;
  created_at: Date;
  updated_by: number;
  updated_at: Date;
  branches?: number[];
}

export interface IUserWithBranches extends IUser {
  branches: number[]; // IDs de sucursales asignadas
}

export interface ICreateUser {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role_id: number;
  branches: number[];
  created_by: number;
}

export interface ILoginRequest {
  username: string;
  password: string;
}