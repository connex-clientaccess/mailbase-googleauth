const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { google } = require("googleapis");
const { PubSub } = require("@google-cloud/pubsub");
require("dotenv").config();

const gmailPubSubTopic = "projects/mailbase-395510/topics/emails";
const subName = "emails-sub";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/google/callback",
    },
    function (accessToken, refreshToken, profile, done) {
      profile.accessToken = accessToken;
      // Fetch emails from Gmail using the accessToken
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });

      const gmail = google.gmail({ version: "v1", auth: oauth2Client });
      gmail.users.messages.list(
        {
          userId: "me",
          q: "in:inbox",
        },
        (err, response) => {
          if (err) {
            return done(err);
          }

          profile.emails = response.data.messages.map((message) => message.id);

          // Creates a client; cache this for further use
          const pubSubClient = new PubSub();

          async function createPushSubscription(
            topicNameOrId,
            subscriptionNameOrId
          ) {
            const options = {
              pushConfig: {
                // Set to an HTTPS endpoint of your choice. If necessary, register
                // (authorize) the domain on which the server is hosted.
                pushEndpoint: `https://f804-154-160-5-234.ngrok-free.app/gmail/push`,
              },
            };

            await pubSubClient
              .topic(topicNameOrId)
              .createSubscription(subscriptionNameOrId, options);
            console.log(`Subscription ${subscriptionNameOrId} created.`);
          }
          createPushSubscription(gmailPubSubTopic, subName);

          return done(null, profile);
        }
      );
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

// Subscribe to the Gmail push notification topic
//  const pubSub = google.pubsub({ version: 'v1', auth: oauth2Client });

//  pubSub.projects.subscriptions.create({
//    name: 'projects/mailbase-395510/subscriptions/emails-sub', // Replace with your actual project ID and subscription name
//    topic: gmailPubSubTopic,
//    pushConfig: {
//      pushEndpoint: 'https://f804-154-160-5-234.ngrok-free.app/gmail/push', // Replace with your server's push endpoint
//    },
//  }, (err, subscription) => {
//    if (err) {
//      console.error('Error creating subscription', err);
//      return done(err);
//    }

//   });
