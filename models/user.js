const mongoose = require('mongoose');

const User =  mongoose.model('User', new mongoose.Schema({

    name : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true
    },
    username : {
        type : String,
        required : true
    },
    password : {
        type : String,
        required : true
    },
    admin : {
        type : Number
    },
   

}));


module.exports.User = User;
