import type { RequestHandler } from 'express';
import { publicContactRequestSchema } from '@flex/contracts';
import { clock } from '../../infrastructure/clock';
import { DrizzlePublicContactRepository } from './repositories/drizzle-public-contact.repository';
import { GetContactConsentUseCase } from './use-cases/get-contact-consent.use-case';
import { SubmitPublicContactUseCase } from './use-cases/submit-public-contact.use-case';

const getConsent = new GetContactConsentUseCase();
const submitContact = new SubmitPublicContactUseCase(
  new DrizzlePublicContactRepository(),
  clock,
);

export const getContactConsentController: RequestHandler = (_req, res) => {
  res.json(getConsent.execute());
};

export const submitPublicContactController: RequestHandler = async (
  req,
  res,
) => {
  const body = publicContactRequestSchema.parse(req.body);
  await submitContact.execute(body);
  res.status(202).json({
    message: 'Recebemos seus dados. Nossa equipe entrará em contato.',
  });
};
