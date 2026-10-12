import type { RequestHandler } from 'express';
import { publicContactRequestSchema } from '@flex/contracts';
import { sendProblem } from '../../http/problem';
import { parseBody } from '../../http/validation';
import { clock } from '../../infrastructure/services';
import { DrizzlePublicContactRepository } from './repositories/drizzle-public-contact.repository';
import { GetContactConsentUseCase } from './use-cases/get-contact-consent.use-case';
import {
  OutdatedConsentError,
  SubmitPublicContactUseCase,
} from './use-cases/submit-public-contact.use-case';

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
  const body = parseBody(publicContactRequestSchema, req.body);
  if (!body.success) {
    sendProblem(req, res, 'VALIDATION_ERROR', { errors: body.errors });
    return;
  }
  try {
    await submitContact.execute(body.data);
    res.status(202).json({
      message: 'Recebemos seus dados. Nossa equipe entrará em contato.',
    });
  } catch (error) {
    if (error instanceof OutdatedConsentError) {
      sendProblem(req, res, 'VALIDATION_ERROR');
      return;
    }
    throw error;
  }
};
