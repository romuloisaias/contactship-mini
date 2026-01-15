import { Controller, Get, Post, Body, Param, UseInterceptors, Logger } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiParam } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';

@ApiTags('leads')
@ApiSecurity('x-api-key') // Applies security schema to all endpoints in this controller
@Controller('leads')
export class LeadsController {
  private readonly logger = new Logger(LeadsController.name);

  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lead manually' })
  @ApiResponse({ status: 201, description: 'The lead has been successfully created.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Invalid API Key.' })
  create(@Body() createLeadDto: CreateLeadDto) {
    this.logger.log(`Received request to create lead: ${createLeadDto.email}`);
    return this.leadsService.create(createLeadDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all leads' })
  @ApiResponse({ status: 200, description: 'Return all leads.' })
  findAll() {
    this.logger.log('Received request to list all leads');
    return this.leadsService.findAll();
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000)
  @ApiOperation({ summary: 'Get lead details by ID' })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({ status: 200, description: 'Return the lead details.' })
  @ApiResponse({ status: 404, description: 'Lead not found.' })
  findOne(@Param('id') id: string) {
    this.logger.log(`Received request to get lead details for ID: ${id}`);
    return this.leadsService.findOne(id);
  }

  @Post(':id/summarize')
  @ApiOperation({ summary: 'Request AI summary generation for a lead' })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({ status: 201, description: 'Summary generation requested (queued).' })
  requestSummary(@Param('id') id: string) {
    this.logger.log(`Received request to generate summary for lead ID: ${id}`);
    return this.leadsService.requestSummary(id);
  }
}