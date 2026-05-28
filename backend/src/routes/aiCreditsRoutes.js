// AI Credits Routes

const express = require('express');
const router = express.Router();
const creditsController = require('../controllers/aiCreditsController');
const { protect, requireEmailVerification } = require('../middlewares/auth');

router.get('/packs', creditsController.listCreditPacks);
router.get('/balance', protect, creditsController.getCreditBalance);
router.get('/purchases', protect, creditsController.getPurchaseHistory);
router.post('/purchase/initiate', protect, requireEmailVerification, creditsController.initiateCreditPurchase);
router.get('/purchase/status/:purchaseId', protect, creditsController.getPurchaseStatus);
router.post('/webhook', creditsController.handleCreditsWebhook);

module.exports = router;
