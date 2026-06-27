// config/passport.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import * as authService from '../servises/authService.js'; // Your Prisma user layer

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/auth/google/login',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        
        // 1. Check if user already exists via email
        let user = await authService.findByEmail(email);
        
        if (!user) {
          // 2. If they don't exist, register them (omit password since they use Google)
          user = await authService.createUser({
            email,
            userName: profile.displayName || profile.name.givenName,
            password: null // Your schema should allow nullable passwords for OAuth users!
          });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

export default passport;