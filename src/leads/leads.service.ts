import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { firstValueFrom } from 'rxjs';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { Lead, LeadSource } from './entities/lead.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    private readonly httpService: HttpService,
    @InjectQueue('lead-processing') private readonly leadQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  async create(createLeadDto: CreateLeadDto): Promise<Lead> {
    try {
      this.logger.debug(`Checking existence of lead with email: ${createLeadDto.email}`);
      const existing = await this.leadRepository.findOne({ where: { email: createLeadDto.email } });
      
      if (existing) {
        this.logger.warn(`Attempt to create duplicate lead: ${createLeadDto.email}. Returning existing.`);
        return existing;
      }

      const lead = this.leadRepository.create({
        ...createLeadDto,
        source: createLeadDto.source || LeadSource.MANUAL,
      });
      
      const savedLead = await this.leadRepository.save(lead);
      this.logger.log(`Lead created successfully with ID: ${savedLead.id}`);
      return savedLead;
    } catch (error) {
      this.logger.error(`Error creating lead: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(): Promise<Lead[]> {
    return this.leadRepository.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: string): Promise<Lead> {
    try {
      const lead = await this.leadRepository.findOne({ where: { id } });
      if (!lead) {
        this.logger.warn(`Lead not found with ID: ${id}`);
        throw new NotFoundException(`Lead with ID ${id} not found`);
      }
      return lead;
    } catch (error) {
        if (error instanceof NotFoundException) throw error;
        this.logger.error(`Error finding lead ${id}: ${error.message}`, error.stack);
        throw error;
    }
  }

  async update(id: string, updateLeadDto: UpdateLeadDto): Promise<Lead> {
    try {
        await this.leadRepository.update(id, updateLeadDto);
        this.logger.log(`Lead ${id} updated successfully`);
        return this.findOne(id);
    } catch (error) {
        this.logger.error(`Error updating lead ${id}: ${error.message}`, error.stack);
        throw error;
    }
  }

  // --- AI Summary Queue Producer ---
  async requestSummary(id: string): Promise<{ message: string; jobId: string }> {
    try {
      this.logger.log(`Processing summary request for lead ${id}`);
      const lead = await this.findOne(id); // Validate exists
      
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
      return { message: 'Summary generation requested', jobId: job.id! };
    } catch (error) {
      this.logger.error(`Failed to request summary for lead ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Could not queue summary request');
    }
  }

  // --- External Sync (Cron) ---
  @Cron(CronExpression.EVERY_HOUR)
  async synchronizeLeads() {
    this.logger.log('Starting CRON: External leads synchronization...');
    const url = this.configService.get<string>('RANDOM_USER_API_URL') || 'https://randomuser.me/api';
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { params: { results: 10 } })
      );
      
      const results = response.data.results;
      this.logger.debug(`Fetched ${results.length} records from external API.`);
      
      let newCount = 0;
      let skippedCount = 0;

      for (const user of results) {
        const email = user.email;
        const externalId = user.login.uuid;

        // Deduplication Strategy
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
            source: LeadSource.EXTERNAL,
            external_id: externalId,
          });
          await this.leadRepository.save(newLead);
          newCount++;
        } else {
            skippedCount++;
        }
      }

      this.logger.log(`Synchronization complete. Imported: ${newCount}, Skipped (Duplicate): ${skippedCount}`);
    } catch (error) {
      this.logger.error(`CRON Synchronization failed: ${error.message}`, error.stack);
    }
  }
}
