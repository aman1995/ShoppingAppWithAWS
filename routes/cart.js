const express = require('express');
const router = express.Router();
const { Page } = require('../models/pages');

const { Product } = require('../models/product');

/**
 * GET
 */
router.get('/', async (req, res) => {

    const page = await Page.findOne({ slug: 'home' });
    res.render('index', {
        title: page.title,
        content: page.content
    });
})

/**
 * GET Add product to cart
 */
router.get('/add/:product', async (req, res) => {

    const slug = req.params.product;

    const product = await Product.findOne({ slug: slug });

    if (typeof req.session.cart === "undefined") {
        req.session.cart = [];
        req.session.cart.push({
            title: slug,
            qty: 1,
            price: parseFloat(product.price).toFixed(2),
            image: '/product_images/' + product._id + '/' + product.image
        });
    }
    else {
        var cart = req.session.cart;
        var newItem = true;
        for (let i = 0; i < cart.length; i++) {
            if (cart[i].title == slug) {
                cart[i].qty++;
                newItem = false;
            }
        }
        if (newItem) {
            cart.push({
                title: slug,
                qty: 1,
                price: parseFloat(product.price).toFixed(2),
                image: '/product_images/' + product._id + '/' + product.image
            });
        }
    }
    req.flash('success', 'Product added');
    res.redirect('back');
});

/**
 * GET checkout page
 */
router.get('/checkout', async (req, res) => {

    if (req.session.cart && req.session.cart.length === 0) {
        delete req.session.cart;
        res.redirect('/cart/checkout');
    } else {
        res.render('checkout', {
            title: 'Checkout',
            cart: req.session.cart
        });
    }
})

/**
 * GET update product
 */
router.get('/update/:product', async (req, res) => {

    const slug = req.params.product;
    let cart = req.session.cart;
    const action = req.query.action;
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].title === slug) {
            switch (action) {
                case "add":
                    cart[i].qty++;
                    break;
                case "remove":
                    cart[i].qty--;
                    if (cart[i].qty < 1)
                        cart.splice(i, 1);
                    break;
                case "clear":
                    cart.splice(i, 1);
                    if (cart.length === 0)
                        delete req.session.cart;
                    break;

            }
            break;
        }
    }
    req.flash('success', 'Cart updated!!');
    res.redirect('/cart/checkout');
})

/**
 * Get clear cart
 */
router.get('/clear', async (req, res) => {

    delete req.session.cart;
    req.flash('success', 'Cart cleared!!');
    res.redirect('/cart/checkout');
})

/**
 * Get buy now
 */
router.get('/buynow', async (req, res) => {
    delete req.session.cart;
    res.send(200);
})


//Exports
module.exports = router;