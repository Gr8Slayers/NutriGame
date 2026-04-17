🌐 **[Visit the NutriGame Website](https://gr8slayers.github.io/nutrigame-website)**

# 🎮 NutriGame

NutriGame is a next-generation mobile lifestyle application that combines healthy living and nutrition with **gamification** elements, social connections, and AI-powered features.

Users can seamlessly log their meals, engage in goal-based challenges with friends or the community, interact with an AI-powered fitness coach, and dynamically track their physical and emotional progress (weight & mood monitoring).

---

## 🚀 Key Features

### 1. 🍎 Comprehensive Nutrition & Progress Tracking
- **Daily Calorie and Macro Targets:** Automated calorie and macronutrient goals tailored to the user's age, gender, weight, and fitness objectives.
- **Detailed Meal & Water Logging:** Add water intake, snacks, or main meals quickly. Provides precise, portion-based calculations.
- **Weight & Mood Dashboard:** A dynamic **Progress Bar** tracking the approach to a target weight, a 7-day weight trend chart, and a selectable daily mood board (😫, 😕, 😐, 🙂, 🤩).

### 2. 🤖 AI-Powered Tools
- **Food Scan (Image Recognition):** Take a photo of your meal or select one from your gallery to instantly analyze its calories and nutritional values within seconds.
- **AI Dietitian Chatbot (NutriBot):** Powered by the Gemini API, engage in uninterrupted chat sessions for personalized diet plans, meal suggestions, and general health Q&A.

### 3. 🏆 Gamification & Challenges
- **Streaks:** Stay motivated by recording consecutive active days through the app.
- **Challenges:** Set your personal goals or join community tasks like "Drink More Water," "Burn Calories," or "Step Up" to earn points.
- **Badges & Levels:** Unlock brand-new avatars, abilities, and unique achievement badges as you surpass predefined milestones.

### 4. 🌍 Social Nutrition Feed
- **Posts & Recipe Sharing:** Don't just share a nice plate or a workout moment—share step-by-step recipes, including calorie counts and prep times, with your network.
- **Following & Engagement:** Discover and follow other users, comment on their posts, and hit the like button for encouragement.

---

## 🛠 Tech Stack

### Frontend (Mobile App)
- **Framework:** React Native & *Expo*
- **Navigation:** `@react-navigation/native-stack`
- **UI & Animations:** Lottie (Micro-Animations), React Native Paper, SVG, and custom components designed with a focus on Modern aesthetics & Glassmorphism.
- **State & Auth Management:** `expo-secure-store` (JWT-Based Session), Context API / Custom Hooks, Fetch API.

### Backend (API Server)
- **Infrastructure:** Node.js, Express.js (TypeScript)
- **Database & ORM:** **CockroachDB** (Cloud-Native Scale) integrated via Prisma ORM.
- **AI Integration:** Google Gemini API for Chatbot functionality and Food Vision processing.
- **File Uploads:** `multer` (Architected for image uploads and local serving / ready for S3 migration).
- **Security:** JWT-based authentication middleware (`authMiddleware`) and encrypted credentials.

---

## 📂 Project Structure

\`\`\`bash
nutrigame/
├── backend/                  # Node.js + Express API
│   ├── prisma/               # Database Schemas (schema.prisma)
│   └── src/
│       ├── config/           # Prisma, DB, and Env configurations
│       ├── controllers/      # Business Logic (Food, User, Gamification, etc.)
│       ├── middleware/       # JWT Auth and Error handling layers
│       ├── models/           # DB query abstractions (Repository Pattern)
│       └── routes/           # API Endpoint routers
└── frontend/                 # React Native / Expo Application
    ├── assets/               # Images, Lottie files, Icons
    ├── screens/              # App Screens (WeeklySummary, DailyWeight, Menu...)
    ├── styles/               # Independent StyleSheet definitions
    └── types/                # Typescript interfaces & dictionaries
\`\`\`

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+ recommended)
- Expo CLI
- CockroachDB (Local instance or Cloud cluster)

### 1. Setting Up the Backend
1. Navigate to the `backend/` directory.
2. Install dependencies: `npm install`
3. Create a `.env` file and assign the basic variables:
   \`\`\`env
   PORT=3000
   DATABASE_URL="postgresql://user:password@cockroach-host:26257/nutrigame?sslmode=verify-full"
   JWT_KEY="your_secret_key"
   GEMINI_API_KEY="your_google_ai_key"
   \`\`\`
4. Synchronize database tables: `npx prisma db push`
5. Start the development server: `npm run dev` (or compile and `npm start`)

### 2. Setting Up the Frontend
1. Navigate to the `frontend/` directory.
2. Install dependencies: `npm install`
3. Configure Expo to target your Backend IP. Create a `.env` in the root:
   \`\`\`env
   IP_ADDRESS=192.168.1.100  # Your Local IP mapping to the backend server
   \`\`\`
4. Start the application: `npx expo start` or `npm start`
5. To test the app on your mobile device, scan the QR code using "Expo Go".

---

*Stay Healthy, Gain by Playing with NutriGame!* 🥗🏅
