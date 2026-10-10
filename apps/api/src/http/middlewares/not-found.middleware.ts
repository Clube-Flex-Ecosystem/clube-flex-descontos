import type { RequestHandler } from 'express';
import { sendProblem } from '../problem';

export const notFoundMiddleware: RequestHandler = (req, res) => {
  sendProblem(req, res, 'RESOURCE_NOT_FOUND');
};
