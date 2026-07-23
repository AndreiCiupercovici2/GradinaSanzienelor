const jwt = require('jsonwebtoken');

const login = (req, res) => {
    const { username, password } = req.body;

    if (username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD) {

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

    return res.status(401).json({ message: 'Invalid username or password' });
}

module.exports = { login };