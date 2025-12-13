# DayGo App Store Submission Guide

## Pre-Submission Checklist

### 1. Apple Developer Setup
- [x] Apple Developer account active
- [x] App ID registered: `com.daygo.habits`
- [x] Team ID: `2MMDRLGY9S`
- [ ] App created in App Store Connect
- [ ] Get Apple ID (numeric) from App Store Connect → App Information

### 2. Project Configuration
- [x] Bundle ID updated in `app.json`: `com.daygo.habits`
- [x] EAS credentials in `eas.json`
- [ ] Add `ascAppId` to `eas.json` once you have it

---

## App Store Connect Submission

### Step 1: Screenshots (Required)

**Minimum:** 1 screenshot for 6.5" iPhone
**Recommended:** 3-5 screenshots showing key features

| Screenshot | Screen | Dimensions |
|------------|--------|------------|
| 1 | Today (habits at 100%) | 1284 × 2778px |
| 2 | Dashboard (7-day view) | 1284 × 2778px |
| 3 | Goals screen | 1284 × 2778px |
| 4 | Journal prompts | 1284 × 2778px |
| 5 | Profile screen | 1284 × 2778px |

**How to capture:**
```bash
# Run in Simulator
npx expo start --ios

# In Simulator: Cmd + S to save screenshot
# Screenshots save to Desktop
```

**Tips:**
- Use iPhone 14/15 Pro Max Simulator for correct dimensions
- Show app in "ideal" state (100% completion, sample data)
- Avoid showing personal/real user data

---

### Step 2: App Metadata

#### Promotional Text (170 characters)
```
Build better habits, one day at a time. Track daily habits, set mantras, journal your thoughts, and achieve your goals with DayGo.
```

#### Description (4000 characters max)
```
DayGo is your simple, focused companion for building better daily habits. Track what matters, reflect on your day, and watch your progress grow.

DAILY HABITS
Create and track the habits that matter most to you. Check them off as you complete them throughout the day and watch your daily score climb. Start with a few key habits and build from there.

DAILY MANTRAS
Set powerful affirmations and reminders that keep you motivated. Your mantras appear alongside your habits, keeping your mindset aligned with your actions.

JOURNAL PROMPTS
Add personal reflection questions that you answer each day. Whether it's "What am I grateful for?" or "What's my focus today?", daily journaling helps you stay mindful and intentional.

TRACK YOUR PROGRESS
See your daily score based on habit completion. View your 7-day history, track your streak, and celebrate your best days. The dashboard gives you a clear picture of your consistency.

SET BIGGER GOALS
Create long-term goals and link them to your daily habits. Track progress toward reading more books, running more miles, or any measurable objective that matters to you.

SIMPLE & FOCUSED
No complicated features or overwhelming options. DayGo focuses on what works: consistent daily action. Add your habits, check them off, and build momentum.

PRIVACY FIRST
Your data is yours. We don't sell or share your personal information. Delete your account anytime and all your data goes with it.

Start building the life you want, one day at a time.
```

#### Keywords (100 characters, comma-separated)
```
habit tracker,daily habits,routine,goals,journal,mantra,self improvement,productivity,wellness,score
```

#### Other Fields
| Field | Value |
|-------|-------|
| Support URL | `https://www.daygo.live/privacy` |
| Marketing URL | (optional) |
| Version | `1.0` |
| Copyright | `© 2024 DayGo` |

---

### Step 3: Build & Upload

#### Option A: EAS Build + Submit (Recommended)
```bash
# Build for production
eas build --platform ios --profile production

# Wait for build to complete, then submit
eas submit --platform ios
```

#### Option B: Local Build with Xcode
```bash
# Generate native project
npx expo prebuild --platform ios

# Open in Xcode
open ios/daygo.xcworkspace

# In Xcode: Product → Archive → Distribute App
```

---

### Step 4: App Review Information

#### Sign-In Credentials (Required)
Create a demo account before submission:

| Field | Value |
|-------|-------|
| Sign-in required | Yes (checked) |
| User name | `demo@daygo.live` |
| Password | `[your demo password]` |

**Demo Account Setup:**
1. Register a new account with the demo email
2. Add 3-5 sample habits
3. Add 2-3 mantras
4. Add 2-3 journal prompts
5. Complete some habits to show progress
6. Create 1-2 goals

#### Contact Information
| Field | Value |
|-------|-------|
| First name | [Your first name] |
| Last name | [Your last name] |
| Phone number | [Your phone] |
| Email | [Your email] |

#### Review Notes
```
Demo account has pre-populated sample habits, mantras, and journal prompts to demonstrate app functionality.

To test core features:
1. TODAY TAB: View and complete daily habits. Tap the checkbox to mark habits complete and watch the score update.
2. DASHBOARD TAB: View 7-day progress history and streak information.
3. GOALS TAB: View long-term goals and their progress.
4. PROFILE TAB: Access privacy policy and account management (including account deletion).

All features are functional. The app requires an internet connection to sync data with our servers.
```

---

### Step 5: App Privacy (Privacy Nutrition Label)

In App Store Connect → App Privacy, answer questions about data collection:

#### Data Types Collected
| Data Type | Collected | Linked to User | Used for Tracking |
|-----------|-----------|----------------|-------------------|
| Email Address | Yes | Yes | No |
| User Content (habits, journals) | Yes | Yes | No |
| Identifiers (user ID) | Yes | Yes | No |
| Diagnostics (crash data) | Yes | No | No |

#### Data Use Purposes
- **App Functionality**: Email, user content, identifiers
- **Analytics**: Crash diagnostics only

---

### Step 6: Age Rating

Answer the content questions in App Store Connect:

| Question | Answer |
|----------|--------|
| Cartoon or Fantasy Violence | None |
| Realistic Violence | None |
| Sexual Content or Nudity | None |
| Profanity or Crude Humor | None |
| Alcohol, Tobacco, or Drug Use | None |
| Simulated Gambling | None |
| Horror/Fear Themes | None |
| Mature/Suggestive Themes | Infrequent/Mild |
| Medical/Treatment Information | None |
| Unrestricted Web Access | None |

**Result:** 12+ rating (matches privacy policy "not for under 13")

---

### Step 7: Release Options

| Option | When to Use |
|--------|-------------|
| **Manually release** | First submission - gives you control |
| Automatically release | Future updates |
| Scheduled release | Marketing launches |

**Recommendation:** Select "Manually release this version" for first submission.

---

## Post-Submission

### Expected Timeline
- **Initial review:** 24-48 hours (can be longer)
- **Common delays:** Missing screenshots, metadata issues, demo account problems

### If Rejected
1. Read rejection reason carefully in Resolution Center
2. Fix the issue
3. Resubmit (no need to create new build if code unchanged)

### After Approval
1. Manually release when ready (if you chose manual)
2. Monitor for crashes in App Store Connect → Analytics
3. Respond to user reviews

---

## Quick Commands Reference

```bash
# Development
npx expo start

# iOS Simulator
npx expo start --ios

# Build for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios

# Check build status
eas build:list

# View credentials
eas credentials
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `app.json` | Expo config, bundle ID, version |
| `eas.json` | Build & submit configuration |
| `APP_STORE_METADATA.md` | App Store text content |
| `PRIVACY_POLICY.md` | Privacy policy content |
| `privacy.html` | Web-hosted privacy policy |

---

## Support

- **Apple Developer Support:** https://developer.apple.com/support/
- **Expo EAS Docs:** https://docs.expo.dev/submit/ios/
- **App Store Review Guidelines:** https://developer.apple.com/app-store/review/guidelines/
