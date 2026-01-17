# 🚀 UniMart Deployment Guide

## Overview
This guide will help you deploy your React Native app to Android, iOS, and Web platforms.

---

## 📱 1. ANDROID DEPLOYMENT

### Option A: Build APK (For Testing & Sharing)

**Step 1: Install EAS CLI**
```bash
npm install -g eas-cli
```

**Step 2: Login to Expo**
```bash
eas login
```

**Step 3: Configure EAS Build**
```bash
eas build:configure
```

**Step 4: Build APK**
```bash
eas build --platform android --profile preview
```

This will:
- Build your app in the cloud
- Generate an APK file
- Provide a download link

**Step 5: Download & Install**
- Download the APK from the link provided
- Transfer to your Android phone
- Install it (enable "Install from Unknown Sources" if needed)

### Option B: Publish to Google Play Store

**Step 1: Create Google Play Developer Account**
- Go to https://play.google.com/console
- Pay $25 one-time registration fee
- Complete account setup

**Step 2: Prepare App Assets**
- App icon (512x512 PNG)
- Feature graphic (1024x500 PNG)
- Screenshots (at least 2)
- App description
- Privacy policy URL

**Step 3: Build AAB (Android App Bundle)**
```bash
eas build --platform android --profile production
```

**Step 4: Upload to Play Console**
- Create new app in Play Console
- Upload the AAB file
- Fill in store listing details
- Submit for review

**Timeline:** 1-3 days for review

---

## 🍎 2. iOS DEPLOYMENT

### Requirements:
- Mac computer (required for iOS builds)
- Apple Developer Account ($99/year)

### Option A: Build for Testing (TestFlight)

**Step 1: Enroll in Apple Developer Program**
- Go to https://developer.apple.com
- Pay $99/year
- Complete enrollment

**Step 2: Build iOS App**
```bash
eas build --platform ios --profile preview
```

**Step 3: Install via TestFlight**
- Download TestFlight app on iPhone
- Use the link provided by EAS
- Install and test

### Option B: Publish to App Store

**Step 1: Build Production Version**
```bash
eas build --platform ios --profile production
```

**Step 2: Submit to App Store Connect**
- Go to https://appstoreconnect.apple.com
- Create new app
- Upload build from EAS
- Fill in app information
- Submit for review

**Timeline:** 1-2 days for review

---

## 🌐 3. WEB DEPLOYMENT

### Option A: Deploy to Netlify (Free & Easy)

**Step 1: Build Web Version**
```bash
npx expo export:web
```

**Step 2: Install Netlify CLI**
```bash
npm install -g netlify-cli
```

**Step 3: Deploy**
```bash
cd web-build
netlify deploy --prod
```

**Your app is now live!** You'll get a URL like: `https://your-app.netlify.app`

### Option B: Deploy to Vercel (Free)

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

**Step 2: Build & Deploy**
```bash
npx expo export:web
cd web-build
vercel --prod
```

### Option C: Deploy to Firebase Hosting (Free)

**Step 1: Install Firebase CLI**
```bash
npm install -g firebase-tools
```

**Step 2: Login & Initialize**
```bash
firebase login
firebase init hosting
```

**Step 3: Build & Deploy**
```bash
npx expo export:web
firebase deploy --only hosting
```

---

## 📦 4. EASIEST METHOD - EXPO GO (For Quick Testing)

**No build required!** Just share your app instantly:

**Step 1: Start Development Server**
```bash
npm start
```

**Step 2: Share**
- Scan QR code with Expo Go app (Android/iOS)
- Or share the link with others
- They can run your app instantly!

**Limitations:**
- Requires Expo Go app
- Not suitable for production
- Good for testing only

---

## 🔧 5. BEFORE DEPLOYMENT CHECKLIST

### Update App Configuration

**Edit `app.json`:**
```json
{
  "expo": {
    "name": "UniMart",
    "slug": "unimart",
    "version": "1.0.0",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash-icon.png",
      "backgroundColor": "#4A90E2"
    },
    "android": {
      "package": "com.yourname.unimart",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#4A90E2"
      }
    },
    "ios": {
      "bundleIdentifier": "com.yourname.unimart",
      "buildNumber": "1.0.0"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

### Create Required Assets

**1. App Icon (1024x1024 PNG)**
- Use Canva or Figma
- Simple, recognizable design
- No text (will be too small)

**2. Splash Screen (1242x2436 PNG)**
- Your logo centered
- Solid background color

**3. Screenshots**
- Take screenshots of key features
- Home screen, product details, profile
- At least 2-4 screenshots

---

## 💰 6. COST BREAKDOWN

### Free Options:
- ✅ Web deployment (Netlify/Vercel/Firebase)
- ✅ Android APK builds (EAS free tier)
- ✅ Testing with Expo Go

### Paid Options:
- 💵 Google Play Store: $25 one-time
- 💵 Apple App Store: $99/year
- 💵 EAS Build (for unlimited builds): $29/month

---

## 🎯 7. RECOMMENDED DEPLOYMENT PATH FOR BEGINNERS

### Phase 1: Testing (Free)
1. Use Expo Go for quick testing
2. Share with friends via QR code
3. Get feedback

### Phase 2: Android Release (Low Cost)
1. Build APK with EAS (free)
2. Share APK file directly
3. Or publish to Play Store ($25)

### Phase 3: Web Release (Free)
1. Deploy to Netlify/Vercel
2. Share URL with anyone
3. Works on any device with browser

### Phase 4: iOS Release (If Needed)
1. Get Apple Developer account ($99/year)
2. Build and submit to App Store
3. Reach iOS users

---

## 🔐 8. SECURITY BEFORE DEPLOYMENT

### Protect Your Firebase Keys

**Create `.env` file:**
```
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your_domain_here
FIREBASE_PROJECT_ID=your_project_id_here
```

**Update `firebaseConfig.js`:**
```javascript
import Constants from 'expo-constants';

const firebaseConfig = {
    apiKey: Constants.expoConfig.extra.firebaseApiKey,
    authDomain: Constants.expoConfig.extra.firebaseAuthDomain,
    // ... other config
};
```

**Update `app.json`:**
```json
{
  "expo": {
    "extra": {
      "firebaseApiKey": "your_api_key",
      "firebaseAuthDomain": "your_domain"
    }
  }
}
```

---

## 📊 9. MONITORING YOUR APP

### Firebase Analytics (Free)
- Track user behavior
- See which features are popular
- Monitor crashes

### Sentry (Error Tracking)
```bash
npm install @sentry/react-native
```

---

## 🆘 10. COMMON ISSUES & SOLUTIONS

### Issue: Build Failed
**Solution:** Check your `package.json` for compatible versions

### Issue: App Crashes on Startup
**Solution:** Check Firebase configuration and rules

### Issue: Images Not Loading
**Solution:** Verify Firebase Storage rules are set correctly

### Issue: Can't Login
**Solution:** Check Firebase Authentication is enabled

---

## 📞 11. NEXT STEPS

1. **Test Thoroughly**
   - Test on different devices
   - Test all features
   - Fix any bugs

2. **Gather Feedback**
   - Share with friends/classmates
   - Get user feedback
   - Make improvements

3. **Prepare Marketing**
   - Create app description
   - Take good screenshots
   - Write feature list

4. **Deploy!**
   - Start with web (easiest)
   - Then Android (affordable)
   - Finally iOS (if budget allows)

---

## 🎓 LEARNING RESOURCES

- **Expo Documentation:** https://docs.expo.dev
- **React Native Docs:** https://reactnative.dev
- **Firebase Docs:** https://firebase.google.com/docs
- **YouTube Tutorials:** Search "React Native deployment"

---

## ✅ QUICK START COMMANDS

```bash
# Build Android APK
eas build --platform android --profile preview

# Build for Web
npx expo export:web

# Deploy to Netlify
netlify deploy --prod

# Start development
npm start
```

---

## 🎉 CONGRATULATIONS!

You've built a complete marketplace app! Now you can:
- Share it with the world
- Add it to your portfolio
- Show it in job interviews
- Continue learning and improving

**Good luck with your deployment! 🚀**
