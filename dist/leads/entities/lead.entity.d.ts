export declare enum LeadSource {
    MANUAL = "manual",
    EXTERNAL = "external"
}
export declare class Lead {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    source: LeadSource;
    summary: string;
    next_action: string;
    external_id: string;
    created_at: Date;
    updated_at: Date;
}
