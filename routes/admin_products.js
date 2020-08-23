const express = require('express');
const router = express.Router();
const { Product } = require('../models/product');
const { Category } = require('../models/category');
const {body, validationResult } = require('express-validator');
const fs = require('fs-extra');
const mkdirp = require('mkdirp');
const resizeImg = require('resize-img');
const auth = require('../config/auth');
const isAdmin = auth.isAdmin;
const aws = require( 'aws-sdk' );
const multerS3 = require( 'multer-s3' );
const multer = require('multer');
const path = require( 'path' );




const s3 = new aws.S3({
    accessKeyId: 'AKIA6CHWD5VLPB7B4HTR',
    secretAccessKey: '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',
    Bucket: 'cmscartgallery2'
   });

/**
 * Single Upload
 */
const profileImgUpload = multer({
    storage: multerS3({
     s3: s3,
     bucket: 'cmscartgallery2',
     acl: 'public-read',
     metadata: function (req, file, cb) {
        cb(null, {fieldName: file.fieldname});
      },
     key: function (req, file, cb) {
      cb(null, path.basename( file.originalname, path.extname( file.originalname ) ) + '-' + Date.now() + path.extname( file.originalname ) )
     }
    }),
    limits:{ fileSize: 2000000 }, // In bytes: 2000000 bytes = 2 MB
    fileFilter: function( req, file, cb ){
     checkFileType( file, cb );
    }
   });
   /**
    * Check File Type
    * @param file
    * @param cb
    * @return {*}
    */
   function checkFileType( file, cb ){
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif/;
    // Check ext
    const extname = filetypes.test( path.extname( file.originalname ).toLowerCase());
    // Check mime
    const mimetype = filetypes.test( file.mimetype );if( mimetype && extname ){
     return cb( null, true );
    } else {
     cb( 'Error: Images Only!' );
    }
   }


   var multipleUpload = profileImgUpload.array('file', 4);
   var singleUpload = profileImgUpload.single('image');





/**
 * Get all Products
 */
router.get('/',async (req, res) => {
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
router.get('/add-product', async (req, res) => {

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
router.post('/add-product', singleUpload, [
    body('title', 'Title is required').not().isEmpty(),
    body('desc', 'Description is required').not().isEmpty(),
    body('price', 'Price must have a value').isDecimal()
], async (req, res) => {
    
    const title = req.body.title;
    const slug = title;
    const desc = req.body.desc;
    const price = req.body.price;
    const category = req.body.category;
    const result= validationResult(req);
    var errors = result.errors;
    
    if (!result.isEmpty()) { 
        const categories = await Category.find({});
        res.render('admin/add_product', {
            errors : errors,
            title: title,
            desc: desc,
            price: price,
            categories: categories
        });
    }
    else if(null == req.file){
        const categories = await Category.find({});
        req.flash('danger' , 'Upload picture');
            res.render('admin/add_product',{
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
                        imageName : req.file.key,
                        imageLocation : req.file.location

                    });
                    await product.save();


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
router.get('/edit-product/:id', async (req, res) => {

    var errors;
    if(req.session.errors)
        errors = req.session.errors;
    req.session.errors = null;   

    const categories = await Category.find({});
    const product = await Product.findById(req.params.id);
    
    res.render('admin/edit_product', {
        errors: errors,
        title: product.title,
        desc: product.desc,
        price: parseFloat(product.price).toFixed(2),
        category: product.category,
        categories: categories,
        image: product.imageLocation,
        galleryImages: product.galleryImages,
        id: product._id
    });

})

/**
 * post edit Product 
 */
router.post('/edit-product/:id', singleUpload, [

    body('title', 'Title is required').not().isEmpty(),
    body('desc', 'Description is required').not().isEmpty(),
    body('price', 'Price must have a value').isDecimal()
], async (req, res) => {
    
    const title = req.body.title;
    const slug = title;
    const desc = req.body.desc;
    const price = req.body.price;
    const category = req.body.category;
    const pimage = req.body.pimage;
    const id = req.params.id;

    const result= validationResult(req);
    var errors = result.errors;

    if(!result.isEmpty() ){
        req.session.errors = errors;
        res.redirect('/admin/products/edit-product/'+ id);
    }
    else{
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
            if(req.file){
                product.imageName = req.file.key;
                product.imageLocation = req.file.location;
            }
            await product.save();
            req.flash('success', 'Product edited!');
            res.redirect('/admin/products/edit-product/'+ id);
        }
    }
  
});

router.post('/product-gallery/:id', async (req, res) => {
    

    multipleUpload(req, res, (error) => {
        if (error) {
            console.log('errors', error);
            res.status(500).json({
                status: 'fail',
                error: error
            });
        } else {
            // If File not found
            if (req.files === undefined) {
                console.log('uploadProductsImages Error: No File Selected!');
                res.status(500).json({
                    status: 'fail',
                    message: 'Error: No File Selected'
                });
            } else {
                // If Success 
                let fileArray = req.files;
                let fileLocation;
        
                fileLocation = fileArray[0].location;
                Product.findById(req.params.id)
                .then(async (product)=>{
                    product.galleryImages.push(fileLocation);
                    product.markModified('galleryImages');
                    return await product.save();
                }).then((product)=>{
                    res.sendStatus(201);
                })
            }
        }
   })


});


/**
 * Get Delete image
 */
router.get('/delete-image/:productId', async (req, res) => {
    
    const product = await Product.findById(req.params.productId);

    const index = product.galleryImages.indexOf(req.query.imageId);
    product.galleryImages.splice(index, 1);
    product.markModified('galleryImages');
    
    await product.save();

    req.flash('success', 'Image deleted!');
    res.redirect('/admin/products/edit-product/'+ req.params.productId);
})


/**
 * Get Delete product
 */
router.get('/delete-product/:id', async (req, res) => {
    const id = req.params.id;
    const product = await Product.findById(req.params.id);
    const obj = product.galleryImages
    
    let deleteobj = [];
    obj.forEach((element) => {
        deleteobj.push({
            Key : element
        })
    });
    var params = {
        Bucket: 'cmscartgallery2', 
        Delete: {
            Objects : deleteobj
        }
      };

   // await Product.findByIdAndRemove(id);
    
    s3.deleteObjects(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
      })


    req.flash('success', 'Product deleted!');
    res.redirect('/admin/products');
})




//Exports
module.exports = router;