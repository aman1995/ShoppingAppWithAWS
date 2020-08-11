const mongoose = require('mongoose');

const Product =  mongoose.model('Product', new mongoose.Schema({

    title : {
        type : String,
        required : true
    },
    slug : {
        type : String
    },
    desc : {
        type : String,
        required : true
    },
    category : {
        type : String,
        required : true
    },
    price : {
        type : Number,
        required : true
    },
    slug : {
        type : String
    },
    image : {
        type : String
    }

}));


module.exports.Product = Product;
