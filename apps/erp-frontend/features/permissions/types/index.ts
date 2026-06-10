export interface PermissionListItem {
  id: string;
  name: string;
  slug: string;
  module: string;
  action: string;
  description: string;
  rolesCount: number;
  createdAt: string;
}

export interface PermissionStats {
  total: number;
  system: number;
  user: number;
  role: number;
  permission: number;
  unused: number;
}

export interface PermissionFormData {
  name: string;
  slug: string;
  module: string;
  description: string;
}
