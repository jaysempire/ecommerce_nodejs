const express = require('express');
const path = require('path');

const { body } = require('express-validator')

const isAuth = require('../middleware/is-Auth');

const router = express.Router();


//const rootDir = require('../util/path');

const adminController = require('../controllers/admin');

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/add-product => POST
router.post('/add-product', [
    body('title')
        .isString()
        .isLength({min: 3})
        .trim(),
    body('price')
        .isFloat()
        .withMessage('Please enter a valid decimal price.'),
    body('description')
        .isLength({min: 8, max: 400})
        .trim()
        .withMessage('Description must be longer than 8 characters.')
],isAuth, adminController.postAddProduct);

// /admin/product => GET
router.get('/products',isAuth, adminController.getProducts);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', [
    body('title')
        .isString()
        .isLength({min: 3})
        .trim(),
    body('price')
        .isFloat()
        .withMessage('Please enter a valid decimal price.'),
    body('description')
        .isLength({min: 8, max: 400})
        .trim()
        .withMessage('Description must be longer than 8 characters.')
], isAuth, adminController.postEditProduct);

router.delete('/product/:productId', isAuth, adminController.deleteProduct); 

module.exports = router