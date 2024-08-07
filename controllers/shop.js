const fs = require('fs');
const path = require('path');
const stripe = require('stripe')('sk_test_51NffRPEw9Iel7uI7tLcuZt8koT2lG6gBd3qGMHVDKN5F9K6MlCpodGgXoL0vjHb2AT3PP7lEpC0op2tVixtGeq2100u09Ohr28');

const PDFDocument = require('pdfkit')
const Product = require('../models/product');
const Image = require('../models/image');
const Order = require('../models/order');
const Category = require('../models/category');
const Subcategory = require('../models/subcategory');
const commentController = require('../controllers/comment');
const Comment = require("../models/comment");
const User = require("../models/user");

const ITEMS_PER_PAGE = 2;
exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;
    Product.find()
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts;
            return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        })
        .then(products => {
            res.render('shop/product-list', {
                prods: products,
                pageTitle: 'Shop',
                path: 'products',
                currentPage: page,
                totalProducts: totalItems,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
            });
        })
      .catch(err => {
          const error =  new Error(err);
          error.httpStatusCode = 500;
          return next(error);
      });;
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
      .catch(err => {
          const error =  new Error(err);
          error.httpStatusCode = 500;
          return next(error);
      });
};
exports.filterProducts = async (req, res, next) => {
    try {
        const subcategoryTitles = req.query.subcategories;
        const selectedSubcategories = Array.isArray(subcategoryTitles) ? subcategoryTitles : [subcategoryTitles];
        const subcategories = await Subcategory.find({ title: { $in: selectedSubcategories } });
        const subcategoryIds = subcategories.map(subcategory => subcategory._id);
        const filteredProducts = await Product.find({ subCategoryId: { $in: subcategoryIds } });
        console.log(filteredProducts);
        res.json(filteredProducts);
    } catch (error) {
        console.error('Error filtering products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


exports.getSinglePage = (req, res, next) => {
    res.render('page-single', {
        path: '/page-single',
    });
};


exports.getCategoryPage = async (req, res, next) => {
    const searchQuery = req.query.search;
    const subcategoryTitlesString = req.query.subcategory;
    const subcategoryTitles = subcategoryTitlesString ? subcategoryTitlesString.split(',') : [];
    let userId = req.session.user ? req.session.user._id : '';
    let countOfFavoriteProducts = 0;
    const categories = await getAllCategories();
    let products;

    if (subcategoryTitles.length > 0) {
        const subcategoryPromises = subcategoryTitles.map(title => {
            return Subcategory.findOne({ title: title });
        });
        const subcategories = await Promise.all(subcategoryPromises);
        const validSubcategories = subcategories.filter(subcategory => subcategory !== null);
        if (validSubcategories.length) {
            const subcategoryIds = subcategories.map(subcategory => subcategory._id);
            const productPromises = subcategoryIds.map(subcategoryId => {
                return Product.find({ subCategoryId: subcategoryId });
            });
            const productArrays = await Promise.all(productPromises);
            products = productArrays.flat();
        } else {
            products = [];
        }
    } else if (searchQuery) {
        const subcategory = await Subcategory.findOne({ title: { $regex: searchQuery, $options: 'i' } });
        if (subcategory) {
            products = await Product.find({ subCategoryId: subcategory._id });
        } else {
            products = await Product.find({
                $or: [
                    { title: { $regex: searchQuery, $options: 'i' } },
                    { code: { $regex: searchQuery, $options: 'i' } }
                ]
            });
        }
    } else {
        products = await Product.find().sort({ createdAt: -1 });
    }
    const subcategories = await Subcategory.find();
    const productCountPromises = subcategories.map(async (subcategory) => {
        const productCount = await Product.countDocuments({ subCategoryId: subcategory._id });
        return { ...subcategory.toObject(), productCount };
    });
    const modifiedSubcategories = await Promise.all(productCountPromises);
    let cartData = [];
    if(userId){
        countOfFavoriteProducts = await User.findOne({ _id: userId }).select('favorites').then(user => user.favorites.length);
        cartData = await prepareCartData(userId);
    }

    res.render('page-category', {
        path: '/page-category',
        countOfFavoriteProducts,
        womenCategories: categories[0],
        allCategories: categories[1],
        homeCategories: categories[2],
        fromCartPage: false,
        cartData,
        url: req.originalUrl,
        categories: modifiedSubcategories,
        products,
        searchQuery
    });
};



exports.getOfferPage = async (req, res, next) => {
    try {
        const prodId = req.params.productId;
        const categories = await getAllCategories();
        const product = await Product.findById(prodId);
        const subcategory = await Subcategory.findById(product.subCategoryId);
        const images = await Image.find({ productId: product._id });
        let offerEnds = [];
        if(product.discount_expired_date){
            offerEnds = calculateOffersAndDate(product.discount_expired_date);
        }
        let discountedProduct = product.price;
        let IsDiscountedProduct = false;
        let user = req.session.user ?? '';
        let userId = req.session.user ? req.session.user._id :  '';
        if(product.discount != null){
            discountedProduct = (product.price - ((product.price * product.discount) / 100)).toFixed(2);
        }
        const relatedProducts = await getFilteredProducts('subCategoryId',subcategory._id, 'createdAt','desc',  8, userId, prodId );
        const commentsData = await Comment.find({ productId: prodId })
            .sort({ createdAt: -1 })
            .exec();
        let commentsCount = 0;
        let commentsTotalRate = 0;
        commentsData.forEach(comment => {
            commentsCount++;
            commentsTotalRate += comment.rating;
        });
        const averageRating = commentsCount > 0 ? commentsTotalRate / commentsCount : 0;
        let cartData = [];
        if(userId){
            cartData = await prepareCartData(userId);
        }
        let countOfFavoriteProducts = 0;
        if(userId){
            countOfFavoriteProducts = await User.findOne({ _id: userId }).select('favorites').then(user => user.favorites.length);
        }
        const url = req.originalUrl;
        res.render('page-offer', {
            path: '/page-offer',
            womenCategories: categories[0],
            allCategories: categories[1],
            homeCategories: categories[2],
            product,
            subcategory,
            offerEnds,
            changedPrice: discountedProduct,
            images,
            user,
            comments: commentsData,
            averageRating,
            commentsCount,
            cartData,
            relatedProducts,
            fromCartPage: false,
            url,
            countOfFavoriteProducts
        });
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.getCartPage = async (req, res, next) => {
    const categories = await getAllCategories();
    let userId = req.session.user ? req.session.user._id :  '';
    let cartData = [];
    if(userId){
        cartData = await prepareCartData(userId);
    }
    let countOfFavoriteProducts = 0;
    if(userId){
        countOfFavoriteProducts = await User.findOne({ _id: userId }).select('favorites').then(user => user.favorites.length);
    }
    const url = req.originalUrl;
    res.render('cart', {
        path: '/cart',
        womenCategories: categories[0],
        allCategories: categories[1],
        homeCategories: categories[2],
        cartData,
        fromCartPage: true,
        url,
        countOfFavoriteProducts
    });
};

exports.getIndex = async (req, res, next) => {
    let userId = req.session.user ? req.session.user._id :  '';
    const categories = await getAllCategories();
    const featuredProducts = await getFilteredProducts('isFeatured',true, 'createdAt','desc', 1,userId);
    const products = await getFilteredProducts('isFeatured', false, 'createdAt', 'desc', 10, userId);
    const trendingProducts = await getFilteredProducts('isFeatured',false, 'rating','desc',  8, userId);
    let countOfFavoriteProducts = 0;
    if(userId){
        countOfFavoriteProducts = await User.findOne({ _id: userId }).select('favorites').then(user => user.favorites.length);
    }
    const url = req.originalUrl;
    let cartData = [];
    if(userId){
        cartData = await prepareCartData(userId);
    }
    res.render('index', {
        path: '/',
        womenCategories: categories[0],
        allCategories: categories[1],
        homeCategories: categories[2],
        prods: products,
        featuredProducts,
        trendingProducts,
        cartData,
        fromCartPage: false,
        url,
        countOfFavoriteProducts
    })
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
      });
    })
      .catch(err => {
          const error =  new Error(err);
          error.httpStatusCode = 500;
          return next(error);
      });
};

exports.updateQuantity = async (req, res, next) => {
    try {
        console.log(req.body);
        const { userId, prodId, prodSize, quantity } = req.body;
        console.log(quantity);
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        let productIndex;
        if (prodSize) {
            productIndex = user.cart.items.findIndex(item =>
                item.productId.toString() === prodId && item.size === prodSize
            );
        } else {
            productIndex = user.cart.items.findIndex(item =>
                item.productId.toString() === prodId
            );
        }
        if (productIndex === -1) {
            return res.status(404).json({ message: 'Product not found in the cart' });
        }
        user.cart.items[productIndex].quantity = quantity;
        await user.save();

        res.status(200).json({ message: 'Quantity updated successfully' });
    } catch (error) {
        console.error('Error updating quantity:', error);
        res.status(500).json({ error: 'An error occurred while updating quantity' });
    }
};

exports.postCart = (req, res, next) => {
    const prodId = req.params.productId;
    const quantity = req.body.quantity;
    console.log(req.body.size);
    const size = req.body.size;
    Product.findById(prodId)
    .then(product => {
       req.user.addToCart(product, +quantity, size);
    })
    .then(result => {
        res.redirect(`/page-offer/${prodId}`);
    })
      .catch(err => {
          const error =  new Error(err);
          error.httpStatusCode = 500;
          return next(error);
      });;
};

exports.postCartDeleteProduct = (req, res, next) => {
    let returnUrl = req.body.returnUrl;
    const prodId = req.body.productId;
    const prodSize = req.body.size;
    req.user
        .removeFromCart(prodId, prodSize)
        .then(cartItemsLength => {
            if(cartItemsLength < 1 && returnUrl == '/cart'){
                returnUrl = '/'
            }
            res.redirect(returnUrl);
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getCheckout = async (req, res, next) => {
    let products;
    let total = 0;
    const categories = await getAllCategories();
    let userId = req.session.user ? req.session.user._id :  '';
    let cartData = [];
    if(userId){
        cartData = await prepareCartData(userId);
    }
    let fromCartPage = true;
    let countOfFavoriteProducts = 0;
    if(userId){
        countOfFavoriteProducts = await User.findOne({ _id: userId }).select('favorites').then(user => user.favorites.length);
    }
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(async(user) => {
            products = user.cart.items;
            total = 0;
            let stripeCheckoutData = [];
            for (let product of products) {
                total += product.quantity * product.productId.price;
                let stripProduct = await stripe.products.create({
                    name: product.productId.title,
                    description: product.productId.description
                })
                const stripePrice = await stripe.prices.create({
                    product: stripProduct.id,
                    unit_amount: product.productId.price*100,
                    currency: 'usd',
                });
                stripeCheckoutData.push({
                    price: stripePrice.id,
                    quantity: product.quantity
                })
            }
            return  await stripe.checkout.sessions.create({
                line_items: stripeCheckoutData,
                mode: 'payment',
                success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
                cancel_url: req.protocol + '://' + req.get('host') + '/checkout',
            });
        })
        .then(session => {
            res.render('checkout', {
                path: '/checkout',
                pageTitle: 'Checkout',
                products: products,
                totalSum: total,
                sessionId: session.id,
                womenCategories: categories[0],
                allCategories: categories[1],
                homeCategories: categories[2],
                cartData,
                fromCartPage,
                countOfFavoriteProducts
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getCheckoutSuccess = async (req, res, next) => {
    try {
        let orderDetails = req.session.orderDetails;
        let orderNumber = generateOrderNumber();
        const user = await req.user.populate('cart.items.productId').execPopulate();

        const products = user.cart.items.map(i => {
            return { quantity: i.quantity, product: { ...i.productId._doc }, size: i.size };
        });
        const order = new Order({
            orderNumber: orderNumber,
            firstName: orderDetails.fname,
            lastName: orderDetails.lname,
            address: orderDetails.address,
            country: orderDetails.country,
            city: orderDetails.city,
            postalCode: orderDetails.postal,
            phone: orderDetails.phone,
            notes: orderDetails.notes,
            amount: orderDetails.amount,
            user: {
                email: req.user.email,
                userId: req.user._id
            },
            products: products
        });
        await order.save();
        const productsToUpdate = order.products.map(orderProduct => ({
            productId: orderProduct.product._id,
            quantity: orderProduct.quantity,
            size: orderProduct.size,
        }));
        const updatePromises = productsToUpdate.map(async productData => {
            const { productId, quantity } = productData;
            const product = await Product.findById(productId);
            if (!product) {
                throw new Error(`Product with ID ${productId} not found`);
            }
            product.sold += quantity;
            product.stock -= quantity;
            await product.save();
            console.log(`Product ${productId} updated successfully.`);
        });
        await Promise.all(updatePromises);
        delete req.session.orderDetails;
        await req.user.clearCart();
        res.redirect('/orders');
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        next(error);
    }
};

exports.storeData = (req, res, next) => {
    console.log(req.body);
    req.session.orderDetails = req.body;
    res.status(200).send('Form data received successfully');
};


exports.postFavoriteProduct = (req, res, next) => {
    const { isFavorite, productId } = req.body;
    let userId = req.session.user ? req.session.user._id :  '';
    if (isFavorite) {
        User.findOneAndUpdate(
            { _id: userId },
            { $addToSet: { favorites: { productId: productId } } },
            { new: true }
        )
            .then(user => {
                res.status(200).json({ message: "Product added to favorites" });
            })
            .catch(error => {
                res.status(500).json({ error: "Internal server error" });
            });
    } else {
        User.findOneAndUpdate(
            { _id: userId },
            { $pull: { favorites: { productId: productId } } },
            { new: true }
        )
            .then(user => {
                res.status(200).json({ message: "Product removed from favorites" });
            })
            .catch(error => {
                res.status(500).json({ error: "Internal server error" });
            });
    }
};


exports.postSearch = (req, res, next) => {
    const searchQuery = req.body.search;

    try {
        res.redirect(`/page-category?search=${encodeURIComponent(searchQuery)}`);
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).send('Error searching products');
    }

};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
      .catch(err => {
          const error =  new Error(err);
          error.httpStatusCode = 500;
          return next(error);
      });
};

exports.getOrders = async (req, res, next) => {
    const categories = await getAllCategories();
    let userId = req.session.user ? req.session.user._id :  '';
    let cartData = [];
    if(userId){
        cartData = await prepareCartData(userId);
    }
    let fromCartPage = false;
    const url = req.originalUrl;
    let countOfFavoriteProducts = 0;
    if(userId){
        countOfFavoriteProducts = await User.findOne({ _id: userId }).select('favorites').then(user => user.favorites.length);
    }
    Order.find({ 'user.userId': req.user._id })
        .sort({ createdAt: -1 })
    .then(orders => {
        res.render('orders', {
          path: '/orders',
          pageTitle: 'Your Orders',
          orders: orders,
          womenCategories: categories[0],
          allCategories: categories[1],
          homeCategories: categories[2],
          cartData,
          fromCartPage,
          url,
            countOfFavoriteProducts
      });
    })
      .catch(err => {
          const error =  new Error(err);
          error.httpStatusCode = 500;
          return next(error);
      });
};

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    Order.findById(orderId)
        .then(order => {
            if(!order){
                return next(new Error('No order found.'));
            }
            if(order.user.userId.toString() !== req.user._id.toString()) {
                return next(new Error('Unauthorized.'));
            }
            const invoiceName = 'invoice-' + orderId + '.pdf';
            const invoicePath = path.join('data', 'invoices', invoiceName);
            const pdfDoc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
                'Content-Disposition',
                'inline; filename="'+ invoiceName + '"'
            );
            pdfDoc.pipe(fs.createWriteStream(invoicePath));
            pdfDoc.pipe(res);

            pdfDoc.fontSize(26).text('Invoice', {
                underline: true
            })
            pdfDoc.text('---------------------------------');
            let totalPrice = 0;
            order.products.forEach(prod => {
                totalPrice += prod.quantity * prod.product.price;
                pdfDoc.fontSize(14).text(prod.product.title + ' - ' + prod.quantity + ' x ' + '$' + prod.product.price)
            });
            pdfDoc.text('---------------------------------');
            pdfDoc.fontSize(20).text('Total Price: $' + totalPrice)
            pdfDoc.end();
        })
        .catch(err => console.log(err))
}


exports.getFavoriteProducts = async (req, res, next) => {
    const categories = await getAllCategories();
    const url = req.originalUrl;
    let userId = req.session.user ? req.session.user._id : '';
    let cartData = [];
    if (userId) {
        cartData = await prepareCartData(userId);
    }
    let countOfFavoriteProducts = 0;
    if(userId){
        countOfFavoriteProducts = await User.findOne({ _id: userId }).select('favorites').then(user => user.favorites.length);
    }
    try {
        const user = await User.findById(userId).populate('favorites.productId');
        if (!user) {
            throw new Error('User not found');
        }
        const favoriteProducts = user.favorites.map(favorite => favorite.productId);
        console.log(favoriteProducts);
        res.render('favorite_products', {
            path: '/favorite_products',
            womenCategories: categories[0],
            allCategories: categories[1],
            homeCategories: categories[2],
            cartData,
            fromCartPage: false,
            url,
            products: favoriteProducts,
            countOfFavoriteProducts
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
};

function getAllCategories() {
    return Category.find()
        .then(categories => {
            const womenCategoriesPromise = Promise.all(categories
                .filter(category => category.description === 'Women')
                .map(category => {
                    return Subcategory.find({ categoryId: category._id })
                        .then(subcategories => {
                            if (subcategories.length > 0) {
                                category.subcategories = subcategories;
                            }
                            return category;
                        });
                })
            );

            const allCategoriesPromise = Promise.all(categories
                .filter(category => category.description !== 'Women')
                .map(category => {
                    return Subcategory.find({ categoryId: category._id })
                        .then(subcategories => {
                            if (subcategories.length > 0) {
                                category.subcategories = subcategories;
                            }
                            return category;
                        });
                }));

            const homeCategoriesPromise = Promise.all(categories
                .filter(category => category.description === 'homekit')
                .map(category => {
                    return Subcategory.find({ categoryId: category._id })
                        .then(subcategories => {
                            if (subcategories.length > 0) {
                                const subcategoriesByDescription = {};
                                subcategories.forEach(subcategory => {
                                    const description = subcategory.description;
                                    if (!subcategoriesByDescription[description]) {
                                        subcategoriesByDescription[description] = [];
                                    }
                                    subcategoriesByDescription[description].push(subcategory);
                                });
                                const updatedCategory = {
                                    ...category.toObject(),
                                    items: subcategoriesByDescription
                                };
                                return updatedCategory;
                            } else {
                                return category.toObject();
                            }
                        });
                }));
            return Promise.all([womenCategoriesPromise, allCategoriesPromise, homeCategoriesPromise]);
        });
}

function getAllProducts() {
    return Product.find({ isFeatured: false }).limit(8).sort({createdAt: 'desc' }).then(products => {
        const productPromises = products.map(product => {
            let discountedProduct = product.price;
            let IsDiscountedProduct = false;
            const offerEnds = calculateOffersAndDate(product.discount_expired_date);
            if(product.discount != null){
                discountedProduct = (product.price - ((product.price * product.discount) / 100)).toFixed(2);
                IsDiscountedProduct = true
            }
            return Promise.resolve({
                id: product._id,
                title: product.title,
                price: product.price,
                changedPrice: discountedProduct,
                description: product.description,
                discount: discountedProduct,
                stock: product.stock,
                sold: product.sold,
                offerEnds,
                image:product.image,
                discount_expired_date:product.discount_expired_date,
            });
        });
        return Promise.all(productPromises);
    });
}

function getFilteredProducts(filterColumn, filter, orderedColumn, order, limit, userId = '', productId = '') {
    let query = {};
    if (filterColumn === 'discount' && filter) {
        query.discount = { $exists: true, $ne: null };
    } else {
        query[filterColumn] = filter;
    }
    if (productId !== '') {
        query._id = { $ne: productId };
    }

    return Product.find(query)
        .limit(limit)
        .sort({ [orderedColumn]: order })
        .then(products => {
            if (!userId) {
                return products.map(product => ({
                    id: product._id,
                    title: product.title,
                    price: product.price,
                    changedPrice: product.price,
                    description: product.description,
                    discount: product.discount,
                    stock: product.stock,
                    sold: product.sold,
                    offerEnds: calculateOffersAndDate(product.discount_expired_date),
                    image: product.image,
                    discount_expired_date: product.discount_expired_date,
                    numReviews: product.numReviews,
                    isFavorite: false // Default to false if no user is logged in
                }));
            } else {
                return User.findById(userId)
                    .then(user => {
                        const favoriteProductIds = user.favorites.map(favorite => favorite.productId.toString());
                        return products.map(product => ({
                            id: product._id,
                            title: product.title,
                            price: product.price,
                            changedPrice: product.price,
                            description: product.description,
                            discount: product.discount,
                            stock: product.stock,
                            sold: product.sold,
                            offerEnds: calculateOffersAndDate(product.discount_expired_date),
                            image: product.image,
                            discount_expired_date: product.discount_expired_date,
                            numReviews: product.numReviews,
                            isFavorite: favoriteProductIds.includes(product._id.toString())
                        }));
                    });
            }
        });
}

function calculateOffersAndDate(offerEnds){
    const currentDate = new Date();
    const remainingTimeMs = offerEnds - currentDate;
    const seconds = Math.floor((remainingTimeMs / 1000) % 60);
    const minutes = Math.floor((remainingTimeMs / (1000 * 60)) % 60);
    const hours = Math.floor((remainingTimeMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(remainingTimeMs / (1000 * 60 * 60 * 24));
    return [days, hours, minutes, seconds]
}

async function prepareCartData(userId) {
    try {
        let user = await User.findById(userId);
        let cart = [];
        let totalPrice = 0;
        let cartItems = user.cart.items;
        if (cartItems.length > 0) {
            for (const cartItem of cartItems) {
                const product = await Product.findById(cartItem.productId);
                const itemTotalPrice = cartItem.quantity * product.price;
                totalPrice += itemTotalPrice;
                let cartItemData = {
                    productId: product._id,
                    productName: product.title,
                    productImage: product.image,
                    quantity: cartItem.quantity,
                    size: cartItem.size,
                    pricePerItem: product.price,
                    totalItemPrice: itemTotalPrice
                };
                cart.push(cartItemData);
            }
        }
        let cartData = {
            userId: userId,
            totalPrice: totalPrice,
            items: cart
        };
        return cartData;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}



exports.getContactUs = async (req, res, next) => {
    const categories = await getAllCategories();
    const url = req.originalUrl;
    let userId = req.session.user ? req.session.user._id : '';
    let cartData = [];
    if (userId) {
        cartData = await prepareCartData(userId);
    }
    let countOfFavoriteProducts = 0;
    if(userId){
        countOfFavoriteProducts = await User.findOne({ _id: userId }).select('favorites').then(user => user.favorites.length);
    }
    try {
        const user = await User.findById(userId).populate('favorites.productId');
        if (!user) {
            throw new Error('User not found');
        }
        res.render('contact-us', {
            path: '/contact-us',
            womenCategories: categories[0],
            allCategories: categories[1],
            homeCategories: categories[2],
            cartData,
            fromCartPage: false,
            url,
            countOfFavoriteProducts
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
};

function generateOrderNumber() {
    const timestamp = Date.now();
    const randomNumber = Math.floor(Math.random() * 10000);
    const orderNumber = `${timestamp}${randomNumber}`;
    return orderNumber;
}