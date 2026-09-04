# OpenAI Vision API Setup Guide

## 💰 Budget-Safe OpenAI Integration ($5/month)

Your DataCat app is now ready to connect to OpenAI Vision API with built-in cost controls!

### Step 1: Get OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com/)
2. Sign up/login to your account
3. Go to API Keys section
4. Create a new secret key
5. Copy the key (starts with `sk-...`)

### Step 2: Set Usage Limits in OpenAI Dashboard

**IMPORTANT**: Set these limits in your OpenAI account to prevent overspending:

1. Go to [platform.openai.com/account/billing](https://platform.openai.com/account/billing)
2. Set **Hard Limit**: $5.00/month
3. Set **Soft Limit**: $4.00/month (80% warning)
4. Enable email notifications

### Step 3: Configure Your App

Edit `.env.local` and replace:
```bash
OPENAI_API_KEY=your_openai_api_key_here
ENABLE_VISION_API=true
```

With your actual API key:
```bash
OPENAI_API_KEY=sk-proj-your-actual-key-here
ENABLE_VISION_API=true
```

### Step 4: Restart Your App

```bash
pnpm run dev
```

### Step 5: Test Upload

1. Go to `/builder`
2. Click "Datei hochladen"
3. Upload a PDF or image of a form
4. Watch the real OpenAI analysis!

## 🛡️ Built-in Cost Protection

### Automatic Limits:
- ✅ **Daily Limit**: 20 requests/day
- ✅ **Monthly Budget**: $5.00
- ✅ **Cost Tracking**: Real-time monitoring
- ✅ **Fallback**: Uses mock service if limits exceeded

### Usage Monitor:
- Blue info button (bottom-right) shows current usage
- Real-time progress bars for daily/monthly limits
- Warnings when approaching limits

## 📊 Cost Estimates

**GPT-4o Mini Vision Pricing:**
- **Small images**: ~$0.003 per analysis
- **PDFs**: ~$0.0045 per analysis
- **Monthly budget**: ~500-600 analyses

**Example Usage:**
- 10 uploads/day = ~$1.50/month ✅
- 20 uploads/day = ~$3.00/month ✅
- 30 uploads/day = ~$4.50/month ✅

## 🔧 Advanced Configuration

### Adjust Limits (optional):

Edit `.env.local`:
```bash
MAX_MONTHLY_COST=10.00      # Increase budget
DAILY_REQUEST_LIMIT=50      # Increase daily limit
```

### Disable OpenAI (fallback to mock):
```bash
ENABLE_VISION_API=false
```

## 🚨 Safety Features

### If you hit limits:
1. **Daily**: Wait until tomorrow
2. **Monthly**: Wait until next month
3. **Override**: Increase limits in `.env.local`

### If something goes wrong:
- App automatically falls back to mock service
- No crashes, always works
- Usage data stored in browser localStorage

## ✅ You're Ready!

- ✅ OpenAI Vision API integration
- ✅ Cost controls and monitoring  
- ✅ Automatic fallback to mock
- ✅ Real-time usage tracking
- ✅ Budget protection

**Just add your API key and set `ENABLE_VISION_API=true`!**

---

### Need Help?

- Check the blue usage monitor (bottom-right)
- Look for console warnings in browser dev tools
- Verify API key format starts with `sk-proj-`
- Ensure OpenAI account has sufficient credits