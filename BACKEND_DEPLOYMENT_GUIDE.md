# Backend Deployment Guide - IMPORTANT FOR 24/7 CHECKOUT

## The Problem
Your checkout stops working when the Emergent agent sleeps because the backend API is hosted on Emergent's preview server.

## The Solution
Deploy your backend to Railway (free tier, always running).

---

## Step-by-Step Instructions:

### 1. Create a Railway Account
Go to https://railway.app and sign up with GitHub

### 2. Create New Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Connect your GitHub account if not already connected
- Select your repository

### 3. Configure the Backend Service
- Railway will auto-detect the backend folder
- If not, manually set the root directory to `/backend`

### 4. Add Environment Variables
In Railway dashboard, go to Variables tab and add:

```
MONGO_URL=<your-mongodb-connection-string>
DB_NAME=bsign_store
CORS_ORIGINS=https://www.acrylicbraillesigns.com,https://acrylicbraillesigns.com
NOTIFICATION_EMAIL=acrylicbraillesigns@gmail.com
SENDER_EMAIL=acrylicbraillesigns@gmail.com
SENDER_PASSWORD=<your-app-password>
STRIPE_API_KEY=<your-stripe-secret-key>
PORT=8001
```

**IMPORTANT**: For MongoDB, you need a cloud MongoDB. Options:
- MongoDB Atlas (free tier): https://www.mongodb.com/cloud/atlas
- Create a free cluster and get the connection string

### 5. Deploy
Railway will automatically deploy and give you a URL like:
`https://your-app.railway.app`

### 6. Update Frontend
After Railway deployment, update `/app/frontend/src/config/api.ts`:
Change the BACKEND_URL to your Railway URL

---

## Alternative: Render.com

### 1. Go to https://render.com
### 2. Create a Web Service
### 3. Connect GitHub repo
### 4. Set build command: `pip install -r requirements.txt`
### 5. Set start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
### 6. Add same environment variables as above

---

## MongoDB Atlas Setup (Required for cloud deployment)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a free cluster (M0 Sandbox)
4. Create database user with password
5. Add 0.0.0.0/0 to IP whitelist (allows all IPs)
6. Get connection string (looks like): 
   `mongodb+srv://username:password@cluster.xxxxx.mongodb.net/bsign_store`

---

## After Deployment

Once your backend is on Railway/Render with the new URL, update:
`/app/frontend/src/config/api.ts`

Change:
```typescript
const BACKEND_URL = 'https://coding-walkthrough.preview.emergentagent.com';
```

To:
```typescript
const BACKEND_URL = 'https://your-railway-app.railway.app';
```

Then redeploy your Netlify frontend.

Your checkout will work 24/7 regardless of Emergent agent status.
