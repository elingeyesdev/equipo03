import { Gym } from './gym.entity';
export declare class GymLocation {
    id: number;
    gymId: number;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    gym: Gym;
}
