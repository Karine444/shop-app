const path = require('path');

const express = require('express');
const { body } = require('express-validator');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');
const isAdmin = require("../middleware/is-admin");

const router = express.Router();

// /admin/add-product => GET
// router.get('/add-product', isAuth, adminController.getAddProduct);
//
// /admin/products => GET
// router.get('/products', isAuth, adminController.getProducts);

// // /admin/add-product => POST
// router.post(
//     '/add-product',
//     [
//         body('title')
//             .isString()
//             .isLength({min: 3})
//             .trim(),
//         body('price')
//             .isFloat(),
//         body('description')
//             .isLength({min: 8, max: 400})
//             .trim()
//     ],
//     isAuth,
//     adminController.postAddProduct
// );
//
// router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);
//
// router.post(
//     '/edit-product',
//     [
//         body('title')
//             .isString()
//             .isLength({min: 3})
//             .trim(),
//         body('price')
//             .isFloat(),
//         body('description')
//             .isLength({min: 8, max: 400})
//             .trim()
//     ],
//     isAuth,
//     adminController.postEditProduct
// );

router.get('/', isAdmin, adminController.getDashboard);

router.get('/add-product', isAdmin, adminController.getAddProduct);

router.post('/add-product', isAdmin, adminController.postAddProduct);

router.get('/products', isAdmin, adminController.getProducts);

router.get('/edit-product/:productId',isAdmin,adminController.getEditProduct);

router.post('/edit-product/:productId',isAdmin,adminController.postEditProduct);

router.get('/categories',isAdmin,adminController.getCategories);

router.get('/add-category',isAdmin,adminController.getAddCategory);

router.post('/add-category',isAdmin,adminController.postAddCategory);

router.get('/edit-category/:categoryId',isAdmin,adminController.getEditCategory);

router.post('/edit-category/:categoryId',isAdmin,adminController.postEditCategory);

router.get('/order-details/:orderId',isAdmin,adminController.getOrderDetails);

router.get('/edit-order/:orderId',isAdmin,adminController.getEditOrder);

router.post('/edit-order/:orderId',isAdmin,adminController.postEditOrder);

router.get('/orders',isAdmin,adminController.getOrders);

router.get('/customers-list',isAdmin,adminController.getCustomers);

router.get('/customer-details/:userId',isAdmin,adminController.getCustomerDetails);

router.get('/settings',isAdmin,adminController.getAdminDetails);

router.delete('/product/:productId', isAdmin, adminController.deleteProduct);

router.delete('/category/:categoryId', isAdmin, adminController.deleteCategory);

router.post('/backup', isAdmin , adminController.backup);

module.exports = router;

