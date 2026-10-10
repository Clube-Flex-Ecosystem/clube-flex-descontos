import type { ActiveStatus, ContactType, PartnerStatus } from '@flex/contracts';

export interface ContactData {
  /** Presente em contatos já persistidos. */
  id?: string;
  type: ContactType;
  value: string;
  label?: string;
}

export interface UnitData {
  id?: string;
  name: string;
  address: {
    postalCode: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  openingHours?: string;
  instructions?: string;
  status: ActiveStatus;
  contacts: ContactData[];
}

export interface BenefitData {
  planId: string;
  discountPercentage: number;
  coupon?: string;
}

/** Representação editável completa do agregado. */
export interface PartnerData {
  name: string;
  slug: string;
  description?: string;
  usageInstructions?: string;
  website?: string;
  featured: boolean;
  generalCoupon?: string;
  categoryIds: string[];
  contacts: ContactData[];
  units: UnitData[];
  benefits: BenefitData[];
}

export type StoredContact = ContactData & { id: string };

export interface PartnerRecord {
  id: string;
  slug: string;
  name: string;
  description?: string;
  usageInstructions?: string;
  website?: string;
  featured: boolean;
  generalCoupon?: string;
  status: PartnerStatus;
  /** Preenchido na primeira publicação. */
  firstPublishedAt?: Date;
  categories: { id: string; name: string; status: ActiveStatus }[];
  contacts: StoredContact[];
  units: (Omit<UnitData, 'id' | 'contacts'> & {
    id: string;
    contacts: StoredContact[];
  })[];
  benefits: BenefitData[];
  version: number;
}

export interface PartnerRepository {
  /** Em ordem alfabética, em todos os estados. */
  list(): Promise<PartnerRecord[]>;
  findById(id: string): Promise<PartnerRecord | null>;
  /** Existe outro parceiro com o mesmo nome normalizado? */
  hasSimilarName(name: string, excludingId: string): Promise<boolean>;
  /** O identificador está em uso, atualmente ou por um endereço anterior? */
  slugExists(slug: string): Promise<boolean>;
  /** Cria o agregado como rascunho. Lança `DuplicateResourceError` para slug em uso. */
  create(data: PartnerData, now: Date): Promise<PartnerRecord>;
  /**
   * Substitui o agregado completo se a versão ainda for a informada. Retorna `null` quando
   * nenhuma linha foi alterada.
   */
  replace(
    id: string,
    expectedVersion: number,
    data: PartnerData,
    now: Date,
  ): Promise<PartnerRecord | null>;
  setStatus(
    id: string,
    expectedVersion: number,
    status: PartnerStatus,
    now: Date,
  ): Promise<PartnerRecord | null>;
  /** Remove o agregado se a versão ainda for a informada; retorna se removeu. */
  delete(id: string, expectedVersion: number): Promise<boolean>;
}
