// src/app/core/models/user.model.ts
export interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  role: 'USER' | 'ADMIN';
  created_at: string;
  updated_at: string;
}
