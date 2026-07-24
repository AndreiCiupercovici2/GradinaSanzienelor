const loginAttempts = new Map();
const PENALTY_TIERS = [15, 30, 60, 1440]; 
const MAX_FREE_ATTEMPTS = 5;

const escalatingLoginLimiter = (req, res, next) => {
    const target = req.body.username ? `user_${req.body.username}` : `ip_${req.ip}`;
    
    const record = loginAttempts.get(target) || { count: 0, lockoutUntil: 0 };

    if (Date.now() < record.lockoutUntil) {
        const remainingMs = record.lockoutUntil - Date.now();
        const remainingMinutes = Math.ceil(remainingMs / 1000 / 60);
        
        return res.status(429).json({ 
            message: `Account temporarily locked due to suspicious activity. Try again in ${remainingMinutes} minutes.` 
        });
    }

    req.handleFailedLogin = () => {
        record.count += 1;
        
        if (record.count >= MAX_FREE_ATTEMPTS) {
            const penaltyIndex = Math.min(record.count - MAX_FREE_ATTEMPTS, PENALTY_TIERS.length - 1);
            const penaltyMinutes = PENALTY_TIERS[penaltyIndex];
            record.lockoutUntil = Date.now() + (penaltyMinutes * 60 * 1000);
        }
        
        loginAttempts.set(target, record);
    };

    req.handleSuccessfulLogin = () => {
        loginAttempts.delete(target);
    };

    next();
};

module.exports = { escalatingLoginLimiter };