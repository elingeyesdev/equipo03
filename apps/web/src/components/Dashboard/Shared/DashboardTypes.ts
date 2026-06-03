
export type GymScheduleDto = {
  id: number;
  gymId: number;
  dayOfWeek: string;
  opensAt: string;
  closesAt: string;
  isHoliday: boolean;
};

export type GymDto = {
  id: number;
  name: string;
  description?: string;
  maxCapacity?: number;
  isActive?: boolean;
  isOpen?: boolean;
  aforoActual?: number;
  parentId?: number | null;
  parent?: {
    id: number;
    name: string;
  };
  location?: {
    address?: string;
    city?: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  schedules?: GymScheduleDto[];
};

export type UserRoleDto = {
  roleId: number;
  gym?: { id: number; name?: string; parent?: { id: number; name?: string } } | null;
  role?: { name?: string } | null;
};

export type UserDto = {
  id: number;
  email: string;
  isActive?: boolean;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    ci?: string;
  };
  userRoles?: UserRoleDto[];
  gyms?: Array<{
    id: number;
    name?: string;
  }>;
  gymsMap?: Map<number, string>;
};

export type CheckinDto = {
  id: number;
  userId: number;
  gymId: number;
  status: string;
};

export type ScheduleEntry = { 
  id?: number; 
  dayOfWeek: string; 
  opensAt: string; 
  closesAt: string; 
  isHoliday: boolean; 
  _isNew?: boolean 
};
