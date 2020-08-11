const express = require('express');
const router = express.Router();
const { Product } = require('../models/product');
const { Category } = require('../models/category');
const {check, validationResult } = require('express-validator');
const fs = require('fs-extra');
const mkdirp = require('mkdirp');
const resizeImg = require('resize-img');
const auth = require('../config/auth');
const isAdmin = auth.isAdmin;


/**
 * Get Pages Index
 */
router.get('/', isAdmin,async (req, res) => {
    let count;
    count = await Product.countDocuments();
    const products = await Product.find({});
    res.render('admin/products', {
        products : products,
        count: count
    });
})

/**
 * Get add Product 
 */
router.get('/add-product', isAdmin, async (req, res) => {

    var title = "";
    var desc = "";
    var price = "";
    var categories = await Category.find({});
    res.render('admin/add_product', {
        title: title,
        desc: desc,
        price: price,
        categories: categories
    });

})

/**
 * post add Product 
 */
router.post('/add-product', [

    check('title', 'Title is required').not().isEmpty(),
    check('desc', 'Description is required').not().isEmpty(),
    check('price', 'Price must have a value').isDecimal()
], async (req, res) => {
    
    const imageFile = typeof req.files.image !== "undefined" ? req.files.image.name : "";
    //check('image' , 'You must uplod an image').isImage(imageFile);

    const title = req.body.title;
    const slug = title;
    const desc = req.body.desc;
    const price = req.body.price;
    const category = req.body.category;

    const result= validationResult(req);
    var errors = result.errors;
       
    if (!result.isEmpty()) {
        console.log(errors);
        const categories = await Category.find({});
        res.render('admin/add_product', {
            errors : errors,
            title: title,
            desc: desc,
            price: price,
            categories: categories
        });
    }
    else{
        const dupProd = await Product.findOne({slug : slug});
        if(dupProd){
            const categories = await Category.find({});
            req.flash('danger' , 'Product title exists, Choose another');
            res.render('admin/add_product',{
                title: title,
                desc: desc,
                price: price,
                categories: categories
            });
        }
        else{
            try{
                const product = new Product({
                    title: title,
                    slug: slug,
                    desc: desc,
                    price: parseFloat(price).toFixed(2),
                    category: category,
                    image: imageFile
                });
                await product.save();

                await mkdirp('public/product_images/'+product._id);

                await mkdirp('public/product_images/'+product._id + '/gallery');

                await mkdirp('public/product_images/'+product._id + '/gallery/thumbs')

                if(imageFile != ''){
                    const productImage = req.files.image;
                    const path = 'public/product_images/' + product._id + '/' + imageFile;
                    await productImage.mv(path);
                }

                req.flash('success', 'Product added!');
                res.redirect('/admin/products');
            }
            catch(ex){
               console.log(ex);
            }   
        }
    }
   

});

/**
 * Get Pages Index
 */
router.post('/reorder-pages', async (req, res) => {
    const ids = req.body['id[]'];

    let count=0;
    for(let i=0;i<ids.length;i++){
        let id = ids[i];
        count++;

        const page = await Page.findById(id);
        page.sorting = count;
        await page.save();
    }
})

/**
 * Get edit Product  
 */
router.get('/edit-product/:id', isAdmin,async (req, res) => {

    var errors;
    if(req.session.errors)
        errors = req.session.errors;
    req.session.errors = null;   

    const categories = await Category.find({});
    const product = await Product.findById(req.params.id);
    const galleryDir = 'public/product_images/' + product._id + '/gallery'; 
    let galleryImages = null;
    const files =  await fs.readdir(galleryDir);
    galleryImages =  files;
    res.render('admin/edit_product', {
        errors: errors,
        title: product.title,
        desc: product.desc,
        price: parseFloat(product.price).toFixed(2),
        category: product.category,
        categories: categories,
        image: product.image,
        galleryImages: galleryImages,
        id: product._id
    });

})

/**
 * post edit Product 
 */
router.post('/edit-product/:id', [

    check('title', 'Title is required').not().isEmpty(),
    check('desc', 'Description is required').not().isEmpty(),
    check('price', 'Price must have a value').isDecimal()
], async (req, res) => {
    
    const imageFile = typeof req.files.image !== "undefined" ? req.files.image.name : "";
    //check('image' , 'You must uplod an image').isImage(imageFile);

    const title = req.body.title;
    const slug = title;
    const desc = req.body.desc;
    const price = req.body.price;
    const category = req.body.category;
    const pimage = req.body.pimage;
    const id = req.params.id;

    const result= validationResult(req);
    var errors = result.errors;

    if(!result.isEmpty()){
        req.session.errors = errors;
        res.redirect('/admin/products/edit-product/'+ id);
    }else{
        const dupProd = await Product.findOne({slug:slug, _id:{'$ne':id}});
        if(dupProd){
            req.flash('danger','Product title exists, choose another');
            res.redirect('/admin/products/edit-product/'+ id);
        }else{
            const product = await Product.findById(id);
            product.title = title;
            product.slug = slug;
            product.desc = desc;
            product.price = parseFloat(price).toFixed(2);
            product.category = category;
            if(product.imageFile != ''){
                product.image = imageFile;
            }
            await product.save();
            if(imageFile != ''){
                if(pimage != ''){
                    await fs.remove('public/product_images/' + id + '/' + pimage);
                }
                const productImage = req.files.image;
                const path = 'public/product_images/' + id + '/' + imageFile;

                await productImage.mv(path);
            }
            req.flash('success', 'Product edited!');
            res.redirect('/admin/products/edit-product/'+ id);
        }
    }
  
});


/**
 * Post Product gallery
 */
router.post('/product-gallery/:id', async (req, res) => {
    const productImage = req.files.file;
    const id = req.params.id;
    const path = 'public/product_images/' + id + '/gallery/' + req.files.file.name;
    const thumbsPath = 'public/product_images/' + id + '/gallery/thumbs/' + req.files.file.name;

    await productImage.mv(path);
    const image = await resizeImg(fs.readFileSync(path), {width:100,height:100});
    await fs.writeFileSync(thumbsPath, image);

    res.sendStatus(200);
})


/**
 * Get Delete image
 */
router.get('/delete-image/:image', isAdmin, async (req, res) => {
    const originalImage = 'public/product_images/' + req.query.id + '/gallery/' + req.params.image;
    const thumbImage = 'public/product_images/' + req.query.id + '/gallery/thumbs/' + req.params.image;

    await fs.remove(originalImage);
    await fs.remove(thumbImage);
    req.flash('success', 'Image deleted!');
    res.redirect('/admin/products/edit-product/'+ req.query.id);
})


/**
 * Get Delete product
 */
router.get('/delete-product/:id', isAdmin, async (req, res) => {
    const id = req.params.id;
    const path =  'public/product_images/' + id ;

    await fs.remove(path);
    await Product.findByIdAndRemove(id);
    
    req.flash('success', 'Product deleted!');
    res.redirect('/admin/products');
})




//Exports
module.exports = router;