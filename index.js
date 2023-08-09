const express = require('express');
const session = require('express-session')
const passport = require('passport');
require('./auth');

function isLoggedIn(req, res, next) {
    req.user ? next() : res.sendStatus(401);
}

const app = express();
app.use(session({ secret: "cats"}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
    res.send('<a href="/auth/google">Authenticate with Google</a>');
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['email', 'profile', 'https://www.googleapis.com/auth/gmail.readonly']})
)

app.get('/google/callback',
  passport.authenticate('google', {
    successRedirect: '/protected',
    failureRedirect: '/auth/failure'
  })
);

app.get('/auth/failure', (req, res) => {
    res.send('Something went wrong..')
})

app.get('/protected', isLoggedIn, (req, res) => {
    const accessToken = req.user.accessToken;
    console.log(accessToken);
    console.log('EMAILS:', req.user.emails);
    res.send(`Hello ${req.user.displayName}!`);
});

app.get('/logout', (req, res) => {
    req.logout(function(err) {
        if (err) {
            console.error(err);
            return res.sendStatus(500);
        }
        req.session.destroy(function(err) {
            if (err) {
                console.error(err);
                return res.sendStatus(500);
            }
            res.send('Goodbye!');
        });
    });
});


app.listen(3000, () => {
    console.log('listening on port 3000')
});
