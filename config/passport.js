const LocalStrategy = require('passport-local').Strategy;
const { User } = require('../models/user');
const bcrypt = require('bcryptjs');

module.exports = function (passport) {
    passport.use(new LocalStrategy(async function (username, password, done) {
        const user = await User.findOne({ username: username });
        if (!user) {
            return done(null, false, { message: 'No user found' });
        }
        bcrypt.compare(password, user.password, function (err, isMatch) {
            if (err)
                console.log(err);

            if (isMatch)
                return done(null, user);

            else
                return done(null, false, { message: 'Wrong password' });
        });
    }));

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });
    passport.deserializeUser(async function (id, done) {
        const user = await User.findById(id);
        done(null, user);
    })

}