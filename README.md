# Weather Dashboard Deployment Guide

## Backend deployment
1. Create a Render/Railway/Heroku app.
2. Set these environment variables:
   - OPENWEATHER_KEY=<your OpenWeather API key>
   - MONGODB_URI=<your MongoDB connection string>
   - PORT=5000
3. Deploy the backend and copy the live URL.

## Frontend deployment
1. Deploy the frontend to Netlify, Vercel, or GitHub Pages.
2. In the deployed site, set a global variable before loading the app:
   window.__API_BASE_URL__ = 'https://your-backend-url'
3. Rebuild/redeploy the frontend.

## Local development
- Backend: node server.js
- Frontend: open index.html or use a simple static server
- If you want the local frontend to use the local backend, leave the default value in app.js (http://localhost:5000).
