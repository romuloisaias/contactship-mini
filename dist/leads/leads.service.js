"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var LeadsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = require("@nestjs/axios");
const schedule_1 = require("@nestjs/schedule");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const rxjs_1 = require("rxjs");
const lead_entity_1 = require("./entities/lead.entity");
const config_1 = require("@nestjs/config");
let LeadsService = LeadsService_1 = class LeadsService {
    leadRepository;
    httpService;
    leadQueue;
    configService;
    logger = new common_1.Logger(LeadsService_1.name);
    constructor(leadRepository, httpService, leadQueue, configService) {
        this.leadRepository = leadRepository;
        this.httpService = httpService;
        this.leadQueue = leadQueue;
        this.configService = configService;
    }
    async create(createLeadDto) {
        try {
            this.logger.debug(`Checking existence of lead with email: ${createLeadDto.email}`);
            const existing = await this.leadRepository.findOne({ where: { email: createLeadDto.email } });
            if (existing) {
                this.logger.warn(`Attempt to create duplicate lead: ${createLeadDto.email}. Returning existing.`);
                return existing;
            }
            const lead = this.leadRepository.create({
                ...createLeadDto,
                source: createLeadDto.source || lead_entity_1.LeadSource.MANUAL,
            });
            const savedLead = await this.leadRepository.save(lead);
            this.logger.log(`Lead created successfully with ID: ${savedLead.id}`);
            return savedLead;
        }
        catch (error) {
            this.logger.error(`Error creating lead: ${error.message}`, error.stack);
            throw error;
        }
    }
    async findAll() {
        return this.leadRepository.find({ order: { created_at: 'DESC' } });
    }
    async findOne(id) {
        try {
            const lead = await this.leadRepository.findOne({ where: { id } });
            if (!lead) {
                this.logger.warn(`Lead not found with ID: ${id}`);
                throw new common_1.NotFoundException(`Lead with ID ${id} not found`);
            }
            return lead;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            this.logger.error(`Error finding lead ${id}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async update(id, updateLeadDto) {
        try {
            await this.leadRepository.update(id, updateLeadDto);
            this.logger.log(`Lead ${id} updated successfully`);
            return this.findOne(id);
        }
        catch (error) {
            this.logger.error(`Error updating lead ${id}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async requestSummary(id) {
        try {
            this.logger.log(`Processing summary request for lead ${id}`);
            const lead = await this.findOne(id);
            const job = await this.leadQueue.add('summarize-lead', {
                leadId: lead.id,
                leadData: {
                    firstName: lead.first_name,
                    lastName: lead.last_name,
                    email: lead.email,
                    source: lead.source,
                },
            });
            this.logger.log(`Job enqueued for lead ${id} with Job ID: ${job.id}`);
            return { message: 'Summary generation requested', jobId: job.id };
        }
        catch (error) {
            this.logger.error(`Failed to request summary for lead ${id}: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Could not queue summary request');
        }
    }
    async synchronizeLeads() {
        this.logger.log('Starting CRON: External leads synchronization...');
        const url = this.configService.get('RANDOM_USER_API_URL') || 'https://randomuser.me/api';
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params: { results: 10 } }));
            const results = response.data.results;
            this.logger.debug(`Fetched ${results.length} records from external API.`);
            let newCount = 0;
            let skippedCount = 0;
            for (const user of results) {
                const email = user.email;
                const externalId = user.login.uuid;
                const existing = await this.leadRepository.findOne({
                    where: [
                        { email: email },
                        { external_id: externalId }
                    ]
                });
                if (!existing) {
                    const newLead = this.leadRepository.create({
                        first_name: user.name.first,
                        last_name: user.name.last,
                        email: email,
                        phone: user.phone,
                        source: lead_entity_1.LeadSource.EXTERNAL,
                        external_id: externalId,
                    });
                    await this.leadRepository.save(newLead);
                    newCount++;
                }
                else {
                    skippedCount++;
                }
            }
            this.logger.log(`Synchronization complete. Imported: ${newCount}, Skipped (Duplicate): ${skippedCount}`);
        }
        catch (error) {
            this.logger.error(`CRON Synchronization failed: ${error.message}`, error.stack);
        }
    }
};
exports.LeadsService = LeadsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LeadsService.prototype, "synchronizeLeads", null);
exports.LeadsService = LeadsService = LeadsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(lead_entity_1.Lead)),
    __param(2, (0, bullmq_1.InjectQueue)('lead-processing')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        axios_1.HttpService,
        bullmq_2.Queue,
        config_1.ConfigService])
], LeadsService);
//# sourceMappingURL=leads.service.js.map