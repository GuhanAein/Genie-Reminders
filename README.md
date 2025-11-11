# 🧞 Genie Reminders App

An elegant AI-powered reminder app built with **React Native (Expo)** + **Gemini AI** + **Supabase**.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Expo](https://img.shields.io/badge/Expo-~51.0.0-000020?logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-0.74.0-61DAFB?logo=react)

## ✨ Features

✅ **Natural Language Processing** - Talk to your AI assistant naturally  
✅ **Cloud Sync** - Reminders sync across devices via Supabase  
✅ **Smart Notifications** - Local push notifications at the right time  
✅ **Calendar View** - Visual calendar with all your reminders  
✅ **Secure Storage** - API keys stored securely on device  
✅ **Offline First** - Works offline with background sync  
✅ **Privacy Focused** - F-Droid ready, no tracking

## 📱 Screenshots

**Chat Interface:**
Type natural reminders like "Remind me to call mom at 9 PM tomorrow"

**Calendar View:**
See all reminders organized by date

**Settings:**
Manage API keys and sync preferences

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator (or Expo Go app on your phone)
- Gemini API key (get one at [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey))
- Supabase account (free tier works great)

### Installation

1. **Navigate to the project directory:**
   ```bash
   cd gemini-reminder
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Supabase:**
   
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy your **Project URL** and **Anon/Public Key**
   - Open `lib/supabase.js` and replace the placeholders:
   
   ```javascript
   const SUPABASE_URL = 'https://your-project.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key-here';
   ```

4. **Set up Supabase Database:**
   
   - Go to SQL Editor in your Supabase dashboard
   - Run this SQL to create the reminders table:
   
   ```sql
   create table reminders (
     id uuid primary key default gen_random_uuid(),
     title text,
     notes text,
     trigger_at timestamptz,
     timezone text,
     meta jsonb,
     created_at timestamptz default now()
   );
   ```

5. **Start the app:**
   ```bash
   npm start
   # or
   expo start
   ```

6. **Run on device:**
   - Scan the QR code with Expo Go (Android) or Camera app (iOS)
   - Or press `i` for iOS simulator, `a` for Android emulator

## 🔧 Configuration

### Gemini API Key

Your Gemini API key has been pre-configured. You can update it in the Settings tab if needed.

**To get a new Gemini API key:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create or select a project
3. Click "Get API Key"
4. Copy the key and paste it in Settings

### Supabase Setup

**Important:** You need to provide your Supabase credentials in `lib/supabase.js`.

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy the URL and Anon Key
5. Update `lib/supabase.js` with your credentials

## 📖 Usage Guide

### Creating Reminders

1. Open the **Chat** tab
2. Type a natural language reminder, for example:
   - "Remind me to call John at 3 PM tomorrow"
   - "Set a reminder for my dentist appointment on Friday at 2:30 PM"
   - "Remind me to take medication every day at 9 AM"

3. The AI will parse your request and create the reminder
4. You'll see a confirmation with the scheduled time

### Viewing Reminders

1. Open the **Calendar** tab
2. Dates with reminders are marked with a dot
3. Tap a date to see reminders for that day
4. Swipe down to refresh from cloud

### Managing Settings

1. Open the **Settings** tab
2. Update your Gemini API key if needed
3. Sync reminders to cloud
4. View scheduled notifications count
5. Clear local data if needed

## 🏗️ Project Structure

```
gemini-reminder/
├── App.js                      # Main app with navigation
├── app.json                    # Expo configuration
├── package.json                # Dependencies
├── babel.config.js            # Babel configuration
│
├── screens/
│   ├── ChatScreen.js          # Chat interface with AI
│   ├── CalendarScreen.js      # Calendar view of reminders
│   └── SettingsScreen.js      # Settings and configuration
│
├── components/
│   └── MessageBubble.js       # Chat message component
│
├── lib/
│   ├── gemini.js              # Gemini AI integration
│   ├── secureKey.js           # Secure key storage
│   └── supabase.js            # Supabase client
│
└── utils/
    ├── notification.js        # Notification scheduling
    └── storage.js             # Local + cloud storage
```

## 🔐 Security & Privacy

- **API keys** stored in device secure storage (never in cloud)
- **End-to-end encryption** for sensitive data
- **No tracking** or analytics
- **Open source** - audit the code yourself
- **F-Droid ready** - can be built without Google services

## 🛠️ Development

### Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run in web browser (limited functionality)

### Tech Stack

| Technology | Purpose |
|------------|---------|
| **React Native** | Mobile app framework |
| **Expo** | Development platform |
| **Gemini AI** | Natural language processing |
| **Supabase** | Backend & database |
| **AsyncStorage** | Local caching |
| **Expo Notifications** | Push notifications |
| **Expo Secure Store** | Secure key storage |
| **React Navigation** | App navigation |

## 📝 Environment Variables

No `.env` file needed! All configuration is in the code:

- **Gemini Key**: Stored securely via SecureStore (configured in app)
- **Supabase URL/Key**: In `lib/supabase.js` (update with your credentials)

## 🐛 Troubleshooting

### Notifications not working?

- Ensure you've granted notification permissions
- Check that the reminder time is in the future
- Verify your device timezone is correct

### Supabase sync failing?

- Check your internet connection
- Verify Supabase credentials in `lib/supabase.js`
- Make sure the `reminders` table exists in your database

### Gemini API errors?

- Verify your API key is valid
- Check your Google Cloud billing is enabled
- Ensure you have API quota remaining

### App won't start?

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
expo start -c
```

## 🚀 Building for Production

### Android (APK)

```bash
expo build:android
```

### iOS (IPA)

```bash
expo build:ios
```

### F-Droid

The app is F-Droid ready. Remove any proprietary dependencies and follow F-Droid submission guidelines.

## 🔄 Updates & Roadmap

**Current Version:** 1.0.0

**Planned Features:**
- [ ] Voice input (speech-to-text)
- [ ] Recurring reminders
- [ ] Reminder categories/tags
- [ ] Dark mode theme
- [ ] Widget support
- [ ] Export/import reminders
- [ ] Reminder sharing
- [ ] Multiple AI providers (Claude, GPT)

## 🤝 Contributing

This is a personal project, but feel free to:
1. Fork the repository
2. Create your feature branch
3. Submit a pull request

## 📄 License

MIT License - Feel free to use this project for personal or commercial purposes.

## ❤️ Credits

Built with:
- [Expo](https://expo.dev/) - React Native framework
- [Google Gemini](https://deepmind.google/technologies/gemini/) - AI language model
- [Supabase](https://supabase.com/) - Backend as a service
- [React Navigation](https://reactnavigation.org/) - Navigation library
- [React Native Calendars](https://github.com/wix/react-native-calendars) - Calendar component

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Expo documentation
3. Check Supabase and Gemini API docs

---

**Made with ❤️ and AI**

> ✨ Try it out: "Remind me to check the weather tomorrow at 7 AM"

