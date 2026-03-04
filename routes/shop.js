const path = require('path');

const isAuth = require('../middleware/is-Auth');

const express = require('express');

// const rootDir = require('../util/path');
// const adminData = require('./admin');

const shopController = require('../controllers/shop');

const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct);

router.post('/cart', isAuth, shopController.postCart);

router.get('/cart', isAuth, shopController.getCart);

router.post('/delete-cart-item', isAuth, shopController.postDeleteCart);

router.get('/checkout', isAuth, shopController.getCheckout);

router.get('/checkout/success', isAuth, shopController.postOrder);

router.get('/checkout/cancel', isAuth, shopController.getCheckout);

router.get('/orders', isAuth, shopController.getOrders); 

router.get('/orders/:orderId', isAuth, shopController.getInvoice)

module.exports = router;