const express = require('express');
const router = express.Router();
const { Category } = require('../models/category');
const {check, validationResult } = require('express-validator');
const auth = require('../config/auth');
const isAdmin = auth.isAdmin;


/**
 * Get Category Index
 */
router.get('/', isAdmin, async (req, res) => {
    const categories = await Category.find({});
    res.render('admin/categories', {
        categories: categories
    }); 
})

/**
 * Get add Category 
 */
router.get('/add-category', isAdmin, (req, res) => {

    var title = "";

    res.render('admin/add_category', {
        title: title
    });

})

/**
 * post add Category 
 */
router.post('/add-category', [
    check('title', 'Title is required').not().isEmpty()
], async (req, res) => {

    const result= validationResult(req);
    var errors = result.errors;
    
    if (!result.isEmpty()) {
        console.log(errors);
        res.render('admin/add_category',{
            errors : errors,
            title: req.body.title
        });
    }
    else{
        let category = new Category({
            title: req.body.title,
            slug: req.body.title
        });
       
        const categoryDup = await Category.findOne({slug : category.slug});
        if(categoryDup){
            req.flash('danger' , 'Category title exists, Choose another');
            res.render('admin/add_category',{
                title: req.body.title, 
            });
        }
        else{
            try{
                await category.save();
                console.log("saved");

                await Category.find(function(err, categories){
                    req.app.locals.categories = categories;
                });

                req.flash('success', 'Category added!');
                res.redirect('/admin/categories');
            }
            catch(ex){
               console.log('Something failed in transaction');
            }  
        } 
    }
   

});


/**
 * Get edit Category 
 */
router.get('/edit-category/:id', isAdmin,async (req, res) => {

    const category = await Category.findById(req.params.id);

    res.render('admin/edit_category', { 
        title: category.title,
        id: category._id 
    });

})

/**
 * post edit Category 
 */
router.post('/edit-category/:id', [
    check('title', 'Title is required').not().isEmpty()
], async (req, res) => {

    const result= validationResult(req);
    var errors = result.errors;
    
    if (!result.isEmpty()) {
        console.log(errors);
        res.render('admin/edit_category',{
            errors : errors,
            title: req.body.title,
            id: req.params.id
        });
    }
    else{    
        const  title = req.body.title;
        const  slug = title;
        const  id = req.params.id;
        
        const categoryDup = await Category.findOne({slug : slug, _id:{'$ne':id}});
        if(categoryDup){
            req.flash('danger' , 'Category title exists, Choose another');
            res.render('admin/edit_category',{
                title: title,
                id: id
            });
        }
        else{
            try{
                const category = await Category.findById(id);
                category.title = title;
                category.slug = title;

                await category.save();
                console.log("saved");

                await Category.find(function(err, categories){
                    req.app.locals.categories = categories;
                });

                req.flash('success', 'Category added!');
                res.redirect('/admin/categories/edit-category/'+category.id);
            }
            catch(ex){
               console.log(ex);
            } 
        } 
    }
});


/**
 * Delete category
 */
router.get('/delete-category/:id', isAdmin, async (req, res) => {
    await Category.findByIdAndRemove(req.params.id);
    await Category.find(function(err, categories){
        req.app.locals.categories = categories;
    });
    req.flash('success', 'Category deleted');
    res.redirect('/admin/categories');
})




//Exports
module.exports = router;