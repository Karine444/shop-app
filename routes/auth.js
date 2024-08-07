const express = require('express');
const { check, body } = require('express-validator');
const authController = require('../controllers/auth');
const User = require('../models/user');
const isAuth = require("../middleware/is-auth");
const isLogin = require("../middleware/is-login");
const router = express.Router();

router.get('/login', isLogin,  authController.getLogin);

//router.get('/signup', authController.getSignup);

router.post(
    '/login',
    [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email address.'),
        body('password', 'Password has to be valid.')
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim()
    ],
    authController.postLogin
);

router.post(
    '/signup',
    [
        check('email')
            .isEmail()
            .withMessage('Please enter a valid email.')
            .custom((value, {req}) => {
                return User.findOne({ email: value })
                .then(userDoc => {
                    if (userDoc) {
                        return Promise.reject(
                            'Փոստի հասցեն արդեն գոյություն ունի, խնդրում ենք ընտրել այլ.'
                        );
                    }
                });
            }),
        body('password', 'Խնդրում ենք մուտքագրել գաղտնաբառ, որը բաղկացած է միայն թվերից և տեքստից և պարունակում է առնվազն 5 նիշ')
            .isLength({min: 5})
            .isAlphanumeric()
            .trim(),
        body('confirmPassword')
            .trim()
            .custom((value, {req}) => {
            if( value !== req.body.password){
                throw new Error('Գաղտնաբառերը չեն համապատասխանում:')
            }
            return true;
        })
    ],
    authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;