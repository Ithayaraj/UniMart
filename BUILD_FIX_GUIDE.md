# 🔧 Fix EAS Build Error - Special Characters in Path

## Problem
Your folder path contains special characters (●'◡'●) that EAS Build cannot handle.

## ✅ SOLUTION 1: Move Project to Simple Path (RECOMMENDED)

### Step 1: Copy Your Project
1. Copy your entire project folder
2. Paste it to a simple location like:
   - `C:\Projects\university_market_place`
   - `C:\UniMart`
   - `D:\MyApps\unimart`

### Step 2: Open New Location
```bash
cd C:\Projects\university_market_place
```

### Step 3: Initialize Git
```bash
git init
git add .
git commit -m "Initial commit"
```

### Step 4: Build Again
```bash
eas build --platform android --profile preview
```

---

## ✅ SOLUTION 2: Use GitHub (Alternative)

### Step 1: Create GitHub Repository
1. Go to https://github.com
2. Click "New Repository"
3. Name it: `university-marketplace`
4. Click "Create repository"

### Step 2: Push Your Code
```bash
git remote add origin https://github.com/YOUR_USERNAME/university-marketplace.git
git branch -M main
git push -u origin main
```

### Step 3: Build from GitHub
```bash
eas build --platform android --profile preview
```

---

## ✅ SOLUTION 3: Build APK Locally (No EAS Needed)

If EAS keeps failing, build locally:

### Step 1: Install Android Studio
- Download from: https://developer.android.com/studio
- Install Android SDK

### Step 2: Build APK
```bash
npx expo prebuild
cd android
./gradlew assembleRelease
```

### Step 3: Find APK
APK will be in: `android/app/build/outputs/apk/release/app-release.apk`

---

## ✅ SOLUTION 4: Deploy to Web Instead (EASIEST)

Skip Android for now and deploy to web:

### Step 1: Build Web Version
```bash
npx expo export:web
```

### Step 2: Deploy to Netlify
```bash
npm install -g netlify-cli
cd web-build
netlify deploy --prod
```

**Your app is now live on the web!** 🎉

---

## 🎯 RECOMMENDED APPROACH FOR YOU

**Option 1: Move to Simple Path** (5 minutes)
1. Copy project to `C:\UniMart`
2. Run commands above
3. Build successfully

**Option 2: Deploy to Web First** (2 minutes)
1. Build web version
2. Deploy to Netlify
3. Share URL with everyone

---

## 📝 Quick Commands (After Moving Project)

```bash
# Navigate to new location
cd C:\UniMart

# Initialize Git
git init
git add .
git commit -m "Initial commit"

# Build Android
eas build --platform android --profile preview

# OR Build Web
npx expo export:web
netlify deploy --prod
```

---

## ❓ Which Solution Should You Choose?

- **Want Android APK?** → Move project to simple path
- **Want it online quickly?** → Deploy to web
- **Want both?** → Do web first, then Android

---

## 🆘 Still Having Issues?

Try this simple test:
```bash
# Test if path is the issue
cd C:\
mkdir TestApp
cd TestApp
npx create-expo-app test
cd test
eas build --platform android --profile preview
```

If this works, the path is definitely the problem!
