import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { Queue } from 'bullmq';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { Lead } from './entities/lead.entity';
import { ConfigService } from '@nestjs/config';
export declare class LeadsService {
    private readonly leadRepository;
    private readonly httpService;
    private readonly leadQueue;
    private readonly configService;
    private readonly logger;
    constructor(leadRepository: Repository<Lead>, httpService: HttpService, leadQueue: Queue, configService: ConfigService);
    create(createLeadDto: CreateLeadDto): Promise<Lead>;
    findAll(): Promise<Lead[]>;
    findOne(id: string): Promise<Lead>;
    update(id: string, updateLeadDto: UpdateLeadDto): Promise<Lead>;
    requestSummary(id: string): Promise<{
        message: string;
        jobId: string;
    }>;
    synchronizeLeads(): Promise<void>;
}
