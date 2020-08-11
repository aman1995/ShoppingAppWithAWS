const express = require('express');
const router = express.Router();
const { Product } = require('../models/product');
const { Category } = require('../models/category');
const fs = require('fs-extra');

/**
 * GET Products
 */
router.get('/', async (req,res) => {

    const products = await Product.find();
    
    res.render('all_products',{
        title: 'All products',
        products: products
    });
})

/**
 * GET Products by Category
 */
router.get('/:category', async (req,res) => {

    const categorySlug = req.params.category;
    const category = await Category.findOne({slug:categorySlug});
    const products = await Product.find({category:categorySlug});

    res.render('cat_products',{
        title: category.title,
        products: products
    });
})

/**
 * GET products details
 */
router.get('/:category/:product', async (req,res) => {

    let galleryImages = null;
    const loggedIn = (req.isAuthenticated()) ? true : false;
   
    const product = await Product.findOne({slug : req.params.product});
    const galleryDir = 'public/product_images/' + product._id +'/gallery';
    
    galleryImages = await fs.readdir(galleryDir);
    res.render('product',{  
        title: product.title,
        p: product,
        galleryImages: galleryImages,
        loggedIn: loggedIn
    })
   
})


//Exports
module.exports = router;