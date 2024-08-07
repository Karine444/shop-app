const mongoose = require('mongoose');
const fileHelper = require('../../../../../xampp_php7.4/htdocs/app-node/util/file');
const {validationResult} = require('express-validator');
const Product = require('../models/product');
const User = require("../models/user");
const Subcategory = require('../models/subcategory');
const Category = require('../models/category');
const Image = require('../models/image');
const Order = require('../models/order');
const Comment = require('../models/comment');
const path = require('path');
const {Storage, TransferManager} = require('@google-cloud/storage');
const { exec } = require('child_process');
const fs = require('fs');

exports.getDashboard = async (req, res, next) => {
    let userId = req.session.user ? req.session.user._id :  '';
    let user = await User.findById(userId).exec();
    res.render('apps/index', {
        pageTitle: 'Add Product',
        path: '/admin',
        user: user,
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: []
    });
};

exports.getAddProduct = async (req, res, next) => {
    let userId = req.session.user ? req.session.user._id :  '';
    let user = await User.findById(userId).exec();
    const subcategories = await Subcategory.find().exec();
    res.render('apps/ecommerce/catalog/add-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        user: user,
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
        categories: subcategories,
    });
};

exports.getEditProduct = async (req, res, next) => {
    try {
        let userId = req.session.user ? req.session.user._id : '';
        let user = await User.findById(userId).exec();
        const prodId = req.params.productId;
        let product = await Product.findById(prodId).exec();
        let comments = await Comment.find({ productId: prodId }).exec();
        // Query subcategories for the product
        const subcategories = await Subcategory.find().exec();

        res.render('apps/ecommerce/catalog/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            user: user,
            product: product,
            comments: comments,
            editing: false,
            hasError: false,
            errorMessage: null,
            validationErrors: [],
            categories: subcategories
        });
    } catch (error) {
        console.error('Error retrieving product details:', error);
        res.status(500).json({ message: 'Failed to retrieve product details' });
    }
};

exports.getAddCategory = async (req, res, next) => {
    let userId = req.session.user ? req.session.user._id :  '';
    let user = await User.findById(userId).exec();
    const categories = await Category.find().exec();
    res.render('apps/ecommerce/catalog/add-category', {
        pageTitle: 'edit Product',
        path: '/admin/add-category',
        user: user,
        categories,
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: []
    });
};

exports.getEditCategory = async (req, res, next) => {
    let userId = req.session.user ? req.session.user._id :  '';
    let user = await User.findById(userId).exec();
    const subcategoryId = req.params.categoryId;
    const subcategory = await Subcategory.findById(subcategoryId).exec();
    const category = await Category.findById(subcategory.categoryId).exec();
    if(category){
        subcategory.categoryTitle = category.title;
    } else {
        subcategory.categoryTitle = '';
    }


    const categories = await Category.find().exec();
    res.render('apps/ecommerce/catalog/edit-category', {
        pageTitle: 'edit Product',
        path: '/admin/edit-category',
        user: user,
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
        subcategory: subcategory,
        categories
    });
};

exports.getOrderDetails = async (req, res, next) => {
    try {
        let userId = req.session.user ? req.session.user._id : '';
        let orderId = req.params.orderId;
        let user = await User.findById(userId).exec();
        let order = await Order.findById(orderId).exec();
        let createdAt = order.createdAt.toLocaleDateString('en-GB')
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.render('apps/ecommerce/sales/order-details', {
            pageTitle: 'Order Details',
            path: '/admin/order-details',
            user: user,
            order: order.toObject(),
            createdAt,
            editing: false,
            hasError: false,
            errorMessage: null,
            validationErrors: []
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ message: 'Failed to fetch order details' });
    }
};

exports.getEditOrder = async (req, res, next) => {
    let userId = req.session.user ? req.session.user._id :  '';
    let orderId = req.params.orderId;
    let user = await User.findById(userId).exec();
    let order = await Order.findById(orderId).exec();
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }
    let createdAt = order.createdAt.toLocaleDateString('en-GB');
    const statusMessages = {
        1: 'Պատվերը ընդունված է',
        2: 'Պատվերը ճանապարհին է',
        3: 'Պատվերը առաքված է'
    };
    let statusMessage = statusMessages[order.status]
    res.render('apps/ecommerce/sales/edit-order', {
        pageTitle: 'edit Product',
        path: '/admin/edit-order',
        user: user,
        order: order.toObject(),
        createdAt,
        statusMessage,
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: []
    });
};


exports.postEditOrder = async (req, res, next) => {
    try {
        let orderId = req.params.orderId;
        let paymentMethod = req.body.payment_method;

        let order = await Order.findById(orderId).exec();
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        order.status = paymentMethod;
        await order.save();

        res.status(200).redirect('/admin/orders');
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ message: 'Failed to update order' });
    }
};

exports.getOrders = async (req, res, next) => {
    try {
        let userId = req.session.user ? req.session.user._id : '';
        let user = await User.findById(userId).exec();
        const orders = await Order.find().exec();

        // Map status codes to status messages
        const statusMessages = {
            1: 'Պատվերը ընդունված է',
            2: 'Պատվերը ճանապարհին է',
            3: 'Պատվերը առաքված է'
        };

        // Format createdAt and updatedAt for each order
        const formattedOrders = orders.map(order => ({
            ...order.toObject(),
            createdAt: new Date(order.createdAt).toLocaleDateString('en-GB'),
            updatedAt: new Date(order.updatedAt).toLocaleDateString('en-GB'),
            statusMessage: statusMessages[order.status] || 'Unknown status'
        }));

        res.render('apps/ecommerce/sales/orders', {
            pageTitle: 'edit Product',
            path: '/admin/orders',
            user: user,
            editing: false,
            hasError: false,
            errorMessage: null,
            orders: formattedOrders,
            validationErrors: []
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
};
exports.getCustomers = async (req, res, next) => {
    let userId = req.session.user ? req.session.user._id :  '';
    let user = await User.findById(userId).exec();
    const users = await User.find().exec();
    console.log(users);
    const formattedUsers = users.map(user => ({
        ...user.toObject(),
        createdAt: new Date(user.createdAt).toLocaleDateString('en-GB'),
    }));
    res.render('apps/customers/customers-list', {
        pageTitle: 'edit Product',
        path: '/admin/customers-list',
        users: formattedUsers,
        user: user,
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: []
    });
};

exports.getCustomerDetails = async (req, res, next) => {
    let userId = req.session.user ? req.session.user._id : '';
    let customerId = req.params.userId;
    try {
        let user = await User.findById(userId).exec();
        if (!user) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        let customer = await User.findById(customerId).exec();
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        let orders = await Order.find({ 'user.userId': customerId }).exec();
        const statusMessages = {
            1: 'Պատվերը ընդունված է',
            2: 'Պատվերը ճանապարհին է',
            3: 'Պատվերը առաքված է'
        };

        const formattedOrders = orders.map(order => {
            const totalQuantity = order.products.reduce((total, product) => total + product.quantity, 0);
            const createdAt = new Date(order.createdAt).toLocaleDateString('en-GB');
            const updatedAt = new Date(order.updatedAt).toLocaleDateString('en-GB');
            const statusMessage = statusMessages[order.status] || 'Unknown status';
            return {
                ...order.toObject(),
                createdAt,
                updatedAt,
                totalQuantity,
                statusMessage
            };
        });
        res.render('apps/customers/customer-details', {
            pageTitle: 'Customer Details',
            path: '/admin/customer-details',
            user: user,
            orders: formattedOrders,
            customer: customer,
            editing: false,
            hasError: false,
            errorMessage: null,
            statusMessages: statusMessages,
            validationErrors: []
        });
    } catch (error) {
        console.error('Error fetching customer details:', error);
        res.status(500).json({ message: 'Failed to fetch customer details' });
    }
};

exports.getAdminDetails = async (req, res, next) => {
    let userId = req.session.user ? req.session.user._id :  '';
    let user = await User.findById(userId).exec();
    res.render('apps/customers/settings', {
        pageTitle: 'edit Product',
        path: '/admin/settings',
        user: user,
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: []
    });
};


exports.getCategories = async (req, res, next) => {
    let userId = req.session.user ? req.session.user._id :  '';
    let user = await User.findById(userId).exec();
    const subcategories = await Subcategory.find().exec();
    for (const subcategory of subcategories) {
        const category = await Category.findById(subcategory.categoryId).exec();
        if(category){
            subcategory.categoryTitle = category.title;
        } else {
            subcategory.categoryTitle = '';
        }
    }
    res.render('apps/ecommerce/catalog/categories', {
        path: '/admin/categories',
        user: user,
        editing: false,
        subcategories,
        hasError: false,
        errorMessage: null,
        validationErrors: []
    });
};
exports.getProducts = async (req, res, next) => {
    let userId = req.session.user ? req.session.user._id :  '';
    let user = await User.findById(userId).exec();
    const products = await Product.find({ userId: userId }).exec();
    res.render('apps/ecommerce/catalog/products', {
        pageTitle: 'Add Product',
        path: '/admin/products',
        user: user,
        products,
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: []
    });
};


exports.postAddProduct = async (req, res, next) => {
    try {
        let userId = req.session.user ? req.session.user._id : '';
        const images = req.files;
        const relativeImagePath = path.relative('public', images[0].path);
        const image = `../${relativeImagePath.replaceAll(/\\/g, '/')}`;
        const status = req.body.status;
        const title = req.body.product_name;
        const price = +req.body.price;
        const description = req.body.description;
        const code = req.body.sku;
        const stock = req.body.shelf;
        const subCategoryId = mongoose.Types.ObjectId(req.body.categories);
        let discount = null;
        let discount_expired_date = null;
        if (req.body.discount_option !== '1') {
            if (req.body.discount_option === '2') {
                discount = req.body.discounted_percentage;
                discount_expired_date = req.body.discounted_expired[0];
            } else {
                discount = ((+req.body.discounted_price / price) / 100) * 100;
                discount_expired_date = req.body.discounted_expired[1];
            }
        }
        let productOptionValues = null
        if(req.body.kt_ecommerce_add_product_options){
            productOptionValues = req.body.kt_ecommerce_add_product_options.map(option => option.product_option_value);
        }
        const product = new Product({
            title: title,
            price: price,
            description: description,
            image: image,
            status: status,
            code: code,
            stock: stock,
            subCategoryId: subCategoryId,
            userId: userId,
            discount: discount,
            discount_expired_date: discount_expired_date,
            size: productOptionValues ,
            isFeatured: false
        });

        await product.save();
        for (const file of images) {
            const relativeImagePath = path.relative('public', file.path);
            const image = `../${relativeImagePath.replaceAll(/\\/g, '/')}`;
            const imageInstance = new Image({
                image: image,
                productId: product._id
            });
            await imageInstance.save();
        }
        res.status(201).redirect('/admin/products');
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ message: 'Failed to add product' });
    }
};

exports.postAddCategory = async (req, res, next) => {
    const title = req.body.category_name;
    const specification = req.body.description;
    const categoryId = req.body.category_type;
    const status = req.body.category_status;
    const subcategory = new Subcategory({
        title: title,
        specification: specification,
        status: status,
        categoryId: categoryId
    });
    await subcategory.save();
    res.status(201).redirect('/admin/categories');
};
//
// exports.getEditProduct = (req, res, next) => {
//   const editMode = req.query.edit;
//   if (!editMode) {
//     return res.redirect('/');
//   }
//   const prodId = req.params.productId;
//   Product.findById(prodId)
//     .then(product => {
//       if (!product) {
//         return res.redirect('/');
//       }
//       res.render('admin/edit-product', {
//         pageTitle: 'Edit Product',
//         path: '/admin/edit-product',
//         editing: editMode,
//         product: product,
//         hasError: false,
//         errorMessage: null,
//         validationErrors: []
//       });
//     })
//     .catch(err => {
//         const error =  new Error(err);
//         error.httpStatusCode = 500;
//         return next(error);
//     });
// };

exports.postEditProduct = async (req, res, next) => {
    try {
        const productId = req.params.productId;
        const images = req.files;
        const productUpdates = {};

        if (req.body.product_name) productUpdates.title = req.body.product_name;
        if (req.body.price) productUpdates.price = +req.body.price;
        if (req.body.description) productUpdates.description = req.body.description;
        if (req.body.sku) productUpdates.code = req.body.sku;
        if (req.body.shelf) productUpdates.stock = req.body.shelf;
        if (req.body.categories) productUpdates.subCategoryId = mongoose.Types.ObjectId(req.body.categories);

        if (req.body.discount_option !== '1') {
            if (req.body.discount_option === '2') {
                if (req.body.discounted_percentage !== '') { // Check if discounted_percentage is not empty
                    productUpdates.discount = req.body.discounted_percentage;
                    productUpdates.discount_expired_date = req.body.discounted_expired[0];
                }
            } else {
                if (req.body.discounted_price) { // Check if discounted_price is provided
                    productUpdates.discount = ((+req.body.discounted_price / product.price) / 100) * 100;
                    productUpdates.discount_expired_date = req.body.discounted_expired[1];
                }
            }
        }

        if (req.body.kt_ecommerce_add_product_options) {
            productUpdates.size = req.body.kt_ecommerce_add_product_options.map(option => option.product_option_value);
        }

        if (images && images.length > 0) {
            const relativeImagePath = path.relative('public', images[0].path);
            productUpdates.image = `../${relativeImagePath.replaceAll(/\\/g, '/')}`;
        }

        const updatedProduct = await Product.findOneAndUpdate(
            { _id: productId },
            { $set: productUpdates },
            { new: true, useFindAndModify: false }
        );
        if (!updatedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        // If images were uploaded, save them in the database
        if (images && images.length > 0) {
            for (const file of images) {
                const relativeImagePath = path.relative('public', file.path);
                const image = `../${relativeImagePath.replaceAll(/\\/g, '/')}`;
                const imageInstance = new Image({
                    image: image,
                    productId: productId
                });
                await imageInstance.save();
            }
        }
        res.status(200).redirect('/admin/products');
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Failed to update product' });
    }
};

exports.postEditCategory = async (req, res, next) => {
    const subcategoryId = req.params.categoryId;
    console.log(subcategoryId);
    const title = req.body.category_name;
    const specification = req.body.description;
    const categoryId = req.body.category_type;
    const status = req.body.category_status;
    Subcategory.findById(subcategoryId)
        .then(subcategory => {
            if (!subcategory) {
                return res.status(404).json({ message: 'Subcategory not found' });
            }
            subcategory.title = title;
            subcategory.specification = specification;
            subcategory.categoryId = categoryId;
            subcategory.status = status;
            return subcategory.save()
                .then(updatedSubcategory => {
                    console.log('UPDATED SUBCATEGORY:', updatedSubcategory);
                    res.status(201).redirect('/admin/categories');
                });
        })
        .catch(err => {
            console.error('Error updating subcategory:', err);
            res.status(500).json({ message: 'Failed to update subcategory' });
        });
}

// exports.getProducts = (req, res, next) => {
//   Product.find({userId: req.user._id})
//     // .select('title price -_id')
//     // .populate('userId', 'name')
//     .then(products => {
//       console.log(products);
//       res.render('admin/products', {
//         prods: products,
//         pageTitle: 'Admin Products',
//         path: '/admin/products'
//       });
//     })
//       .catch(err => {
//       const error =  new Error(err);
//       error.httpStatusCode = 500;
//       return next(error);
//   });
// };

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
        if(!product){
            return next(new Error('Product not found.'));
        }
            const publicImagePath = path.join('public', product.image.replace('..', ''));
            fileHelper.deleteFile( publicImagePath.replace(/\//g, '\\'));
            return Product.deleteOne({_id: prodId, userId: req.user._id})
    })
    .then(() => {
        console.log('DESTROYED PRODUCT');
        res.status(200).json({
            message: "Success!"
        });
    })
      .catch(err => {
          res.status(500).json({
              message: 'Deleting product failed.'
          });
      });
};


exports.deleteCategory = (req, res, next) => {
    const categoryId = req.params.categoryId;
    Subcategory.findById(categoryId)
        .then(category => {
            if(!category){
                return next(new Error('Category not found.'));
            }
            return Subcategory.deleteOne({_id: categoryId})
        })
        .then(() => {
            console.log('DESTROYED PRODUCT');
            res.status(200).json({
                message: "Success!"
            });
        })
        .catch(err => {
            res.status(500).json({
                message: 'Deleting product failed.'
            });
        });
};



const util = require('util');
exports.backup = async (req, res, next) => {
    try {
        const keyFilename = path.join(__dirname, '..', 'public', 'quantum-engine-422322-r0-30d3dc527ea5.json');
        const storage = new Storage({
            keyFilename: keyFilename,
            projectId: 'quantum-engine-422322-r0'
        });
        const bucketName = 'megashop';
        const mongoURL = 'mongodb+srv://karinev:AsDfGh2023@cluster0.y3q3rgn.mongodb.net';
        const dbName = 'shop-app';
        const tmpDirectory = path.join(__dirname, '..', 'tmp', 'mongodb');
        if (!fs.existsSync(tmpDirectory)) {
            fs.mkdirSync(tmpDirectory, { recursive: true });
        }
        await exec(`mongodump --uri="${mongoURL}" --db="${dbName}" --gzip --archive=${tmpDirectory}/shop-app-db.gz"`);
        const files = fs.readdirSync(tmpDirectory);
        for (const file of files) {
            const filePath = path.join(tmpDirectory, file);
            await storage.bucket(bucketName).upload(filePath, {
                destination: file
            });
        }
        res.status(200).json({ message: 'Backup completed successfully' });
    } catch (error) {
        console.error('Error performing backup:', error);
        res.status(500).json({ error: 'An error occurred during backup process' });
    }
};

