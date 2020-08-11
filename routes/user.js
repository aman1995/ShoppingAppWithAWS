const express = require('express');
const router = express.Router();
const { User } = require('../models/user');
const {check, validationResult } = require('express-validator');
const passport = require('passport');
const bcrypt = require('bcryptjs');
/**
 * GET register
 */
router.get('/register', async (req,res) => {

    
    res.render('register',{
        title: 'Register'
    });
})

/**
 *  Register a user
 */
router.post('/register', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Email is required').not().isEmpty(),
    check('username', 'Username is required').not().isEmpty(),
    check('password', 'Password is required').not().isEmpty()
], async (req, res) => {

    const name = req.body.name;
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;
    const password2 = req.body.password2;

    const result= validationResult(req);
    var errors = result.errors;
    
    if (!result.isEmpty()) {
        res.render('register',{
            user:null,
            errors : errors,
            title: 'Register'
        });
    }
    else{
        const userDup = await User.findOne({username:username});
        if(userDup){
            req.flash('danger','Username exists, Choose another');
            res.redirect('/user/register');
        }
        else{
            const user = User({
                name: name,
                email: email,
                username: username,
                password: password,
                admin: 0
            });
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password,salt);
            await user.save();
            req.flash('success','You are registered');
            res.redirect('/user/login');

        }
    }
})

/**
 * GET login
 */
router.get('/login', async (req, res) => {

    if (res.locals.user)
        res.redirect('/');
    else {
        res.render('login', {
            title: 'Login'
        });
    }
})

/**
 * Post login
 */
router.post('/login', async (req,res,next) => {

    passport.authenticate('local',{
        successRedirect : '/home',
        failureredirect: '/user/login',
        failureFlash: true  
    })(req,res,next)
})

/**
 * GET logout
 */
router.get('/logout', async (req, res) => {

    req.logOut();

    req.flash('success' , 'You are logged out');
    res.redirect('/user/login');
    
})



//Exports
module.exports = router;