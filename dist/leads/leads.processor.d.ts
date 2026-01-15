import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { LeadsService } from './leads.service';
export declare class LeadsProcessor extends WorkerHost {
    private readonly leadsService;
    private readonly configService;
    private readonly logger;
    private openai;
    constructor(leadsService: LeadsService, configService: ConfigService);
    process(job: Job<any, any, string>): Promise<any>;
    private generateAiSummary;
}
