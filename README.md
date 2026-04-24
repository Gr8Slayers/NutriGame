<div align="center">

<img src="frontend/assets/logo.png" alt="NutriGame Logo" width="140"/>

#  NutriGame

**Turn healthy living into a game.**

[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![CockroachDB](https://img.shields.io/badge/CockroachDB-Cloud-6933FF?style=for-the-badge&logo=cockroachlabs&logoColor=white)](https://www.cockroachlabs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Google Gemini](https://img.shields.io/badge/Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

🌐 **[Visit the NutriGame Website](https://gr8slayers.github.io/nutrigame-website)** &nbsp;|&nbsp; 📱 **[Try the PWA](https://gr8slayers.github.io/nutrigame-website)**

</div>

---

##  Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Internationalization](#-internationalization)
- [Contributing](#-contributing)

---

##  About the Project

**NutriGame** is a next-generation mobile and web application that combines healthy nutrition and lifestyle habits with a fun, game-like experience. Users can log their meals, join goal-based challenges with friends or the community, chat with an AI-powered dietitian, and track their physical and emotional progress in real time.

> *"When staying healthy becomes a game, winning gets a whole lot easier."*

### Why NutriGame?

| Problem | NutriGame Solution |
|---------|-------------------|
| Diet apps feel boring |  Gamification makes every day rewarding |
| Hard to stay motivated alone |  Challenges and a social feed keep you going |
| Looking up food calories takes time |  Instant nutritional analysis from a photo |
| Dietitian costs are high |  24/7 accessible AI dietitian |
| Language barriers |  Full Turkish & English support |

---

##  Features

###  Nutrition & Progress Tracking

- **Personalized Calorie & Macro Goals** — Automatic goal calculation based on age, gender, weight, and activity level (Harris-Benedict formula)
- **Detailed Meal Journal** — Portion-based food logging across Breakfast, Lunch, Dinner, and Snack categories
- **Water Tracking** — Log daily water intake quickly using various cup/bottle sizes
- **Weight & Mood Dashboard** — 7-day weight trend chart, progress bar toward target weight, and a 5-level daily mood tracker (😫 😕 😐 🙂 🤩)
- **Weekly Summary** — A dashboard summarizing all nutrition and activity data for the week

###  AI-Powered Tools

- **Food Scan (Visual Recognition)** — Analyze calories and nutritional values in seconds from a camera photo or gallery image via the Gemini Vision API
- **NutriBot — AI Dietitian Chatbot** — Google Gemini API-powered multi-turn conversation with session memory; personalized diet plans, meal suggestions, and instant answers to health questions
- **Smart Food Search & Cache** — Food database queries are cached so repeat searches return instant results

###  Gamification System

- **Streak Tracking** — Current and longest streaks are automatically updated every time you open the app, with a Lottie-animated reward screen
- **Points System** — Earn points for completing daily goals, finishing challenges, and maintaining streaks
- **Avatar System** — Unlockable avatars for different levels; profile photo upload support
- **Badges** — Predefined milestone badges (first streak, first challenge, etc.)
- **Challenges** — User-created or community challenges with time limits and goal targets (Drink More Water, Burn Calories, Step Up…)
- **Leaderboard** — Real-time participant ranking within each challenge

###  Social Nutrition Feed

- **Post Sharing** — Upload food photos and share text posts
- **Recipe Sharing** — Fully structured recipe sharing with step-by-step instructions, ingredient lists, calorie counts, and prep times
- **Follow & Engage** — Search for and follow users, like and comment on posts
- **Filtered Feed** — See only posts from people you follow and your own content
- **Challenge Links** — Challenge-related posts are linked to the relevant challenge

###  Notifications & UX

- **Push Notifications** — Expo Notifications integration (Android & Web VAPID) for streak reminders and social interaction alerts
- **Multi-Language Support** — Full Turkish and English interface; switch languages instantly
- **Glassmorphism UI** — Modern frosted-glass effects, SVG animations, and custom Lottie animations
- **Notification Center** — Manage read/unread notifications in one place

---

##  Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│    iOS / Android (Expo Go)    Web (Vercel PWA)        │
└────────────────────┬────────────────────────────────────────┘
                     │  HTTPS / REST API
┌────────────────────▼────────────────────────────────────────┐
│                    BACKEND (Render.com)                      │
│              Node.js + Express + TypeScript                  │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────────┐  │
│  │   Auth   │ │   Food    │ │  Social  │ │Gamification  │  │
│  │   JWT    │ │ Vision AI │ │  Feed    │ │  Challenges  │  │
│  └──────────┘ └───────────┘ └──────────┘ └──────────────┘  │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Chatbot  │ │  Cron     │ │  Push    │ │   Multer     │  │
│  │ Gemini   │ │  Jobs     │ │  Notif.  │ │  Uploads     │  │
│  └──────────┘ └───────────┘ └──────────┘ └──────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │  Prisma ORM
┌────────────────────▼────────────────────────────────────────┐
│               CockroachDB (Cloud / Serverless)               │
│   Users · MealLogs · Challenges · Posts · Badges · Chat...  │
└─────────────────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  External Services                           │
│    Google Gemini API   Expo Push Notification API      │
└─────────────────────────────────────────────────────────────┘
```

---

##  Tech Stack

### Frontend (Mobile & Web)

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React Native | 0.81.5 |
| Platform | Expo | ~54.0 |
| Language | TypeScript | ~5.9 |
| Navigation | React Navigation Native Stack | ^7.6 |
| UI Components | React Native Paper | ^5.14 |
| Animations | Lottie React Native | ^7.3 |
| Reanimated | React Native Reanimated | ~4.1 |
| Graphics | Shopify React Native Skia | 2.2.12 |
| Chat UI | React Native Gifted Chat | ^3.2 |
| Markdown | React Native Markdown Display | ^7.0 |
| Notifications | Expo Notifications | ~0.32 |
| Secure Storage | Expo Secure Store | ~15.0 |
| Localization | Expo Localization | ^55.0 |
| Image Picker | Expo Image Picker | ~17.0 |

### Backend (API)

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | ≥20.0 |
| Framework | Express.js | ^4.21 |
| Language | TypeScript | ^5.9 |
| ORM | Prisma | ^5.22 |
| Database | CockroachDB | Cloud |
| AI | Google Generative AI | ^0.24 |
| Authentication | JSON Web Token | ^9.0 |
| Password Hashing | bcryptjs | ^2.4 |
| File Uploads | Multer | ^2.1 |
| Scheduler | node-cron | ^4.2 |
| Validation | Zod | ^3.23 |
| Push Notifications | Expo Server SDK | ^6.1 |
| Testing | Jest + Supertest | ^30 |

---

## 📂 Project Structure

```
nutrigame/
│
├── 📁 backend/                        # Node.js + Express API Server
│   ├── prisma/
│   │   ├── schema.prisma              # Database schema definitions
│   │   ├── seed-badges.ts             # Badge seed data
│   │   └── seed-foods.ts              # Food database seed data
│   ├── src/
│   │   ├── config/                    # Prisma & DB connection configuration
│   │   ├── controllers/               # Business logic layer
│   │   │   ├── auth.controller.ts     # Register / Login / Token
│   │   │   ├── chatbot.controller.ts  # Gemini AI chat sessions
│   │   │   ├── dailyprogress.ctrl.ts  # Daily progress & mood
│   │   │   ├── food.controller.ts     # Food search & logging
│   │   │   ├── foodrecognition.ctrl.ts# Image-based food analysis
│   │   │   ├── gamification.ctrl.ts   # Streak, badge, challenge, points
│   │   │   ├── image.controller.ts    # Avatar & image serving
│   │   │   ├── social.controller.ts   # Posts, comments, likes, follows
│   │   │   └── user.controller.ts     # Profile, weight, notification settings
│   │   ├── jobs/
│   │   │   └── cron.ts                # Scheduled tasks (streak, notifications)
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts      # JWT validation layer
│   │   ├── models/                    # Database query abstractions
│   │   ├── routes/                    # Express Router endpoints
│   │   │   ├── auth.routes.ts
│   │   │   ├── chatbot.routes.ts
│   │   │   ├── dailyprogress.routes.ts
│   │   │   ├── food.routes.ts
│   │   │   ├── food.recognition.routes.ts
│   │   │   ├── gamification.routes.ts
│   │   │   ├── image.routes.ts
│   │   │   ├── social.routes.ts
│   │   │   └── user.routes.ts
│   │   ├── scripts/                   # Demo seed & utility scripts
│   │   ├── services/                  # External service integrations
│   │   ├── tests/                     # Jest integration tests
│   │   ├── types/                     # TypeScript type definitions
│   │   ├── utils/                     # Helper functions
│   │   ├── validation/                # Zod schema validation
│   │   └── index.ts                   # Express application entry point
│   └── package.json
│
├── 📁 frontend/                       # React Native / Expo Application
│   ├── assets/                        # Images, Lottie files, Icons
│   │   ├── avatars/                   # User avatar collection
│   │   └── badges/                    # Badge images
│   ├── components/                    # Reusable UI components
│   ├── constants/                     # Global constants
│   ├── context/
│   │   └── AuthContext.tsx            # JWT authentication context
│   ├── hooks/
│   │   ├── useAppInsets.ts            # Safe area management
│   │   └── usePushNotifications.ts    # Push notification hook
│   ├── i18n/
│   │   ├── LanguageContext.tsx        # Language context & provider
│   │   └── translations.ts            # TR / EN translation dictionary
│   ├── screens/                       # Application screens
│   │   ├── AddMeal.tsx                # Add a meal
│   │   ├── AddWater.tsx               # Water tracking
│   │   ├── ChallengeProgress.tsx      # Challenge detail view
│   │   ├── Challenges.tsx             # Challenge list
│   │   ├── Chatbot.tsx                # AI dietitian chat
│   │   ├── CreateAvatar.tsx           # Avatar selection
│   │   ├── CreateChallenge.tsx        # Create a new challenge
│   │   ├── DailyWeight.tsx            # Weight & mood tracking
│   │   ├── EditProfile.tsx            # Profile editing
│   │   ├── FindFriends.tsx            # User search
│   │   ├── Login.tsx                  # Login screen
│   │   ├── MainPage.tsx               # Main dashboard
│   │   ├── Menu.tsx                   # Meal menu
│   │   ├── NewPost.tsx                # Create a post
│   │   ├── Notifications.tsx          # Notification center
│   │   ├── ProfileSettingsMenu.tsx    # Profile settings
│   │   ├── ScanFood.tsx               # Camera-based food recognition
│   │   ├── SignUp.tsx                 # Sign-up screen
│   │   ├── SignUpEnterData.tsx        # User data entry
│   │   ├── SocialFeed.tsx             # Social feed
│   │   ├── UserProfile.tsx            # User profile
│   │   └── WeeklySummary.tsx          # Weekly summary
│   ├── styles/                        # StyleSheet definitions
│   ├── types/                         # TypeScript interfaces
│   ├── utils/
│   │   └── uploadHelper.ts            # Image upload helpers
│   ├── App.tsx                        # Navigation & provider setup
│   ├── storage.ts                     # Platform-aware secure storage
│   └── package.json
│
├── launch.bat                         # Quick-start script for Windows
├── launch.sh                          # Quick-start script for Unix/macOS
└── README.md
```

---

##  Database Schema

NutriGame uses the following data models managed by **Prisma ORM** on **CockroachDB**:

```
Users
 ├── UserProfile       (age, gender, weight, target, avatar)
 ├── Streak            (streak count, total points, last active day)
 ├── DailyProgress     (daily calories, weight, mood, movement)
 ├── MealLog           (food name, category, calories/protein/fat/carbs)
 ├── WaterLog          (water amount, date)
 ├── MealPhoto         (meal photo URL, date)
 ├── ChatSession[]     → ChatMessage[]  (AI chat sessions)
 ├── Notification[]    (push notifications)
 ├── UserBadge[]       → Badge          (earned badges)
 └── UserFollow        (follow relationships)

Posts
 ├── PostLike[]        (likes)
 ├── PostComment[]     (comments)
 └── Challenge?        (linked challenge)

Challenges
 └── ChallengeParticipant[]  (participants, roles, status)

FoodLookup            (food database — id, calories, macros)
FoodSearchCache       (search result cache)
UploadedFile          (binary file storage)
```

---

##  API Reference

###  Auth Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Log in and receive a JWT |

###  User Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users/profile` | Get user profile |
| `PUT` | `/api/users/profile` | Update profile information |
| `GET` | `/api/users/search` | Search for users |
| `POST` | `/api/users/follow/:id` | Follow a user |
| `DELETE` | `/api/users/follow/:id` | Unfollow a user |
| `PUT` | `/api/users/expo-token` | Register a push token |

###  Food Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/food/search` | Search for food |
| `POST` | `/api/food/log` | Log a meal |
| `GET` | `/api/food/log` | Get today's meals |
| `DELETE` | `/api/food/log/:id` | Delete a meal entry |
| `POST` | `/api/food/water` | Log water intake |
| `GET` | `/api/food/water` | Get water intake data |

###  Food Recognition
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/food-recognition/analyze` | Analyze food from a photo |

###  Daily Progress
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/daily-progress` | Get daily progress data |
| `POST` | `/api/daily-progress/weight` | Log weight |
| `POST` | `/api/daily-progress/mood` | Log mood |

###  Gamification
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/gamification/streak` | Get streak info |
| `POST` | `/api/gamification/streak` | Update streak |
| `GET` | `/api/gamification/badges` | List badges |
| `GET` | `/api/gamification/challenges` | List challenges |
| `POST` | `/api/gamification/challenges` | Create a new challenge |
| `POST` | `/api/gamification/challenges/:id/join` | Join a challenge |
| `PUT` | `/api/gamification/challenges/:id/progress` | Update progress |

###  Social
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/social/feed` | Get social feed |
| `POST` | `/api/social/posts` | Create a new post |
| `POST` | `/api/social/posts/:id/like` | Like / unlike a post |
| `POST` | `/api/social/posts/:id/comment` | Add a comment |
| `GET` | `/api/social/posts/:id/comments` | Get comments |

###  Chatbot
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/chatbot/sessions` | List chat sessions |
| `POST` | `/api/chatbot/sessions` | Start a new session |
| `POST` | `/api/chatbot/sessions/:id/message` | Send a message |
| `DELETE` | `/api/chatbot/sessions/:id` | Delete a session |

###  Image
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/images/upload` | Upload an image |
| `GET` | `/api/images/:id` | Retrieve an image |

---

##  Installation & Setup

### Prerequisites

- **Node.js** v20+ ([download here](https://nodejs.org/))
- **npm** v9+ or **yarn**
- **Expo CLI** — `npm install -g expo-cli`
- **CockroachDB** — Create a free cloud account at [cockroachlabs.com](https://www.cockroachlabs.com/)
- **Google Gemini API Key** — Obtain one at [ai.google.dev](https://ai.google.dev/)

---

###  1. Backend Setup

```bash
# Navigate to the backend folder
cd nutrigame/backend

# Install dependencies
npm install

# Configure environment variables
cp env_example .env
# Edit the .env file (see Environment Variables section below)

# Create database tables
npx prisma db push

# (Optional) Seed initial data — food database & badges
npx ts-node prisma/seed-foods.ts
npx ts-node prisma/seed-badges.ts

# Start the development server
npm run dev
```

The **backend** runs on `http://localhost:3000` by default.

---

###  2. Frontend Setup

```bash
# Navigate to the frontend folder
cd nutrigame/frontend

# Install dependencies
npm install

# Configure environment variables
cp env_example .env
# Add your backend URL to the .env file

# Start the Expo development server
npm start
```

Run on a specific platform:

```bash
npm run android   # Open in Android emulator
npm run ios       # Open in iOS simulator
npm run web       # Open in the browser (PWA)
```

To test on a physical device, install the **Expo Go** app and scan the QR code.

---

###  3. Quick Start (Windows)

```bat
launch.bat
```

This script starts both the backend and the frontend simultaneously.

---

##  Environment Variables

### Backend — `backend/.env`

```env
# Server
PORT=3000

# Database
DATABASE_URL="postgresql://user:password@cockroach-host:26257/nutrigame?sslmode=verify-full"

# Authentication
JWT_KEY="your_secret_jwt_key"

# AI
GEMINI_API_KEY="your_google_ai_api_key"

# Push Notifications (Web VAPID)
VAPID_PUBLIC_KEY="your_vapid_public_key"
VAPID_PRIVATE_KEY="your_vapid_private_key"
```

### Frontend — `frontend/.env`

```env
# Local IP for development
IP_ADDRESS=192.168.1.100

# Render.com backend URL for production
API_URL=https://your-backend.onrender.com
```

---

##  Testing

The project includes integration tests for the backend API using Jest + Supertest.

```bash
cd backend

# Run all tests
npm test

# Run a specific test file
npm test -- src/tests/auth.test.ts
```

Test files are located in `backend/src/tests/`.

---

##  Deployment

### Backend → Render.com

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repository and set `backend/` as the root directory
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add your `.env` values in the Environment Variables panel

### Frontend → Vercel (PWA)

1. Create a new project on [vercel.com](https://vercel.com)
2. Set `frontend/` as the root directory
3. Add the backend URL in the Environment Variables panel:
   ```
   API_URL = https://your-backend.onrender.com
   ```
4. Deploy — the PWA will be accessible from any browser

---

##  Internationalization

NutriGame provides full **Turkish** and **English** support across the entire app interface.

- Language strings are defined in `frontend/i18n/translations.ts`
- The `LanguageContext` stores the user's language preference and enables instant switching
- The device language is detected automatically via `expo-localization`
- Language settings are available in the `ProfileSettingsMenu` screen

---

##  Contributing

1. **Fork** the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -m "feat: add new feature"`
4. Push the branch: `git push origin feature/new-feature`
5. Open a **Pull Request**

---

##  License

This project is licensed under the MIT License.

---

<div align="center">

**Stay Healthy, Gain by Playing with NutriGame!** 🥗🏅

*Made with ❤️ by the Gr8Slayers Team*

</div>
