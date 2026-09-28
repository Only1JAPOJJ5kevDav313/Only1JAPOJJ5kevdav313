import express from 'express';
import { getSiteSettings } from '../db/siteSettings.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    res.json(await getSiteSettings());
  } catch (error) {
    console.error('Error fetching site settings:', error);
    res.status(500).json({ error: 'Failed to fetch site settings' });
  }
});

export default router;
