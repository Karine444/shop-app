const express = require('express');
const commentController = require('../controllers/comment');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.post('/post-comment/:productId', isAuth, commentController.postComment);

module.exports = router;
