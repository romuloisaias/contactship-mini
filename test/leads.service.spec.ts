import { Test, TestingModule } from '@nestjs/testing';
import { LeadsService } from './leads.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Lead, LeadSource } from './entities/lead.entity';
import { HttpService } from '@nestjs/axios';
import { getQueueToken } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { NotFoundException } from '@nestjs/common';

describe('LeadsService', () => {
  let service: LeadsService;
  let repository: any;
  let httpService: any;
  let queue: any;

  // Mock Data
  const mockLead = {
    id: 'uuid-123',
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    source: LeadSource.MANUAL,
    created_at: new Date(),
  };

  const mockRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((lead) => Promise.resolve({ id: 'uuid-123', ...lead })),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key) => {
      if (key === 'RANDOM_USER_API_URL') return 'https://api.mock.com';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        {
          provide: getRepositoryToken(Lead),
          useValue: mockRepository,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: getQueueToken('lead-processing'),
          useValue: mockQueue,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
    repository = module.get(getRepositoryToken(Lead));
    httpService = module.get(HttpService);
    queue = module.get(getQueueToken('lead-processing'));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new lead if it does not exist', async () => {
      repository.findOne.mockResolvedValue(null);
      
      const dto = { first_name: 'John', last_name: 'Doe', email: 'john@doe.com' };
      const result = await service.create(dto as any);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { email: dto.email } });
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({ email: 'john@doe.com' }));
    });

    it('should return existing lead if email already exists', async () => {
      repository.findOne.mockResolvedValue(mockLead);
      
      const dto = { first_name: 'Test', last_name: 'User', email: 'test@example.com' };
      const result = await service.create(dto as any);

      expect(repository.findOne).toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
      expect(result).toEqual(mockLead);
    });
  });

  describe('findOne', () => {
    it('should return a lead by ID', async () => {
      repository.findOne.mockResolvedValue(mockLead);
      const result = await service.findOne('uuid-123');
      expect(result).toEqual(mockLead);
    });

    it('should throw NotFoundException if lead not found', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('requestSummary', () => {
    it('should add a job to the queue if lead exists', async () => {
      repository.findOne.mockResolvedValue(mockLead);
      mockQueue.add.mockResolvedValue({ id: 'job-1' });

      const result = await service.requestSummary('uuid-123');

      expect(queue.add).toHaveBeenCalledWith('summarize-lead', expect.objectContaining({
        leadId: mockLead.id,
        leadData: expect.objectContaining({ email: mockLead.email })
      }));
      expect(result).toEqual({ message: 'Summary generation requested', jobId: 'job-1' });
    });
  });

  describe('synchronizeLeads', () => {
    it('should fetch from external API and save new leads', async () => {
      const mockExternalResponse = {
        data: {
          results: [
            {
              name: { first: 'External', last: 'User' },
              email: 'external@api.com',
              phone: '123456',
              login: { uuid: 'ext-uuid-1' }
            }
          ]
        }
      };

      httpService.get.mockReturnValue(of(mockExternalResponse));
      repository.findOne.mockResolvedValue(null); // No duplicates found

      await service.synchronizeLeads();

      expect(httpService.get).toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
        source: LeadSource.EXTERNAL,
        email: 'external@api.com',
        external_id: 'ext-uuid-1'
      }));
      expect(repository.save).toHaveBeenCalled();
    });

    it('should skip duplicates during synchronization', async () => {
        const mockExternalResponse = {
          data: {
            results: [
              {
                name: { first: 'External', last: 'User' },
                email: 'existing@api.com',
                phone: '123456',
                login: { uuid: 'ext-uuid-1' }
              }
            ]
          }
        };
  
        httpService.get.mockReturnValue(of(mockExternalResponse));
        repository.findOne.mockResolvedValue(mockLead); // Found duplicate
  
        await service.synchronizeLeads();
  
        expect(httpService.get).toHaveBeenCalled();
        expect(repository.create).not.toHaveBeenCalled();
        expect(repository.save).not.toHaveBeenCalled();
      });
  });
});
