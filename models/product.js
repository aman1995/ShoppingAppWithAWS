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
    imageName : {
        type : String
    },
    imageLocation : {
        type : String
    }, 
    galleryImages : {
        default: [],
        type : Object,
    }

}));


module.exports.Product = Product;
