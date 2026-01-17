# Firebase Setup Guide - Fix Upload Errors

## Most Common Issue: Firebase Storage Rules

If you're getting permission errors when uploading images (products or profile pictures), you need to update your Firebase Storage rules.

### Steps to Fix:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `university-marketplace-39d89`
3. Click on **Storage** in the left sidebar
4. Click on the **Rules** tab
5. Replace the rules with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Product images - users can upload to their own folder
    match /products/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Profile images - users can upload their own profile picture
    match /profiles/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Fallback for any other paths
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

6. Click **Publish**

**IMPORTANT:** After publishing, wait 1-2 minutes for the rules to propagate, then try uploading again.

## Firestore Rules (if needed)

If you also get Firestore permission errors:

1. Go to **Firestore Database** in Firebase Console
2. Click on **Rules** tab
3. Use these rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{productId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Testing the Fix

After updating the rules:

1. Try adding a product with an image
2. Check the browser/app console for detailed error messages
3. The console will now show specific error codes like:
   - `storage/unauthorized` - Storage rules issue
   - `permission-denied` - Firestore rules issue
   - Network errors - Connection problems

## Debug Console Output

The updated code now logs:
- Upload progress for each image
- Specific error codes and messages
- Success confirmations

Check your console (browser DevTools or React Native debugger) for these messages.
