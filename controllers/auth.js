const crypto = require('crypto')
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer')
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator');

const User = require('../models/user');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: process.env.SENDGRID_API_KEY
    }
}))

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
       message = message[0];
    }else{
        message = null;
    }
    res.render('auth/login',
    {
        path: '/login',
        pageTitle: 'Login Page',
        isAuthenticated: false,
        errorMessage: message,
        oldInput: {email: "", password: ""},
        validationErrors: []
    })
}

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login Page',
            errorMessage: errors.array()[0].msg,
            oldInput: { email: email, password: password },
            validationErrors: errors.array()
        });
    }

    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                // If no user, we render and return to stop the chain
                return res.status(422).render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login Page',
                    errorMessage: 'Invalid Email Or Password!',
                    oldInput: { email: email, password: password },
                    validationErrors: [] 
                });
            }

            // Move bcrypt inside here so 'user' is definitely available
            return bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user; // Store the user object
                        return req.session.save((err) => {
                            if (err) console.log(err);
                            res.redirect('/');
                        });
                    }
                    
                    // If passwords don't match
                    return res.status(422).render('auth/login', {
                        path: '/login',
                        pageTitle: 'Login Page',
                        errorMessage: 'Invalid Email Or Password!',
                        oldInput: { email: email, password: password },
                        validationErrors: [{ path: 'email' }, { path: 'password' }]
                    });
                });
        })
        .catch(err => {
            console.log(err);
            res.redirect('/login');
        });
};
exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
       message = message[0];
    }else{
        message = null;
    }
    res.render('auth/signup',
    {
        path: '/signup',
        pageTitle: 'Signup Page',
        isAuthenticated: false,
        errorMessage: message,
        oldInput: {email: "", password: "", confirmpassword: ""},
        validationErrors: []
    })
}


exports.postSignUp = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422)
        .render('auth/signup',
        {
            path: '/signup',
            pageTitle: 'Signup Page',
            errorMessage: errors.array()[0].msg,
            oldInput: {email: email, password: password, confirmpassword: req.body.confirmpassword},
            validationErrors: errors.array()
        })
    }
    return bcrypt.hash(password, 12)
    .then(hashedPassword => {
        const user = new User({
            email: email,
            password: hashedPassword,
            cart: {items: []}
        })
        return user.save();
    })
    .then(result => {
        res.redirect('/login')
        return transporter.sendMail({
            to: email,
            from: "jeremiahachanya@gmail.com",
            subject: "Signup Successful",
            html: `<!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Welcome to Our Shop</title>
                    </head>
                    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td align="center" style="padding: 40px 0;">
                                    <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                                        
                                        <tr>
                                            <td align="center" style="background-color: #2c3e50; padding: 40px 20px;">
                                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: -0.5px;">Welcome Aboard!</h1>
                                            </td>
                                        </tr>

                                        <tr>
                                            <td style="padding: 40px 30px;">
                                                <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 20px;">Hi there,</h2>
                                                <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                                    Your account has been successfully created. We're thrilled to have you join our community! You can now browse our full catalog, manage your orders, and enjoy a seamless shopping experience.
                                                </p>
                                                
                                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                    <tr>
                                                        <td align="center">
                                                            <a href="http://localhost:3000/login" style="background-color: #3498db; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                                                                Go to Shop
                                                            </a>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>

                                        <tr>
                                            <td style="background-color: #f1f5f9; padding: 20px 30px; text-align: center;">
                                                <p style="color: #94a3b8; font-size: 13px; margin: 0;">
                                                    If you did not create this account, please ignore this email.
                                                </p>
                                                <p style="color: #94a3b8; font-size: 13px; margin: 10px 0 0 0;">
                                                    &copy; 2026 Empire Stores. All rights reserved.
                                                </p>
                                            </td>
                                        </tr>

                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>`
        }).catch(err => console.log(err))
    }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        console.log(err);
        res.redirect('/');
    })
}

exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
       message = message[0];
    }else{
        message = null;
    }
    res.render('auth/reset',
    {
        path: '/reset',
        pageTitle: 'Reset Password',
        isAuthenticated: false,
        errorMessage: message
    })
}

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer)=> {
        if (err) {
            return res.redirect('/reset');
        }

        token = buffer.toString('hex');
        User.findOne({email: req.body.email})
        .then(user => {
            if (!user) {
                req.flash('error', `Email Doesn't Exist, Use correct Email!`);
                return res.redirect('/reset');
            }

            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000;
            return user.save()
                .then(result => {
                    res.redirect('/');
                    return transporter.sendMail({
                        to: req.body.email,
                        from: "jeremiahachanya@gmail.com",
                        subject: "Signup Successful",
                        html: `<!DOCTYPE html>
                                <html>
                                <head>
                                    <meta charset="utf-8">
                                    <title>Reset Your Password</title>
                                </head>
                                <body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: sans-serif;">
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="padding: 20px 0;">
                                        <tr>
                                            <td align="center">
                                                <table border="0" cellpadding="0" cellspacing="0" width="500" style="background-color: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; padding: 40px;">
                                                    <tr>
                                                        <td>
                                                            <h2 style="color: #2c3e50; margin-top: 0;">Password Reset Request</h2>
                                                            <p style="color: #555; line-height: 1.5; font-size: 16px;">
                                                                You requested a password reset. Click the button below to choose a new password. This link will expire shortly.
                                                            </p>
                                                            
                                                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
                                                                <tr>
                                                                    <td align="center">
                                                                        <a href="http://localhost:3000/reset/${token}" 
                                                                        style="background-color: #3498db; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                                                            Reset Password
                                                                        </a>
                                                                    </td>
                                                                </tr>
                                                            </table>

                                                            <p style="color: #999; font-size: 14px; line-height: 1.5;">
                                                                If you did not request this, please ignore this email and your password will remain unchanged.
                                                            </p>
                                                            
                                                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                                                            
                                                            <p style="color: #bbb; font-size: 12px;">
                                                                If the button doesn't work, copy and paste this link into your browser:<br>
                                                                <span style="color: #3498db;">http://localhost:3000/reset/${token}</span>
                                                            </p>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </body>
                                </html>`
                    })
                }).catch(err => console.log(err))
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    })
}

exports.getNewpassword = (req, res, next) => {

    const token = req.params.token;

    User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
        .then(user => {
            let message = req.flash('error');
            if (message.length > 0) {
            message = message[0];
            }else{
                message = null;
            }
            
            res.render('auth/new-password',
            {
                path: '/new-password',
                pageTitle: 'New Password',
                errorMessage: message,
                userId: user._id.toString(),
                resetToken: token
            })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const resetToken = req.body.resetToken;
    const userId = req.body.userId;
    let resetUser;

    User.findOne({resetToken: resetToken, resetTokenExpiration: {$gt : Date.now()}, _id: userId})
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save()
        })
        .then(result => {
            res.redirect('/login');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
} 