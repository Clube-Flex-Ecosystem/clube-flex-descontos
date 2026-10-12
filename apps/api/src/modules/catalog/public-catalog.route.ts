import { Router } from 'express';
import {
    getPublicPartnerController,
    listPublicCategoriesController,
    listPublicPartnersController,
    listPublicPlansController,
} from './public-catalog.controller';

export const publicCatalogRouter = Router();
publicCatalogRouter.use((_req, res, next) => {
    res.setHeader('cache-control', 'no-store');
    next();
});
publicCatalogRouter.get('/plans', listPublicPlansController);
publicCatalogRouter.get('/categories', listPublicCategoriesController);
publicCatalogRouter.get('/partners', listPublicPartnersController);
publicCatalogRouter.get('/partners/:slug', getPublicPartnerController);
