const mongoose = require('mongoose');

const Category =  mongoose.model('Category', new mongoose.Schema({

    title : {
        type : String,
        required : true
    },
    slug : {
        type : String
    }
   
}));


module.exports.Category = Category;
