const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { google } = require("googleapis");
const { PubSub } = require("@google-cloud/pubsub");
require("dotenv").config();

const gmailPubSubTopic = "projects/mailbase-395510/topics/emails";


function watchUserGmail(accessToken) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const request = {
    labelIds: ["INBOX"],
    topicName: gmailPubSubTopic, // Replace with your Pub/Sub topic
  };

  gmail.users.watch(
    {
      userId: "me",
      resource: request,
    },
    (err, response) => {
      if (err) {
        console.error("Error setting up Gmail push notification:", err);
      } else {
        console.log("Gmail push notification set up:", response.data);
      }
    }
  );
}

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
          watchUserGmail(accessToken);
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

