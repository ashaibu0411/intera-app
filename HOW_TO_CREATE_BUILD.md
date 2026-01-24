# How to Create a Build - Multiple Ways

## Method 1: Expo Dashboard (If Button Not Visible)

### Try These URLs Directly:

1. **New Build Page:**
   - https://expo.dev/accounts/znombre04/projects/vibecode/builds/new

2. **Create Build:**
   - https://expo.dev/accounts/znombre04/projects/vibecode/builds/create

3. **Builds List (should have a button):**
   - https://expo.dev/accounts/znombre04/projects/vibecode/builds

### What to Look For:
- **"New build"** button (usually top right, blue/green button)
- **"+" icon** (plus sign, usually top right)
- **"Create build"** card/button
- **"Start build"** option

---

## Method 2: Command Line (Easiest - Works Now)

You can create builds directly from Cursor terminal:

### For iOS:
```bash
npx eas-cli build --platform ios --profile production
```

### For Android:
```bash
npx eas-cli build --platform android --profile production
```

### For Both:
```bash
npx eas-cli build --platform all --profile production
```

**This will:**
- Show you a link to track the build
- Create the build on Expo servers
- You can see it in Dashboard after it starts

---

## Method 3: If You See "Connect GitHub" First

1. **Connect GitHub:**
   - Click "Connect GitHub"
   - Select `ashaibu0411/intera-app`
   - Authorize

2. **Then you'll see:**
   - "Start a build from GitHub" option
   - Or build buttons will appear

---

## Method 4: Check Project List

Maybe you're looking at the wrong project:

1. **Go to:** https://expo.dev/accounts/znombre04/projects
2. **Find:** `vibecode` project
3. **Click on it**
4. **Then go to Builds tab**

---

## Quick Test: Build from Command Line Now

Run this in Cursor terminal:

```bash
npx eas-cli build --platform ios --profile production
```

This will:
1. Ask about credentials (choose "Let Expo manage")
2. Start the build
3. Show you a link to track it
4. Appear in your Dashboard

---

## What You Should See

After running the command, you'll see something like:
```
✔ Build started
📱 Build details: https://expo.dev/accounts/znombre04/projects/vibecode/builds/[build-id]
```

Click that link to see your build in the Dashboard!
