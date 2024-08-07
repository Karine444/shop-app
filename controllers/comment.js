const fs = require('fs');
const path = require('path');
const stripe = require('stripe')('sk_test_51NffRPEw9Iel7uI7tLcuZt8koT2lG6gBd3qGMHVDKN5F9K6MlCpodGgXoL0vjHb2AT3PP7lEpC0op2tVixtGeq2100u09Ohr28');
const PDFDocument = require('pdfkit')
const Comment = require('../models/comment');
const Product = require("../models/product");

exports.postComment = (req, res, next) => {
    const prodId = req.params.productId;
    const username = req.body.username;
    const userId = req.body.userId;
    const description = req.body.description;
    const rating = req.body.rate;

    const comment = new Comment({
        description: description,
        rating: rating,
        username: username,
        productId: prodId,
        userId: userId,
    });

    comment.save()
        .then(result => {
            Comment.find({ productId: prodId })
                .then(comments => {
                    const totalRating = comments.reduce((total, comment) => total + comment.rating, 0);
                    const averageRating = totalRating / comments.length;
                    return Product.findByIdAndUpdate(prodId, { numReviews: comments.length, rating: averageRating });
                })
                .then(() => {
                    res.redirect(`/page-offer/${prodId}`);
                })
                .catch(err => {
                    throw new Error(err);
                });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};
