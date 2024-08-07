const path = require('path');

const express = require('express');

const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/page-single', shopController.getSinglePage);

router.get('/page-category', shopController.getCategoryPage);

router.get('/page-offer/:productId', shopController.getOfferPage);

router.get('/cart', shopController.getCartPage);

router.post('/updateQuantity', isAuth, shopController.updateQuantity);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct);

router.get('/cart', isAuth, shopController.getCart);

router.post('/cart/:productId', isAuth, shopController.postCart);

router.post('/cart-delete-item', isAuth, shopController.postCartDeleteProduct);

router.get('/checkout', isAuth, shopController.getCheckout);

router.post('/checkout/storeData', isAuth, shopController.storeData);

router.get('/checkout/success', shopController.getCheckoutSuccess);

router.get('/checkout/cancel', shopController.getCheckout);

router.get('/orders', isAuth, shopController.getOrders);

router.get('/orders/:orderId', isAuth, shopController.getInvoice);

router.get('/favorite-products', isAuth, shopController.getFavoriteProducts);

router.post('/favorite-product', isAuth, shopController.postFavoriteProduct);

router.post('/search', shopController.postSearch);

router.get('/contact-us', shopController.getContactUs);

router.get('/filter-products', shopController.filterProducts);

module.exports = router;
