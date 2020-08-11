const express = require('express');
const router = express.Router();
const { Page } = require('../models/pages');
const {check, validationResult } = require('express-validator');
const auth = require('../config/auth');
const isAdmin = auth.isAdmin;


/**
 * Get Pages Index
 */
router.get('/', isAdmin,async (req, res) => {
    const pages = await Page.find({}).sort({sorting:1});
    res.render('admin/pages', {
        pages: pages
    });
})

/**
 * Get add Page 
 */
router.get('/add-page',isAdmin, (req, res) => {

    var title = "";
    var slug = "";
    var content = "";

    res.render('admin/add_page', {
        title: title,
        slug: slug,
        content: content
    });

})

/**
 * post add Page 
 */
router.post('/add-page', [
    check('title', 'Title is required').not().isEmpty(),
    check('content', 'Content is required').not().isEmpty(),
], async (req, res) => {

    const result= validationResult(req);
    var errors = result.errors;
    
    if (!result.isEmpty()) {
        console.log(errors);
        res.render('admin/add_page',{
            errors : errors,
            title: req.body.title, 
            slug:  req.body.slug,   
            content:  req.body.content
        });
    }
    else{
        let page = new Page({
            title: req.body.title,
            slug: req.body.slug,
            content: req.body.content,
            sorting: 0
        });
        if (page.slug == "")
        page.slug = page.title;
       
        const pageOne = await Page.findOne({slug : req.body.slug});
        if(pageOne){
            req.flash('danger' , 'Page slug exists, Choose another');
            res.render('admin/add_page',{
                title: req.body.title, 
                slug:  req.body.slug,   
                content:  req.body.content
            });
        }
        else{
            try{
                await page.save();
                console.log("saved");
              
                await Page.find({}).sort({sorting:1}).exec(function(err, pages){
                    req.app.locals.pages = pages;
                });

                req.flash('success', 'Page added!');
                res.redirect('/admin/pages');
            }
            catch(ex){
               console.log('Something failed in transaction');
            }
            
        } 


        
        //page.slug = page.slug.replace(/\s+/g/, '-' ).toLowerCase();
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

        Page.find({}).sort({sorting:1}).exec(function(err, pages){
            req.app.locals.pages = pages;
        });
    }
})

/**
 * Get edit Page 
 */
router.get('/edit-page/:id', isAdmin,async (req, res) => {

    const page = await Page.findById(req.params.id);

    res.render('admin/edit_page', {
        title: page.title,
        slug: page.slug,
        content: page.content,
        id: page._id 
    });

})

/**
 * post edit Page 
 */
router.post('/edit-page/:id',[
    check('title', 'Title is required').not().isEmpty(),
    check('content', 'Content is required').not().isEmpty(),
], async (req, res) => {

    const result = validationResult(req);
    var errors = result.errors;
    if (!result.isEmpty()) {
        console.log(errors);
        res.render('admin/edit_page',{
            errors : errors,
            title: req.body.title, 
            slug:  req.body.slug,   
            content:  req.body.content,
            id: req.params.id
        });
    }
    else{    
        const  title = req.body.title;
        let  slug = req.body.slug;
        const  content =  req.body.content;
        const  sorting =  100;
        const  id = req.params.id;
        
        if (slug === "")
        slug = title;
       
        const pageOne = await Page.findOne({slug : slug, _id:{'$ne':id}});
        if(pageOne){
            req.flash('danger' , 'Page slug exists, Choose another');
            res.render('admin/edit_page',{
                title: title,
                slug: slug,
                content: content,
                id : id
            });
        }
        else{
            try{
                const page = await Page.findById(id);
                page.title = title;
                page.slug = slug;
                page.content = content;
                await page.save();
                console.log("saved");
                
                Page.find({}).sort({sorting:1}).exec(function(err, pages){
                    req.app.locals.pages = pages;
                });
                
                req.flash('success', 'Page added!');
                res.redirect('/admin/pages/edit-page/'+id);
            }
            catch(ex){
               console.log(ex);
            }
            
        } 
        //page.slug = page.slug.replace(/\s+/g/, '-' ).toLowerCase();
    }
});


/**
 * Delete page
 */
router.get('/delete-page/:id', isAdmin, async (req, res) => {
    await Page.findByIdAndRemove(req.params.id);
    await Page.find({}).sort({sorting:1}).exec(function(err, pages){
        req.app.locals.pages = pages;
    });
    req.flash('success', 'Page deleted');
    res.redirect('/admin/pages');
})




//Exports
module.exports = router;