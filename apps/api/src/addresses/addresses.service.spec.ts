import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';

import { AddressesService } from './addresses.service';
import { UserAddress } from './entities/user-address.entity';

function buildAddressRepositoryMock() {
  const repo: Record<string, jest.Mock> & { manager?: unknown } = {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    create: jest.fn((entity) => entity),
    save: jest.fn((entity) => Promise.resolve(entity)),
    update: jest.fn(),
    delete: jest.fn(),
  };
  repo.manager = {
    transaction: jest.fn((callback: (manager: unknown) => unknown) =>
      callback({ withRepository: () => repo }),
    ),
  };
  return repo;
}

async function buildTestingService() {
  const addressRepository = buildAddressRepositoryMock();

  const moduleRef = await Test.createTestingModule({
    providers: [
      AddressesService,
      { provide: getRepositoryToken(UserAddress), useValue: addressRepository },
    ],
  }).compile();

  return {
    service: moduleRef.get(AddressesService),
    addressRepository,
  };
}

function buildAddress(overrides?: Partial<UserAddress>): UserAddress {
  return {
    id: 'address-1',
    userId: 'user-1',
    title: 'خانه',
    recipientName: 'علی رضایی',
    recipientPhone: '+989123456789',
    province: 'تهران',
    city: 'تهران',
    addressLine: 'خیابان ولیعصر',
    postalCode: '1234567890',
    buildingNumber: '10',
    unit: '2',
    isDefault: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  } as UserAddress;
}

const validDto = {
  title: 'خانه',
  recipientName: 'علی رضایی',
  recipientPhone: '09123456789',
  province: 'تهران',
  city: 'تهران',
  addressLine: 'خیابان ولیعصر',
  postalCode: '1234567890',
};

describe('AddressesService', () => {
  describe('create', () => {
    it('makes the first address for a user the default automatically', async () => {
      const { service, addressRepository } = await buildTestingService();
      addressRepository.count.mockResolvedValue(0);

      const result = await service.create('user-1', { ...validDto });

      expect(result.isDefault).toBe(true);
      expect(addressRepository.update).not.toHaveBeenCalled();
    });

    it('does not force default when the user already has one and isDefault is not requested', async () => {
      const { service, addressRepository } = await buildTestingService();
      addressRepository.count.mockResolvedValue(1);

      const result = await service.create('user-1', { ...validDto });

      expect(result.isDefault).toBe(false);
      expect(addressRepository.update).not.toHaveBeenCalled();
    });

    it('clears the previous default when isDefault is explicitly requested for a new address', async () => {
      const { service, addressRepository } = await buildTestingService();
      addressRepository.count.mockResolvedValue(1);

      const result = await service.create('user-1', {
        ...validDto,
        isDefault: true,
      });

      expect(result.isDefault).toBe(true);
      expect(addressRepository.update).toHaveBeenCalledWith(
        { userId: 'user-1', isDefault: true },
        { isDefault: false },
      );
    });

    it('rejects an invalid recipient phone number', async () => {
      const { service } = await buildTestingService();

      await expect(
        service.create('user-1', { ...validDto, recipientPhone: '123' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findAllForUser', () => {
    it('returns only the addresses owned by the given user', async () => {
      const { service, addressRepository } = await buildTestingService();
      addressRepository.find.mockResolvedValue([buildAddress()]);

      await service.findAllForUser('user-1');

      expect(addressRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { isDefault: 'DESC', createdAt: 'DESC' },
      });
    });
  });

  describe('update', () => {
    it('rejects when the address does not belong to the user', async () => {
      const { service, addressRepository } = await buildTestingService();
      addressRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('user-1', 'address-1', { title: 'محل کار' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates fields on an owned address', async () => {
      const { service, addressRepository } = await buildTestingService();
      const address = buildAddress();
      addressRepository.findOne.mockResolvedValue(address);

      const result = await service.update('user-1', 'address-1', {
        title: 'محل کار',
      });

      expect(result.title).toBe('محل کار');
      expect(addressRepository.update).not.toHaveBeenCalled();
    });

    it('swaps the default flag to this address, clearing the previous default', async () => {
      const { service, addressRepository } = await buildTestingService();
      const address = buildAddress({ isDefault: false });
      addressRepository.findOne.mockResolvedValue(address);

      const result = await service.update('user-1', 'address-1', {
        isDefault: true,
      });

      expect(result.isDefault).toBe(true);
      expect(addressRepository.update).toHaveBeenCalledWith(
        { userId: 'user-1', isDefault: true },
        { isDefault: false },
      );
    });
  });

  describe('setDefault', () => {
    it('rejects when the address does not belong to the user', async () => {
      const { service, addressRepository } = await buildTestingService();
      addressRepository.findOne.mockResolvedValue(null);

      await expect(
        service.setDefault('user-1', 'address-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('is a no-op when the address is already the default', async () => {
      const { service, addressRepository } = await buildTestingService();
      addressRepository.findOne.mockResolvedValue(
        buildAddress({ isDefault: true }),
      );

      const result = await service.setDefault('user-1', 'address-1');

      expect(result.isDefault).toBe(true);
      expect(addressRepository.update).not.toHaveBeenCalled();
      expect(addressRepository.save).not.toHaveBeenCalled();
    });

    it('clears the previous default and sets the new one', async () => {
      const { service, addressRepository } = await buildTestingService();
      addressRepository.findOne.mockResolvedValue(
        buildAddress({ isDefault: false }),
      );

      const result = await service.setDefault('user-1', 'address-1');

      expect(result.isDefault).toBe(true);
      expect(addressRepository.update).toHaveBeenCalledWith(
        { userId: 'user-1', isDefault: true },
        { isDefault: false },
      );
    });
  });

  describe('remove', () => {
    it('rejects when the address does not belong to the user', async () => {
      const { service, addressRepository } = await buildTestingService();
      addressRepository.findOne.mockResolvedValue(null);

      await expect(
        service.remove('user-1', 'address-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(addressRepository.delete).not.toHaveBeenCalled();
    });

    it('deletes scoped to the owning user', async () => {
      const { service, addressRepository } = await buildTestingService();
      addressRepository.findOne.mockResolvedValueOnce(
        buildAddress({ isDefault: false }),
      );

      await service.remove('user-1', 'address-1');

      expect(addressRepository.delete).toHaveBeenCalledWith({
        id: 'address-1',
        userId: 'user-1',
      });
    });

    it('promotes another remaining address to default when the deleted one was the default', async () => {
      const { service, addressRepository } = await buildTestingService();
      const remaining = buildAddress({ id: 'address-2', isDefault: false });
      addressRepository.findOne
        .mockResolvedValueOnce(buildAddress({ isDefault: true })) // ownership lookup
        .mockResolvedValueOnce(remaining); // next-default candidate

      await service.remove('user-1', 'address-1');

      expect(remaining.isDefault).toBe(true);
      expect(addressRepository.save).toHaveBeenCalledWith(remaining);
    });
  });
});
