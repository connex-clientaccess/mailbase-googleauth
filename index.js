const express = require('express');
const session = require('express-session')
const passport = require('passport');
const bodyParser = require('body-parser');
const { PubSub } = require("@google-cloud/pubsub");
require('./auth');

const gmailPubSubTopic = "projects/mailbase-395510/topics/emails";
const uniqueId = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
const subName = `emails-sub-${uniqueId}`;
let arr = []

function isLoggedIn(req, res, next) {
    req.user ? next() : res.sendStatus(401);
}

const app = express();
app.use(session({ secret: "cats"}));
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('<a href="/auth/google">Authenticate with Google</a>');
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['email', 'profile', 'https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.modify']})
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

app.post('/gmail/push', (req, res) => {
    // Handle the incoming push notification
    const message = req.body.message;
    arr.push(message);
    const newMessage = arr[arr.length - 1];
    console.log('New email received:', newMessage);
    res.sendStatus(200);
});


app.listen(3000, async () => {
    console.log('listening on port 3000')
    // Create push subscription here
  const pubSubClient = new PubSub();

  async function createPushSubscription(topicNameOrId, subscriptionNameOrId) {
    const options = {
      pushConfig: {
        pushEndpoint: `https://ac33-154-160-5-234.ngrok-free.app/gmail/push`,
      },
    };

    await pubSubClient
      .topic(topicNameOrId)
      .createSubscription(subscriptionNameOrId, options);
    console.log(`Subscription ${subscriptionNameOrId} created.`);
  }

  createPushSubscription(gmailPubSubTopic, subName);
   
});


