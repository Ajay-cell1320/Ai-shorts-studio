const db = require('../config/db');

const PLANS = {
  FREE: { name: 'Free Starter', price: 0, monthlyCredits: 3, maxUploadMb: 250 },
  PRO: { name: 'Creator Pro', price: 799, monthlyCredits: 50, maxUploadMb: 1024 },
  AGENCY: { name: 'Studio Agency', price: 2499, monthlyCredits: 250, maxUploadMb: 3072 }
};

function getUserCredits(email) {
  const user = db.memoryStore.users?.get(email?.toLowerCase());
  if (!user) return { creditsRemaining: 3, plan: 'FREE' };
  return { creditsRemaining: user.creditsRemaining ?? 3, plan: user.plan ?? 'FREE' };
}

function deductUserCredit(email) {
  const cleanEmail = email?.toLowerCase();
  const user = db.memoryStore.users?.get(cleanEmail);
  if (!user) return { success: true, remaining: 2 }; // guest demo

  if ((user.creditsRemaining ?? 3) <= 0 && user.plan === 'FREE') {
    return { success: false, error: 'Out of AI credits. Please upgrade to Pro.' };
  }

  user.creditsRemaining = Math.max(0, (user.creditsRemaining ?? 3) - 1);
  db.memoryStore.users.set(cleanEmail, user);
  return { success: true, remaining: user.creditsRemaining };
}

module.exports = { PLANS, getUserCredits, deductUserCredit };
