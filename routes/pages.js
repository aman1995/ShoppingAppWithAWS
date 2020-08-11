const express = require('express');
const router = express.Router();
const { Page } = require('../models/pages');

/**
 * GET
 */
router.get('/', async (req,res) => {

    const page = await Page.findOne({slug:'home'});
    res.render('index',{
        title: page.title,
        content: page.content
    });
})

/**
 * GET other pages
 */
router.get('/:slug', async (req,res) => {

    const slug = req.params.slug;

    const page = await Page.findOne({slug:slug});

    if(!page){
        res.redirect('/');
    }else{
        res.render('index',{
            title: page.title,
            content: page.content
        });
    }

   
})


//Exports
module.exports = router;