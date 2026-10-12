import type { RequestHandler } from 'express';
import { HttpError } from '../../errors/app-error';

export const notFoundMiddleware: RequestHandler = () => {
  throw new HttpError('RESOURCE_NOT_FOUND');
};
