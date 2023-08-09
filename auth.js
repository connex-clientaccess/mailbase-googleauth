const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
      profile.accessToken = accessToken;
      return done(null, profile);
    }
));

passport.serializeUser(function(user, done){
    done(null, user);
});


passport.deserializeUser(function(user, done){
    done(null, user);
});
