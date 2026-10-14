# GameCore

Gaming storefront built with HTML, CSS and vanilla JavaScript. Products and demo
accounts use MockAPI. Run the project through Live Server or another HTTP server.

## Product management

The home page includes a banner, featured products and New Arrivals / Top Deals
tabs. Search and View all display the full catalog on the home route. Discounts
appear only when a product has an `originalPrice` greater than its current
`price`. New Arrivals uses `createdAt` when present on all entries, otherwise
reverses the API record order. No ratings or discount values are fabricated.

The banner comes from the supplied design PDF. Product images are read directly
from the API; the home page does not replace or download them.

Customers can browse, search and manage a local shopping cart. Accounts with
`role: "admin"` can open `pages/admin/products.html` to add, edit and delete
products. Changes are sent to the same Products resource used by the storefront.

New accounts are created as customers. For an admin demo, change an account's
`role` to `admin` in the MockAPI users resource, then sign out and sign in again.
The session contains the role returned during sign in.

MockAPI and the JavaScript role checks provide prototype behavior, not server
authorization. Production account verification and mutation permissions require
a backend.

## Description generation

The description editor supports reviewing and editing a generated draft before
saving a product. No AI service is connected in this version, so Generate
Description is disabled. AI generation remains an incomplete MVP requirement.

To connect an actual service, set `AI_DESCRIPTION_URL` in `js/ai.js` to a server
endpoint accepting a JSON POST with these fields:

```json
{
  "name": "Wireless Controller",
  "brand": "Example",
  "category": "accessories",
  "details": "Optional verified specifications or notes"
}
```

Expected JSON response:

```json
{
  "description": "The generated product description."
}
```

The server must keep the provider key private, validate access, and allow the
frontend origin if hosted separately. The description prompt should use supplied
facts without inventing specifications. The frontend never saves a generated
draft until the admin chooses it and saves the product.

## Assets

Bootstrap Icons 1.13.1 is bundled locally under
`assets/vendor/bootstrap-icons`, with its MIT license. No Bootstrap framework or
icon JavaScript is required.
