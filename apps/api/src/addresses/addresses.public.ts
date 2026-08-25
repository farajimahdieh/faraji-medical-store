import { UserAddress } from './entities/user-address.entity';

export interface PublicUserAddress {
  id: string;
  title: string;
  recipientName: string;
  recipientPhone: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
  buildingNumber: string | null;
  unit: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function toPublicAddress(address: UserAddress): PublicUserAddress {
  return {
    id: address.id,
    title: address.title,
    recipientName: address.recipientName,
    recipientPhone: address.recipientPhone,
    province: address.province,
    city: address.city,
    addressLine: address.addressLine,
    postalCode: address.postalCode,
    buildingNumber: address.buildingNumber,
    unit: address.unit,
    isDefault: address.isDefault,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  };
}
