// AI Credits Routes

const express = require('express');
const router = express.Router();
const creditsController = require('../controllers/aiCreditsController');
const { protect, requireEmailVerification } = require('../middlewares/auth');

router.get('/packs', creditsController.listCreditPacks);
router.get('/balance', protect, creditsController.getCreditBalance);
router.get('/purchases', protect, creditsController.getPurchaseHistory);
router.post('/purchase/initiate', protect, requireEmailVerification, creditsController.initiateCreditPurchase);
router.post('/purchase/verify', protect, creditsController.verifyCreditPurchase);
router.get('/purchase/status/:purchaseId', protect, creditsController.getPurchaseStatus);
// Razorpay webhook for credits (no auth)
router.post('/webhook', creditsController.handleCreditsWebhook);

module.exports = router;