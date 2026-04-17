## KOYA Restaurant Website

Premium, mobile-first static site (black / neon gold / white) with:

- Cinematic hero + strong CTAs
- “Trending on TikTok” social proof
- Menu with categories + search
- One-click WhatsApp ordering (pre-filled message)
- Gallery + lightbox
- Location section with Google Maps embed, hours, and “Open now” indicator
- Floating “Order Now” button on mobile

### Run it

Because this site loads `data/menu.json`, you should open it via a local server (not by double-clicking `index.html`).

#### Option A: VS Code / Cursor “Live Server”

- Install the **Live Server** extension
- Right-click `index.html` → **Open with Live Server**

#### Option B: Python (if installed)

From this folder:

```bash
python -m http.server 5173
```

Then open `http://localhost:5173`.

### Update the business details (important)

Edit `app.js`:

- `whatsappNumberE164DigitsOnly`: digits only, with country code (example: `"2207123456"`)
- `phoneNumberDisplay`: for the Call button (example: `"+220 712 3456"`)
- `addressLine`: the real address text shown on the site
- `mapsQuery`: what Google Maps should search for (restaurant name or full address)
- `hours`: set opening hours for each day
- `tiktok`: replace with your real TikTok video links

### Update the menu

Edit `data/menu.json`:

- `currencySymbol`
- `featuredIds` (IDs of items to show in “Featured dishes”)
- Add categories + items (each item: `id`, `name`, `image`, `description`, `price`)

Images can point to your existing folders (spaces must be URL-encoded like `Food%20Images`).
