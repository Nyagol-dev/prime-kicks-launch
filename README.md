# Prime Kicks Launch

Build a premium, professional e-commerce website for "Prime Kicks KE", a Nairobi-based sneaker brand. This must NOT look like a generic template or "vibe-coded" site — it needs to feel like it was built by a professional agency: intentional typography, a real brand story, confident use of whitespace, smooth micro-interactions, and a premium streetwear aesthetic (dark, bold, red/black/white palette matching their existing logo — a black background with red accents, "PK" mark).

BRAND CONTEXT (from their existing TikTok/social presence):
- Name: Prime Kicks KE (@prime_kicks_ke)
- Tagline: "Step In. Stand Out. Step Different."
- Founder: Joyce
- About: "Prime Kicks KE is a Nairobi-based sneaker brand built for people who understand that style is not optional — it's identity. We specialize in sourcing and delivering fresh, high-demand sneakers that elevate your everyday look. We're not just selling shoes. We're delivering confidence, presence, and a lifestyle."
- Mission: To make premium, stylish sneakers accessible to people who value quality, confidence and self-expression.
- Vision: To become one of Kenya's most trusted and recognized sneaker brands, known for authenticity, consistency and culture.
- Pickup location: Platinum Plaza, 3rd Floor, Shop 305, Nairobi, Kenya
- Contact: Phone/WhatsApp 0798718785, Instagram & TikTok @prime_kicks_ke
- Sample products/prices (for seeding initial demo data — real product photos will be uploaded by the shop owner via admin): Puma Super GT Black & Gold Ksh 3,800; Nike Air Max (kids, sizes 25-36) Ksh 1,999; New Balance 530 Blue & White Ksh 2,600; New Balance 1000 purple Ksh 3,700; Nike Portal Ksh 3,200; Versace-style Black & Red Sneakers Ksh 2,500

SITE STRUCTURE & FEATURES:

1. HOMEPAGE — tells a story, not just a product grid:
   - Hero section with brand tagline and a strong visual moment
   - Brand story / "About" section (mission, vision, what makes them different)
   - Featured/trending products
   - A "Style It" / lookbook section showing how to style the sneakers (image gallery — placeholder for now, owner will upload real styling photos via admin)
   - Clear path to shop

2. SHOP / CATALOG PAGE:
   - Grid of all products with photo, name, price, sizes available
   - Filter/sort by price, size, category
   - Product detail page: multiple photos, description, size selector, add to cart

3. CART & CHECKOUT (frictionless, no live payment gateway):
   - Simple cart drawer/page
   - Checkout form: customer name, phone number, delivery method (pickup at Platinum Plaza or countrywide delivery), address if delivery
   - On submit: show a clear confirmation screen — "Your order has been received and is being processed. We will contact you shortly to confirm payment and delivery details." No payment is collected on-site.
   - On order submission, automatically decrement stock for the ordered size/product in the database

4. BACKEND / DATABASE (use Supabase — set this up as part of the build):
   - Products table: name, description, price, category, sizes with per-size stock counts, photos, styling photos
   - Orders table: customer name, phone, items ordered, delivery method/address, status (new/processing/fulfilled), timestamp
   - Inventory must be real and persistent, not mocked

5. ADMIN DASHBOARD (protected route, needs login):
   - Login for the shop owner (simple email/password auth via Supabase Auth)
   - Add new products: upload photos, set name, price, category, sizes + stock per size
   - Edit/delete existing products
   - Manually adjust stock levels at any time
   - View all incoming orders in real time, each showing: customer name, PHONE NUMBER (must be prominent since she needs to contact the buyer), items, delivery details, status, timestamp
   - Mark orders as processing/fulfilled
   - Upload styling/lookbook photos separately from product photos

6. ORDER NOTIFICATIONS:
   - When a new order comes in, it must appear instantly in the admin dashboard (real-time, not requiring refresh)
   - Also send a WhatsApp notification to the shop owner's personal WhatsApp number using the CallMeBot API (https://www.callmebot.com/blog/free-api-whatsapp-messages/) — a free service that sends WhatsApp messages via a simple HTTP GET request once the recipient has opted in. Build this as a Supabase Edge Function triggered on new order insert, that sends the CallMeBot request with the customer's name, phone number, and order summary. Leave the phone number and CallMeBot API key as configurable values (e.g. in a settings table or edge function secret) since she'll need to complete CallMeBot's one-time opt-in herself and provide her key.

DESIGN REQUIREMENTS (critical):
- Premium, editorial feel — like a real streetwear/sneaker brand site, not a bootstrap template
- Strong typography hierarchy, generous spacing, subtle animations/transitions (hover states, page transitions)
- Mobile-first — most of her audience is on mobile via TikTok
- Fast, clean, frictionless checkout — minimal steps
- Use the black/red/white palette from their brand mark

Please set up the Supabase backend, auth, and database schema as part of this build, and seed a few of the sample products above with placeholder images so the site is fully functional and demonstrable from the start.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7094ad55-e045-432c-8625-2d014197d7fb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
