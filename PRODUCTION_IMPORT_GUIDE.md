# 🚀 Production Database Import Guide

This guide will help you import all products, reviews, and content from your preview environment to your live production database on Render.

## 📦 What Will Be Imported?

- **6 Products** (Door Number Signs, Restroom Signs, etc.)
- **10 Reviews** (Customer reviews for products)
- **1 Content Section** (Homepage content)

## 🔧 Prerequisites

1. ✅ Admin credentials updated on Render (DONE)
2. 📝 Your production MongoDB connection string from Render

## 📋 Step-by-Step Instructions

### Option A: Using the Import Script (Recommended)

#### Step 1: Get Your Production MongoDB URL
1. Go to your Render dashboard
2. Find your **MongoDB service** (or external MongoDB provider)
3. Copy the **connection string** (looks like: `mongodb://username:password@host:port/database` or `mongodb+srv://...`)

#### Step 2: Download the Files
You need two files:
- `/tmp/preview_db_export.json` - The exported data
- `/tmp/import_to_production.py` - The import script

You can download these from the preview environment or I can provide alternative methods.

#### Step 3: Run the Import Script

```bash
# Make sure you have Python 3 and motor installed
pip install motor

# Run the import script
python3 import_to_production.py
```

When prompted:
- Enter your **production MongoDB URL**
- Enter database name: `bsign_store` (or press Enter for default)

The script will:
- ✅ Connect to your production database
- ✅ Import all products (6 items)
- ✅ Import all reviews (10 items)
- ✅ Import content sections (1 item)
- ✅ Update existing items if they already exist
- ✅ Show you a summary when done

---

### Option B: Using MongoDB Compass or mongoimport (Alternative)

If you prefer a GUI tool:

1. **Download MongoDB Compass**: https://www.mongodb.com/products/compass
2. **Connect to your production database** using your MongoDB URL
3. **For each collection** (products, reviews, content_sections):
   - Select the collection
   - Click "Add Data" → "Import JSON or CSV"
   - Select the appropriate data from `preview_db_export.json`
   - Click Import

---

### Option C: Using Render Backend to Import (Easiest)

If you don't want to deal with MongoDB directly, I can create an **admin import endpoint** on your backend that will:
1. Accept the export file upload
2. Import everything automatically
3. Show you the results

Would you like me to create this endpoint?

---

## 🔍 Verify the Import

After importing, verify everything is working:

1. Go to https://www.acrylicbraillesigns.com/login
2. Login with: `kevin@decalmax.ca` / `Ke34023616@`
3. Navigate to Admin Portal
4. Check that all **6 products** are visible
5. Check that **reviews** are showing for products

---

## 🆘 Troubleshooting

### "Connection failed"
- Double-check your MongoDB URL is correct
- Ensure your IP is whitelisted (if using MongoDB Atlas)
- Verify the database credentials are correct

### "Import completed but products not showing"
- Make sure you imported to the correct database name (`bsign_store`)
- Check that `published: true` for all products
- Verify the backend is using the correct `MONGO_URL` on Render

### "Some items failed to import"
- Check the error messages in the import log
- You can re-run the import - it will update existing items

---

## 📞 Need Help?

Let me know which option you'd like to use:
- **Option A**: I'll guide you through running the Python script
- **Option B**: I'll help you with MongoDB Compass
- **Option C**: I'll create an admin import endpoint (easiest!)

Or if you encounter any issues, just share the error message and I'll help troubleshoot.
