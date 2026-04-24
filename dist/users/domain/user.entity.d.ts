import { UserProfile } from './user-profile.entity';
import { UserRole } from '../../roles/domain/user-role.entity';
import { EmergencyContact } from '../../training/domain/emergency-contact.entity';
export declare class User {
    id: number;
    email: string;
    passwordHash: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    profile: UserProfile;
    userRoles: UserRole[];
    emergencyContacts: EmergencyContact[];
}
