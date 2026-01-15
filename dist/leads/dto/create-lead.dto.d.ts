import { LeadSource } from '../entities/lead.entity';
export declare class CreateLeadDto {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    source?: LeadSource;
    summary?: string;
    next_action?: string;
}
