// Coin Controller
// Endpoints for Fitverse Coins history

const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../config/database');

/**
 * GET /api/coins/history
 * Returns the authenticated user's full coin transaction history
 */
const getCoinHistory = asyncHandler(async (req, res) => {
  const transactions = await prisma.coinTransaction.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
  });

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { coinBalance: true },
  });

  res.json({
    success: true,
    data: {
      coinBalance: user?.coinBalance ?? 0,
      transactions,
    },
  });
});

module.exports = { getCoinHistory };
