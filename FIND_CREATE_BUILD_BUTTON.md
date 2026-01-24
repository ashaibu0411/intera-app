# How to Find "Create a Build" in Expo Dashboard

## Where to Look

### Option 1: Direct Builds Page
1. **Go to:** https://expo.dev/accounts/znombre04/projects/vibecode/builds
2. **Look for:**
   - "New build" button (top right)
   - "Create build" button
   - "+" icon or "Add" button
   - "Start build" button

### Option 2: Project Overview Page
1. **Go to:** https://expo.dev/accounts/znombre04/projects/vibecode
2. **Look for:**
   - "Builds" tab/section
   - "Create build" card or button
   - Build history section with a "+" button

### Option 3: If You See "Connect GitHub" Instead

If you see "Connect GitHub" or "GitHub Integration":
1. **Click "Connect GitHub"** first
2. **Authorize** and select `ashaibu0411/intera-app`
3. **Then** you'll see build options

### Option 4: Check Different Project

Make sure you're on the right project:
- **Correct:** `@znombre04/vibecode` (ID: `090ff57c-7051-4df7-b53e-60eaa2cfe0f6`)
- **Wrong:** `@znombre04/intera-community-app` (different project)

---

## Alternative: Build from Command Line

If you can't find the button, you can build directly:

```bash
npx eas-cli build --platform ios --profile production
```

This will:
- Create the build
- Show progress in terminal
- You can also see it in the Dashboard

---

## What the Builds Page Should Show

You should see:
- List of previous builds (if any)
- A button to create a new build (usually top right)
- Or a card saying "Create your first build"

---

## If You Still Can't Find It

1. **Check you're logged in:**
   - Make sure you see `znombre04` in the top right

2. **Check project access:**
   - Make sure you have access to the project

3. **Try direct link:**
   - https://expo.dev/accounts/znombre04/projects/vibecode/builds/new
   - Or: https://expo.dev/accounts/znombre04/projects/vibecode/builds/create

4. **Or use command line:**
   ```bash
   npx eas-cli build --platform ios --profile production
   ```

---

## Screenshot What You See

If you can, describe what you see on the builds page, or I can help you build from the command line instead!
