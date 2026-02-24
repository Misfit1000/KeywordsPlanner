# Keyword Intelligence Dashboard

A real-time keyword research tool powered by Gemini AI.

## Vercel Deployment

To deploy this application to Vercel, follow these steps:

1.  **Push your code to a GitHub repository.**
2.  **Import the project into Vercel.**
3.  **Configure Environment Variables:**
    In the Vercel project settings, add the following environment variables:
    -   `GEMINI_API_KEY`: Your Google Gemini API Key.
    -   `VITE_FIREBASE_API_KEY`: (Optional) Your Firebase API Key.
    -   `VITE_FIREBASE_AUTH_DOMAIN`: (Optional) Your Firebase Auth Domain.
    -   `VITE_FIREBASE_PROJECT_ID`: (Optional) Your Firebase Project ID.
    -   `VITE_FIREBASE_STORAGE_BUCKET`: (Optional) Your Firebase Storage Bucket.
    -   `VITE_FIREBASE_MESSAGING_SENDER_ID`: (Optional) Your Firebase Messaging Sender ID.
    -   `VITE_FIREBASE_APP_ID`: (Optional) Your Firebase App ID.

    *Note: If Firebase variables are not provided, the app will skip the login screen and use a guest session.*

4.  **Build Settings:**
    -   Framework Preset: `Vite`
    -   Build Command: `npm run build`
    -   Output Directory: `dist`

## Features

-   **Real-time Analysis:** Get instant search volume, difficulty, and CPC data.
-   **Trend Visualization:** Interactive charts showing search interest over multiple timeframes (1h to 5y).
-   **Global Reach:** Interactive world map with regional interest tooltips.
-   **Competitor Insights:** Identify top domains ranking for your target keywords.
-   **Local Search:** Integrated Google Maps results for local intent keywords.
-   **AI Landscape Analysis:** Deep dive into keyword opportunities and threats.

## Tech Stack

-   React 19
-   TypeScript
-   Tailwind CSS
-   Gemini AI API
-   Recharts
-   Framer Motion
-   Lucide Icons
