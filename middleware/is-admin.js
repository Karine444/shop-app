const AllowedIP = require('../models/ip');
module.exports = async (req, res, next) => {
    try {
        if (!req.session.isLoggedIn || !req.session.isAdmin) {
            return res.redirect('/login');
        }
        const ipAddress = req.ip;
        if (ipAddress === '::1' || ipAddress === '127.0.0.1') {
            return next();
        }
        const ipExists = await AllowedIP.exists({ ipAddress });

        if (!ipExists) {
            req.session.isLoggedIn = false;
            req.session.ipErrorMessage = "Դուք չեք կարող մուտք գործել ձեր հաշիվ: Խնդրում ենք կապվել ձեր գործատուի հետ:";
            return res.redirect('/login');
        }
        next();
    } catch (error) {
        console.error('Error checking IP address:', error);
        res.status(500).send('Internal Server Error');
    }
};