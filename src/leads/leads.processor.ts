import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { LeadsService } from './leads.service';

@Processor('lead-processing')
export class LeadsProcessor extends WorkerHost {
  private readonly logger = new Logger(LeadsProcessor.name);
  private openai: OpenAI | null = null;

  constructor(
    private readonly leadsService: LeadsService,
    private readonly configService: ConfigService,
  ) {
    super();
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('OpenAI client initialized with API Key.');
    } else {
      this.logger.warn('OpenAI API Key not found. Using Mock mode.');
    }
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`[Job ${job.id}] Started processing: Generating summary for lead ${job.data.leadId}`);
    
    const { leadId, leadData } = job.data;
    
    try {
      const result = await this.generateAiSummary(leadData);
      
      this.logger.debug(`[Job ${job.id}] AI Result obtained. Updating lead...`);

      // Update the Lead entity
      await this.leadsService.update(leadId, {
        summary: result.summary,
        next_action: result.next_action,
      });

      this.logger.log(`[Job ${job.id}] Completed successfully. Lead updated.`);
      return result;
    } catch (error) {
      this.logger.error(`[Job ${job.id}] FAILED: ${error.message}`, error.stack);
      // Re-throwing ensures BullMQ marks it as failed and can retry if configured
      throw error;
    }
  }

  private async generateAiSummary(leadData: any): Promise<{ summary: string; next_action: string }> {
    const prompt = `
      Analyze the following lead data:
      Name: ${leadData.firstName} ${leadData.lastName}
      Email: ${leadData.email}
      Source: ${leadData.source}

      Generate a brief professional summary and a suggested next action.
      Return strictly a JSON object with keys "summary" and "next_action".
    `;

    if (this.openai) {
      try {
        this.logger.debug('Calling OpenAI API...');
        const completion = await this.openai.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'gpt-3.5-turbo',
        });

        const content = completion.choices[0].message.content;
        this.logger.debug(`OpenAI Response: ${content}`);
        
        try {
            return JSON.parse(content || '{}');
        } catch (e) {
             this.logger.error('Failed to parse OpenAI response JSON', e.stack);
             return {
                 summary: content || "Summary generated (Parse Error)",
                 next_action: "Check lead details manually"
             };
        }
      } catch (e) {
        this.logger.error('OpenAI API call failed', e.stack);
        this.logger.warn('Falling back to mock due to API error.');
        // Fallthrough to mock
      }
    }

    // Mock fallback
    return {
      summary: `[MOCK] This is a ${leadData.source} lead named ${leadData.firstName}. Potential high value customer based on profile.`,
      next_action: `[MOCK] Send introductory email to ${leadData.email} and schedule a call.`,
    };
  }
}