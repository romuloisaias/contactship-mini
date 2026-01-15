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
var LeadsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadsController = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const swagger_1 = require("@nestjs/swagger");
const leads_service_1 = require("./leads.service");
const create_lead_dto_1 = require("./dto/create-lead.dto");
let LeadsController = LeadsController_1 = class LeadsController {
    leadsService;
    logger = new common_1.Logger(LeadsController_1.name);
    constructor(leadsService) {
        this.leadsService = leadsService;
    }
    create(createLeadDto) {
        this.logger.log(`Received request to create lead: ${createLeadDto.email}`);
        return this.leadsService.create(createLeadDto);
    }
    findAll() {
        this.logger.log('Received request to list all leads');
        return this.leadsService.findAll();
    }
    findOne(id) {
        this.logger.log(`Received request to get lead details for ID: ${id}`);
        return this.leadsService.findOne(id);
    }
    requestSummary(id) {
        this.logger.log(`Received request to generate summary for lead ID: ${id}`);
        return this.leadsService.requestSummary(id);
    }
};
exports.LeadsController = LeadsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new lead manually' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'The lead has been successfully created.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden. Invalid API Key.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lead_dto_1.CreateLeadDto]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all leads' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return all leads.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, cache_manager_1.CacheTTL)(300000),
    (0, swagger_1.ApiOperation)({ summary: 'Get lead details by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Lead UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return the lead details.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Lead not found.' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/summarize'),
    (0, swagger_1.ApiOperation)({ summary: 'Request AI summary generation for a lead' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Lead UUID' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Summary generation requested (queued).' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "requestSummary", null);
exports.LeadsController = LeadsController = LeadsController_1 = __decorate([
    (0, swagger_1.ApiTags)('leads'),
    (0, swagger_1.ApiSecurity)('x-api-key'),
    (0, common_1.Controller)('leads'),
    __metadata("design:paramtypes", [leads_service_1.LeadsService])
], LeadsController);
//# sourceMappingURL=leads.controller.js.map