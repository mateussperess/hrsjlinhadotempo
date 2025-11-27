import express from 'express';
import { getHello } from '../controllers/helloController.js';
import { getSheetData, appendSheetData, getAuthUrl, handleAuthCallback } from '../controllers/sheetsController.js';

const router = express.Router();

router.get('/hello', getHello);

// Rotas de autenticação do Google Sheets
router.get('/auth/url', getAuthUrl);
router.get('/auth/callback', handleAuthCallback);

// Rotas do Google Sheets
router.get('/sheets/read', getSheetData);
router.post('/sheets/append', appendSheetData);

export default router;
