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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var LeadsProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadsProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = __importDefault(require("openai"));
const leads_service_1 = require("./leads.service");
let LeadsProcessor = LeadsProcessor_1 = class LeadsProcessor extends bullmq_1.WorkerHost {
    leadsService;
    configService;
    logger = new common_1.Logger(LeadsProcessor_1.name);
    openai = null;
    constructor(leadsService, configService) {
        super();
        this.leadsService = leadsService;
        this.configService = configService;
        const apiKey = this.configService.get('OPENAI_API_KEY');
        if (apiKey) {
            this.openai = new openai_1.default({ apiKey });
            this.logger.log('OpenAI client initialized with API Key.');
        }
        else {
            this.logger.warn('OpenAI API Key not found. Using Mock mode.');
        }
    }
    async process(job) {
        this.logger.log(`[Job ${job.id}] Started processing: Generating summary for lead ${job.data.leadId}`);
        const { leadId, leadData } = job.data;
        try {
            const result = await this.generateAiSummary(leadData);
            this.logger.debug(`[Job ${job.id}] AI Result obtained. Updating lead...`);
            await this.leadsService.update(leadId, {
                summary: result.summary,
                next_action: result.next_action,
            });
            this.logger.log(`[Job ${job.id}] Completed successfully. Lead updated.`);
            return result;
        }
        catch (error) {
            this.logger.error(`[Job ${job.id}] FAILED: ${error.message}`, error.stack);
            throw error;
        }
    }
    async generateAiSummary(leadData) {
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
                }
                catch (e) {
                    this.logger.error('Failed to parse OpenAI response JSON', e.stack);
                    return {
                        summary: content || "Summary generated (Parse Error)",
                        next_action: "Check lead details manually"
                    };
                }
            }
            catch (e) {
                this.logger.error('OpenAI API call failed', e.stack);
                this.logger.warn('Falling back to mock due to API error.');
            }
        }
        return {
            summary: `[MOCK] This is a ${leadData.source} lead named ${leadData.firstName}. Potential high value customer based on profile.`,
            next_action: `[MOCK] Send introductory email to ${leadData.email} and schedule a call.`,
        };
    }
};
exports.LeadsProcessor = LeadsProcessor;
exports.LeadsProcessor = LeadsProcessor = LeadsProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('lead-processing'),
    __metadata("design:paramtypes", [leads_service_1.LeadsService,
        config_1.ConfigService])
], LeadsProcessor);
//# sourceMappingURL=leads.processor.js.map