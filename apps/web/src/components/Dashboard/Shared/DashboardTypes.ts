
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
  currentOccupancy?: number;
  infrastructure?: { id?: number; machineCapacity?: number } | null;
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
  gymId?: number | null;
  gym?: { id: number; name?: string; parentId?: number | null; parent?: { id: number; name?: string } } | null;
  role?: { id?: number; name?: string; hierarchyLevel?: number } | null;
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
