import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PredictionService } from './prediction.service';
import { PredictionValidationService } from './prediction-validation.service';
import { Prediction } from '../../../database/entities/prediction.entity';
import { PredictionResult } from '../../../database/entities/prediction-result.entity';
import { User } from '../../../database/entities/user.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('PredictionService', () => {
  let service: PredictionService;
  let repository: jest.Mocked<Repository<Prediction>>;
  let validationService: jest.Mocked<PredictionValidationService>;

  const mockGroups = {
    A: [['uuid1'], ['uuid2'], ['uuid3'], ['uuid4']],
    B: [['uuid5'], ['uuid6'], ['uuid7'], ['uuid8']],
    C: [['uuid9'], ['uuid10'], ['uuid11'], ['uuid12']],
    D: [['uuid13'], ['uuid14'], ['uuid15'], ['uuid16']],
    E: [['uuid17'], ['uuid18'], ['uuid19'], ['uuid20']],
    F: [['uuid21'], ['uuid22'], ['uuid23'], ['uuid24']],
    G: [['uuid25'], ['uuid26'], ['uuid27'], ['uuid28']],
    H: [['uuid29'], ['uuid30'], ['uuid31'], ['uuid32']],
    I: [['uuid33'], ['uuid34'], ['uuid35'], ['uuid36']],
    J: [['uuid37'], ['uuid38'], ['uuid39'], ['uuid40']],
    K: [['uuid41'], ['uuid42'], ['uuid43'], ['uuid44']],
    L: [['uuid45'], ['uuid46'], ['uuid47'], ['uuid48']],
  };

  const mockPrediction: Prediction = {
    id: 'prediction-uuid',
    user_id: 'user-uuid',
    predict: mockGroups,
    is_finalized: false,
    submitted_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    user: null as unknown as User,
    results: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PredictionService,
        {
          provide: getRepositoryToken(Prediction),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PredictionResult),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
        {
          provide: PredictionValidationService,
          useValue: {
            validatePrediction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PredictionService>(PredictionService);
    repository = module.get(getRepositoryToken(Prediction));
    validationService = module.get(PredictionValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitPrediction', () => {
    it('should create new prediction', async () => {
      validationService.validatePrediction.mockResolvedValue(undefined);
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockPrediction);
      repository.save.mockResolvedValue(mockPrediction);

      const result = await service.submitPrediction('user-uuid', mockGroups);

      expect(result).toEqual(mockPrediction);
      expect(validationService.validatePrediction).toHaveBeenCalledWith(
        mockGroups,
      );
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });

    it('should update existing prediction', async () => {
      const existingPrediction = { ...mockPrediction };

      validationService.validatePrediction.mockResolvedValue(undefined);
      repository.findOne.mockResolvedValue(existingPrediction);
      repository.save.mockResolvedValue(existingPrediction);

      const result = await service.submitPrediction('user-uuid', mockGroups);

      expect(result).toBeDefined();
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw error if prediction is finalized', async () => {
      const finalizedPrediction = { ...mockPrediction, is_finalized: true };

      repository.findOne.mockResolvedValue(finalizedPrediction);

      await expect(
        service.submitPrediction('user-uuid', mockGroups),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('finalizePrediction', () => {
    it('should finalize prediction', async () => {
      const draftPrediction = { ...mockPrediction, is_finalized: false };

      validationService.validatePrediction.mockResolvedValue(undefined);
      repository.findOne.mockResolvedValue(draftPrediction);
      repository.save.mockResolvedValue({
        ...draftPrediction,
        is_finalized: true,
      });

      const result = await service.finalizePrediction('user-uuid');

      expect(result.is_finalized).toBe(true);
      expect(result.submitted_at).toBeDefined();
    });

    it('should throw error if no prediction found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.finalizePrediction('user-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error if already finalized', async () => {
      const finalizedPrediction = { ...mockPrediction, is_finalized: true };

      repository.findOne.mockResolvedValue(finalizedPrediction);

      await expect(service.finalizePrediction('user-uuid')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getUserPrediction', () => {
    it('should return user prediction', async () => {
      repository.findOne.mockResolvedValue(mockPrediction);

      const result = await service.getUserPrediction('user-uuid');

      expect(result).toEqual(mockPrediction);
    });

    it('should return null if no prediction', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.getUserPrediction('user-uuid');

      expect(result).toBeNull();
    });
  });

  describe('deletePrediction', () => {
    it('should delete draft prediction', async () => {
      repository.findOne.mockResolvedValue(mockPrediction);
      repository.remove.mockResolvedValue(mockPrediction);

      await service.deletePrediction('user-uuid');

      expect(repository.remove).toHaveBeenCalledWith(mockPrediction);
    });

    it('should throw error if prediction not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.deletePrediction('user-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error if prediction is finalized', async () => {
      const finalizedPrediction = { ...mockPrediction, is_finalized: true };

      repository.findOne.mockResolvedValue(finalizedPrediction);

      await expect(service.deletePrediction('user-uuid')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
