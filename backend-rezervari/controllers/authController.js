const jwt = require('jsonwebtoken');

const login = (req, res) => {
    const { username, password } = req.body;

    if (username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD) {

        req.handleSuccessfulLogin();

        const payload = {
            username: username,
            role: 'admin'
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '1h'
        });

        return res.json({
            message: 'Login successful',
            token: token
        });
    }

    req.handleFailedLogin();

    return res.status(401).json({ message: 'Invalid username or password' });
}

module.exports = { login };