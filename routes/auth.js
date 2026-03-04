const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const authController = require('../controllers/auth')
const User = require('../models/user');

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', 
    body('email')
    .isEmail()
    .withMessage('Enter A valid Email')
    , 
    body('password', 'Password Has To Be Valid')
    .isLength({min: 5})
    .isAlphanumeric(), 
authController.postLogin);

router.post('/signup', 
    body('email')
    .isEmail()
    .withMessage('Enter a valid email')
    .custom((value, {req}) => {
        /* if (value === 'test@test.com') {
            throw new Error("This email is forbidden");
        } */

        return User
            .findOne({email: value})
            .then(userDoc => {
                if (userDoc) {
                    return Promise.reject('Email Already Exist, Pick Another One')
                }
            })
    }).normalizeEmail().trim(), 
    body('password', 'Please Enter A Password With At Least Five Character Without Any Special Characters')
    .isLength({min: 5})
    .isAlphanumeric()
    .trim(),
    
    body('confirmPassword')
    .trim()
    .custom((value, {req}) => {
        if (value !== req.body.password) {
            throw new Error("Passwords Must Match");
        }

        return true;
    })
    ,
authController.postSignUp);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewpassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router