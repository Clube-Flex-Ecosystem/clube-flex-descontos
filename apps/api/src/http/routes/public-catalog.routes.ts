import { Router, type Request, type Response } from 'express';
import { sendProblem } from '../problem';
import type { PublicCatalogService } from '../../modules/catalog/use-cases/public-catalog.service';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createPublicCatalogRouter(
  service: PublicCatalogService,
): Router {
  const router = Router();
  router.use((_req, res, next) => {
    res.setHeader('cache-control', 'no-store');
    next();
  });

  router.get('/plans', async (_req, res) =>
    res.json(await service.listPlans()),
  );
  router.get('/categories', async (req, res) => {
    const planId = readId(req, res, 'planId');
    if (!planId) return;
    const result = await service.listCategories(planId);
    if (result) res.json(result);
    else sendProblem(req, res, 'RESOURCE_NOT_FOUND');
  });
  router.get('/partners', async (req, res) => {
    const planId = readId(req, res, 'planId');
    if (!planId) return;
    const categoryId = readOptionalId(req, res, 'categoryId');
    if (categoryId === false) return;
    const result = await service.listPartners(planId, categoryId || undefined);
    if (result) res.json(result);
    else sendProblem(req, res, 'RESOURCE_NOT_FOUND');
  });
  router.get('/partners/:slug', async (req, res) => {
    const slug = req.params.slug;
    if (!slug) return sendProblem(req, res, 'RESOURCE_NOT_FOUND');
    const planId = readOptionalId(req, res, 'planId');
    if (planId === false) return;
    const result = await service.getPartner(slug, planId || undefined);
    if (result.redirectSlug) {
      const query = planId ? `?planId=${encodeURIComponent(planId)}` : '';
      res.redirect(308, `/v1/public/partners/${result.redirectSlug}${query}`);
    } else if (result.partner) res.json(result.partner);
    else sendProblem(req, res, 'RESOURCE_NOT_FOUND');
  });
  return router;
}

function readId(req: Request, res: Response, key: string): string | undefined {
  const value = req.query[key];
  if (typeof value !== 'string' || !UUID.test(value)) {
    sendProblem(req, res, 'VALIDATION_ERROR');
    return undefined;
  }
  return value;
}

function readOptionalId(
  req: Request,
  res: Response,
  key: string,
): string | false | undefined {
  const value = req.query[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !UUID.test(value)) {
    sendProblem(req, res, 'VALIDATION_ERROR');
    return false;
  }
  return value;
}
