import express from 'express';
import { getHello } from '../controllers/helloController.js';
import { getSheetData, appendSheetData, getAuthUrl, handleAuthCallback, checkAuthStatus } from '../controllers/sheetsController.js';

const router = express.Router();

router.use('/auth', (req, res, next) => {
  console.log('🔐 [AUTH REQUEST]');
  console.log('  Method:', req.method);
  console.log('  URL:', req.originalUrl);
  console.log('  Query:', req.query);
  console.log('  Host:', req.get('host'));
  console.log('  Origin:', req.get('origin'));
  console.log('  Referer:', req.get('referer'));
  next();
});

router.get('/hello', getHello);

// Rotas de autenticação do Google Sheets
router.get('/auth/url', getAuthUrl);
router.get('/auth/callback', handleAuthCallback);
router.get('/auth/status', checkAuthStatus);

// Rotas do Google Sheets
router.get('/sheets/read', getSheetData);
router.post('/sheets/append', appendSheetData);

export default router;
