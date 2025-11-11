# 🎨 Assets Folder

This folder contains the app's visual assets (icons, splash screen, etc.)

## Required Files

Expo will generate default assets, but you can customize them:

### App Icon (`icon.png`)
- **Size:** 1024x1024 px
- **Format:** PNG
- **Purpose:** App icon shown on home screen
- **Default:** Expo provides a placeholder

### Splash Screen (`splash.png`)
- **Size:** 1284x2778 px (or any high resolution)
- **Format:** PNG
- **Purpose:** Loading screen when app starts
- **Default:** Expo provides a placeholder

### Adaptive Icon (`adaptive-icon.png`)
- **Size:** 1024x1024 px
- **Format:** PNG
- **Purpose:** Android adaptive icon
- **Default:** Expo provides a placeholder

### Favicon (`favicon.png`)
- **Size:** 48x48 px (or larger)
- **Format:** PNG
- **Purpose:** Web browser icon
- **Default:** Expo provides a placeholder

### Notification Icon (`notification-icon.png`)
- **Size:** 96x96 px
- **Format:** PNG (with transparency)
- **Purpose:** Android notification icon (should be white silhouette)
- **Default:** Expo provides a placeholder

---

## How to Customize

### Option 1: Use Expo's Asset Generator

1. Create a single high-res icon (1024x1024)
2. Use Expo's asset generator:
   ```bash
   npx expo-optimize
   ```

### Option 2: Manual Creation

1. Design your icons in Figma, Sketch, or similar
2. Export at required sizes
3. Replace the files in this folder
4. Keep original filenames

### Option 3: Use Defaults (Easiest!)

Expo automatically provides placeholder assets. The app will work fine without custom icons!

---

## Design Tips for App Icon 🎨

For a **reminder/genie** themed icon:

- Use a **genie lamp** (🧞) or **bell** (🔔) symbol
- Colors: Blue (#007AFF) and white for iOS style
- Keep it simple - icons need to look good at small sizes
- Test on both light and dark backgrounds

### Free Icon Resources:

- [Figma](https://www.figma.com) - Design from scratch
- [Flaticon](https://www.flaticon.com) - Free icon library
- [IconKitchen](https://icon.kitchen/) - Android icon generator

---

## Current Status

✅ **App will work with default Expo assets**

You can customize later by adding your own icons to this folder!

---

**Note:** The app is fully functional without custom assets. Expo provides nice defaults!

