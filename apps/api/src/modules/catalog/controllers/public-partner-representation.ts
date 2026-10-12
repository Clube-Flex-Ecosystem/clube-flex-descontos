import {
    effectiveCoupon,
    effectiveUnitContacts,
    type PublicPartner,
} from '@flex/contracts';
import type { PartnerRecord } from '../repositories/partner.repository';

export function toPublicPartner(
    partner: PartnerRecord,
    planId?: string,
): PublicPartner {
    const benefit = planId
        ? partner.benefits.find((b) => b.planId === planId)
        : undefined;
    return {
        slug: partner.slug,
        name: partner.name,
        description: partner.description!,
        featured: partner.featured,
        categories: partner.categories
            .filter((c) => c.status === 'active')
            .map(({ id, name }) => ({ id, name })),
        ...(benefit ? { discountPercentage: benefit.discountPercentage } : {}),
        ...(benefit && effectiveCoupon(partner, benefit)
            ? { coupon: effectiveCoupon(partner, benefit) }
            : {}),
        usageInstructions: partner.usageInstructions!,
        ...(partner.website ? { website: partner.website } : {}),
        contacts: partner.contacts.map(({ type, value, label }) => ({
            type,
            value,
            ...(label ? { label } : {}),
        })),
        units: partner.units
            .filter((u) => u.status === 'active')
            .map((u) => ({
                name: u.name,
                address: u.address,
                ...(u.openingHours ? { openingHours: u.openingHours } : {}),
                ...(u.instructions ? { instructions: u.instructions } : {}),
                contacts: effectiveUnitContacts(
                    u.contacts,
                    partner.contacts,
                ).map(({ type, value, label, inherited }) => ({
                    type,
                    value,
                    ...(label ? { label } : {}),
                    ...(inherited ? { inherited } : {}),
                })),
            })),
    };
}
