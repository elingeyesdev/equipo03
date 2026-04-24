export declare class CreateTemplateDto {
    type: string;
    subject: string;
    bodyTemplate: string;
    channel?: string;
}
export declare class SendNotificationDto {
    userId: number;
    templateId?: number;
    title: string;
    message: string;
    channel?: string;
}
export declare class UpdatePreferencesDto {
    emailEnabled?: boolean;
    pushEnabled?: boolean;
    smsEnabled?: boolean;
    marketingEnabled?: boolean;
}
