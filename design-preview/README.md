# Open to connect — design preview

## 1) Static preview (fastest, no backend)

Open **`open-connect.html`** in your browser:

- Double-click the file, or  
- From the **`intera-app`** folder run:  
  `npm run preview:connect`  
  then visit **http://localhost:8082/open-connect.html**

You can share it “online” on your LAN using your machine’s IP on port **8082**, or tunnel with [ngrok](https://ngrok.com/) / [localtunnel](https://localtunnel.github.io/www/) on port `8082`.

This is a **visual mock** of the Connect screen (colors, layout, copy). It does not run the real app.

---

## 2) Full Expo web app (real screens, still works without Supabase for browsing)

From the **`intera-app`** folder (parent of `design-preview`):

```bash
cd intera-app
npx expo start --web
```

Then open the URL shown (usually **http://localhost:8081**), or use a fixed port:

```bash
npm run web:8082
```

→ **http://localhost:8082**

- You can navigate to **Open to connect** from the Home hub tile (in the full project).  
- Supabase calls may fail until you configure the backend; UI and routing still load for most screens.

**Windows:** if `npm run web` fails on `DARK_MODE=class`, use:

```bash
npx expo start --web
```

---

## 3) View on your phone (same Wi‑Fi)

```bash
npx expo start --web --host lan
```

Use your computer’s LAN IP in the browser on your phone (e.g. `http://192.168.1.x:8082` if you use `npm run web:8082`).
