import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
export declare class LeadsController {
    private readonly leadsService;
    private readonly logger;
    constructor(leadsService: LeadsService);
    create(createLeadDto: CreateLeadDto): Promise<import("./entities/lead.entity").Lead>;
    findAll(): Promise<import("./entities/lead.entity").Lead[]>;
    findOne(id: string): Promise<import("./entities/lead.entity").Lead>;
    requestSummary(id: string): Promise<{
        message: string;
        jobId: string;
    }>;
}
