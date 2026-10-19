# API Contract — Cart → Buy → Checkout → Payment → Shipment → B2B

This file lists every backend endpoint the (now fixed) frontend calls, grouped
by service file. **✅ Already used by existing code** = the endpoint already
existed before this fix. **🆕 NEW / PENDING** = the UI is wired to call it,
but it must be built on the backend — nothing will work end‑to‑end until
these exist.

All authenticated calls send `Authorization: Bearer <accessToken>`
(see `src/services/apiClient.js`). All responses are expected as
`{ success: boolean, data: <payload>, message: string }`.

---

## Deployment configuration

Vite embeds `VITE_USER_API_URL`, `VITE_AGENT_API_URL`, and
`VITE_DIGITAL_API_URL` at build time. The checked-in development settings use
`https://localhost`; set these variables to the deployed HTTPS API URLs in
the production build environment and rebuild the frontend. In particular,
product image paths such as `/ProductImages/file.png` are resolved against
the origin of `VITE_DIGITAL_API_URL`. The API host must serve the configured
image directory (for example, map `D:\ProductImages` to the public
`/ProductImages` route) and allow requests from the storefront origin. A
local disk path is not itself a browser-accessible image URL.

---

## 1. Cart — `src/services/cartService.js` (digitalApi)

| Method | Endpoint | Status | Notes |
|---|---|---|---|
| GET | `/cart/GetCartbyuserid` | ✅ | Full cart for the logged-in user |
| GET | `/cart/GetCartbyproduct?productid={id}` | ✅ | Used by the "Buy Now" flow to scope checkout to one item |
| POST | `/cart/Create` `{ProductId, Quantity, Price}` | ✅ | Add / increment |
| PUT | `/cart/{cartItemId}` `{quantity}` | ✅ | Update quantity |
| DELETE | `/cart/Delete/{cartItemId}` | ✅ | Remove one line |
| DELETE | `/cart/ClearCart` | ✅ | Called after a full-cart order is placed |

Guest (not logged in) carts are handled entirely client-side via
`localStorage`, and merged into the server cart automatically right after
login (`cartService.mergeGuestCart()`, now actually called from `login.jsx`).

---

## 2. Addresses — `src/services/checkoutService.js` (digitalApi)

| Method | Endpoint | Status |
|---|---|---|
| GET | `/UserAddress/GetByuserid` | ✅ |
| POST | `/UserAddress/Create` | ✅ |
| PUT | `/UserAddress/Address/{id}` | ✅ |
| DELETE | `/UserAddress/Address/{id}` | ✅ |

---

## 3. Orders — `src/services/orderService.js` (digitalApi)

The digital API base URL defaults to `https://localhost:7254/api`. The order
controller is hosted there, not on the authentication API at port `7101`.
The frontend appends `/Orders` to this base URL, producing
`https://localhost:7254/api/Orders`.

| Method | Endpoint path (appended to `DIGITAL_API_URL`) | Status | Notes |
|---|---|---|---|
| GET | `/Orders` | ✅ | Admin: all orders |
| GET | `/Orders/my` | 🆕 | **New.** Powers the customer "My Orders" list page |
| GET | `/Orders/{id}` | ✅ | Powers order confirmation / tracking page |
| POST | `/Orders` | ✅ | Create order. Payload below |
| PUT | `/Orders/approve/{id}` | ✅ | Admin |
| PUT | `/Orders/reject/{id}?reason=` | ✅ | Admin |
| PUT | `/Orders/cancel/{id}` | ✅ | Admin / customer; accepts optional `reason` query parameter |
| PUT | `/Orders/dispatch/{id}?location=` | ✅ | Admin |
| PUT | `/Orders/deliver/{id}` | ✅ | Admin |
| PUT | `/Orders/{id}/status` | 🆕 REQUIRED | Admin: persist order status; optionally append status history |
| PUT | `/Orders/{id}/payment-status` | 🆕 REQUIRED | Admin: update order and payment record together (including collected COD) |
| POST | `/Orders/{id}/tracking` | 🆕 REQUIRED | Admin: append a tracking event |

**Admin order list request** (`GET /Orders`): the management screen sends
`page`, `pageSize`, and optional `search`, `orderStatus`, `paymentStatus`,
`paymentMethod`, `fromDate`, and `toDate` query parameters. Return
`{ "success": true, "data": { "items": [], "totalCount": 0 }, "message": "" }`.
The rows should contain at least the order id/number, customer name, order
date, total, order status, payment status, and payment method.

**Admin order detail response** (`GET /Orders/{id}`): return
`{ "success": true, "data": { "order": {}, "items": [], "tracking": [] }, "message": "" }`.
Include `orderStatus`, `paymentStatus`, `paymentMethod`, `finalAmount`,
`items`, and tracking events (`status`, `location`, `remarks`, `createdDate`).
The authenticated customer route must verify order ownership; do not expose
another customer's address or tracking details by guessing an order ID.

**Cancel order** (`PUT /Orders/cancel/{id}?reason=`): validate that the order
is in a cancellable state, persist `OrderStatus = "Cancelled"`, update any
order-active/cancellation fields, and append a Cancelled tracking/history
record containing the optional reason in the same transaction. Return the
updated order in the standard response envelope. Return a 4xx response for
unknown orders or terminal states such as Delivered, Returned, or already
Cancelled.

**Order status update** (`PUT /Orders/{id}/status`):
```json
// request
{ "OrderStatus": "Shipped", "Location": "Delhi warehouse", "Remarks": "Handed to carrier" }
// response
{ "success": true, "data": { "orderId": 55, "orderStatus": "Shipped", "updatedAt": "2025-03-08T12:00:00Z" }, "message": "Order status updated." }
```
Persist the status and, when location or remarks are supplied, append a
tracking/history entry in the same transaction. Return a 4xx response for an
invalid transition or unknown order.

**Payment status update** (`PUT /Orders/{id}/payment-status`):
```json
// request
{ "PaymentStatus": "Paid" }
// response
{ "success": true, "data": { "orderId": 55, "paymentStatus": "Paid" }, "message": "Payment status updated." }
```
For COD, an authorized admin can set `Pending` to `Paid` after the cash is
collected. In one transaction, update the order and its payment record, record
the administrator and timestamp, and reject unsupported transitions. Never
allow a browser/customer to mark their own order paid.

**Add order tracking event** (`POST /Orders/{id}/tracking`):
```json
// request
{ "Status": "OutForDelivery", "Location": "Delhi", "Remarks": "Courier scan" }
// response
{ "success": true, "data": { "trackingId": 301, "orderId": 55, "status": "OutForDelivery", "location": "Delhi", "remarks": "Courier scan", "createdAt": "2025-03-08T12:00:00Z" }, "message": "Tracking event added." }
```

Admin mutation smoke-test examples (run after obtaining an admin bearer token):
```bash
curl -X PUT "https://localhost:7254/api/Orders/55/status" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"OrderStatus":"Shipped","Location":"Delhi warehouse","Remarks":"Handed to carrier"}'

curl -X PUT "https://localhost:7254/api/Orders/55/payment-status" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"PaymentStatus":"Paid"}'

curl -X POST "https://localhost:7254/api/Orders/55/tracking" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"Status":"OutForDelivery","Location":"Delhi","Remarks":"Courier scan"}'
```

**`createOrder` payload:**
```json
{
  "addressId": 12,
  "items": [{ "productId": 1, "quantity": 2, "price": 499.0 }],
  "subtotal": 998.0,
  "discount": 99.8,
  "total": 898.2,
  "paymentMethod": "COD" // or "ONLINE"
}
```
**Expected response:** `{ success, data: { id, status: "Pending", ... }, message }`

---

## 4. Payments — `src/services/paymentService.js` (digitalApi)

This is the biggest gap. The old code called `paymentService` without the
file even existing. It's been built now with this contract:

| Method | Endpoint | Status | Notes |
|---|---|---|---|
| POST | `/Payment/Create` | 🆕 | Creates the initial pending COD payment record |
| GET | `/Payment/order/{orderId}` | 🆕 | Fetch latest payment status for an order |
| POST | `/Payment/razorpay/order` | 🆕 **REQUIRED FOR RAZORPAY** | Creates a Razorpay Order server-side |
| POST | `/Payment/razorpay/verify` | 🆕 **REQUIRED FOR RAZORPAY** | Verifies the Razorpay signature server-side |
| POST | `/Payment/razorpay/qr` | 🆕 **REQUIRED FOR UPI QR** | Creates a fixed-amount, single-use Razorpay UPI QR for the order |
| GET | `/Payment/razorpay/qr/{qrCodeId}/status` | 🆕 **REQUIRED FOR UPI QR** | Returns payment state only after verified webhook reconciliation |

**`POST /Payment/Create`** records the initial pending COD payment:
```json
// request
{ "OrderId": 55, "PaymentMethod": "COD", "PaymentStatus": "PENDING", "TransactionId": null, "Amount": 898.20 }
```

**`POST /Payment/razorpay/order`** — must call Razorpay's Orders API
server-side with your **secret key** (never expose it client-side) and
return:
```json
// request
{ "OrderId": 55, "Amount": 898.20 }
// response  -> res.data
{ "razorpayOrderId": "order_abc123", "keyId": "rzp_test_xxx", "amount": 898.20, "currency": "INR" }
```

**`POST /Payment/razorpay/verify`** — must recompute the HMAC-SHA256
signature using your Razorpay **secret** and compare it to
`RazorpaySignature` before marking the order paid. This step is what
actually confirms the payment; never trust the client's "success" callback
alone.
```json
// request
{ "OrderId": 55, "RazorpayOrderId": "order_abc123", "RazorpayPaymentId": "pay_xyz789", "RazorpaySignature": "..." }
// response
{ "success": true, "data": { "verified": true } }
```

**`POST /Payment/razorpay/qr`** — create an order-specific Razorpay QR on the
server. Use a fixed amount, single-use UPI QR, a short `close_by` expiry, and
notes/reference metadata tying it to the order. The secret key must never be
sent to the browser.
```json
// request (amount in rupees; server must validate it against the order total)
{ "OrderId": 55, "Amount": 898.20 }
// response
{
  "success": true,
  "data": {
    "qrCodeId": "qr_abc123",
    "imageUrl": "https://example.invalid/razorpay/qr-image",
    "status": "created",
    "expiresAt": "2025-03-08T12:30:00Z"
  }
}
```

Configure a Razorpay webhook (including `qr_code.credited` / corresponding
payment events) and verify its webhook signature server-side. Idempotently
record the captured payment and mark the order paid only for the expected
order, currency, and exact amount. Do not trust a QR image, client callback,
or unverified status request as proof of payment.

**`GET /Payment/razorpay/qr/{qrCodeId}/status`** — authenticated owner-scoped
polling endpoint used by the checkout modal:
```json
{ "success": true, "data": { "qrCodeId": "qr_abc123", "paymentStatus": "Paid", "paymentId": "pay_xyz789" } }
```
Return `Pending` until the webhook has been verified and persisted. Also
update `GET /Payment/order/{orderId}` so order tracking reflects the same
payment state. The QR status endpoint must ensure the QR belongs to the
requesting customer's order.

**Razorpay setup checklist for the backend team:**
1. Create a Razorpay account → get **Key Id** (public) + **Key Secret** (private).
2. Put the Key Secret only in backend config/secrets (never in the frontend).
3. Put the Key Id in the frontend's `.env` as `VITE_RAZORPAY_KEY_ID` (already wired up in `src/config/env.js`).
4. Implement the order, signature verification, QR creation and webhook/status endpoints using the Razorpay server SDK (Node, .NET, Java, etc.).
5. Configure a publicly reachable HTTPS webhook URL in Razorpay dashboard and test duplicate/out-of-order webhook delivery.

There is no simulated payment fallback. If Razorpay is not configured or a
required endpoint is unavailable, checkout reports the error and does not
mark the order paid.

---

## 5. Shipment / Tracking — `src/services/shipmentService.js` (digitalApi)

| Method | Endpoint | Status | Notes |
|---|---|---|---|
| POST | `/Shipment/create` | ✅ | Called right after an order + payment succeed |
| POST | `/Shipment/tracking/add` | ✅ | Admin adds a tracking event |
| GET | `/Shipment/ByOrder/{orderId}` | 🆕 | Fetch shipment (courier, tracking #, status) for an order |
| GET | `/Shipment/tracking/{shipmentId}` | 🆕 | Full tracking-event history, for a live timeline UI |

---

## 6. B2B / Bulk Orders — `src/modules/Website/b2b/b2bService.js` (digitalApi)

The UI uses the `/B2BOrderEnquiry` controller on the digital API
(`https://localhost:7254/api`). These are the routes the current frontend
calls; the earlier `/B2BEnquiry` and `/Admin/B2BEnquiry` routes were stale
documentation and do not match the client. **Backend source is not included
in this workspace, so verify which routes already exist in Swagger.**

| Method | Endpoint | Consumer | Contract |
|---|---|---|---|
| POST | `/B2BOrderEnquiry` | Public enquiry form | Create enquiry, request below |
| GET | `/B2BOrderEnquiry/my` | Customer | Return current user's enquiries |
| GET | `/B2BOrderEnquiry/my/{id}` | Customer | Return own enquiry with quotation, shipment and history |
| POST | `/B2BOrderEnquiry/{id}/accept-quotation` | Customer | Accept quotation |
| POST | `/B2BOrderEnquiry/{id}/reject-quotation` | Customer | Reject quotation, `{ "remarks": "..." }` |
| GET | `/B2BOrderEnquiry` | Admin | List enquiries; accept paging/filter query params |
| GET | `/B2BOrderEnquiry/dashboard` | Admin | B2B counts/summary |
| GET | `/B2BOrderEnquiry/GetById?id={id}` | Admin | Detailed enquiry, quotation, shipment and status history; `id` is a query parameter, not a path segment |
| POST | `/B2BOrderEnquiry/{id}/approve` | Admin | `{ "remarks": "..." }` |
| POST | `/B2BOrderEnquiry/{id}/reject` | Admin | `{ "remarks": "..." }` |
| POST | `/B2BOrderEnquiry/{id}/quotation` | Admin | Create/update quotation, request below |
| POST | `/B2BOrderEnquiry/{id}/quotation/send` | Admin | Send saved quotation |
| POST | `/B2BOrderEnquiry/{id}/status` | Admin | Update status, request below |
| POST | `/B2BOrderEnquiry/{id}/shipment` | Admin | Attach/update shipment, request below |

**Create enquiry request** (the service maps the form into this shape):
```json
{
  "CompanyName": "Example Traders",
  "ContactPerson": "A. Kumar",
  "Email": "buyer@example.com",
  "Phone": "9876543210",
  "Category": "Packaging",
  "Quantity": "500",
  "City": "Delhi",
  "State": "Delhi",
  "GSTIN": "07AAAAA0000A1Z5",
  "Message": "Need a bulk quotation"
}
```

**Admin detail response** (camelCase shown; PascalCase is also normalized):
```json
{
  "success": true,
  "data": {
    "b2bEnquiryId": 72,
    "companyName": "Example Traders",
    "contactPerson": "A. Kumar",
    "businessEmail": "buyer@example.com",
    "phoneNumber": "9876543210",
    "gstin": "07AAAAA0000A1Z5",
    "city": "Delhi",
    "state": "Delhi",
    "productCategory": "Packaging",
    "approxQuantity": "500",
    "additionalRequirements": "Need a bulk quotation",
    "status": "UNDER_REVIEW",
    "quotation": { "subTotal": 50000, "discountAmount": 2500, "taxAmount": 8550, "finalAmount": 56050 },
    "shipment": { "carrier": "Courier", "trackingNumber": "TRK123", "status": "SHIPPED" },
    "history": [{ "status": "UNDER_REVIEW", "remarks": "Review started", "createdDate": "2025-03-08T12:00:00Z" }]
  },
  "message": "Enquiry loaded."
}
```

**Update status request** (`POST /B2BOrderEnquiry/{id}/status`):
```json
{ "status": "UNDER_REVIEW", "remarks": "Documents verified" }
```

**Create quotation request** (`POST /B2BOrderEnquiry/{id}/quotation`): accept
the quotation form's `subTotal`, `discountAmount`, `taxAmount`, `finalAmount`,
`adminRemarks`, and `validUntil` fields; persist it and return the updated enquiry.
For example:
```json
{ "subTotal": 50000, "discountAmount": 2500, "taxAmount": 8550, "finalAmount": 56050, "adminRemarks": "Valid for 15 days", "validUntil": "2025-03-23" }
```

**Shipment request** (`POST /B2BOrderEnquiry/{id}/shipment`): accept
`Carrier`, `TrackingNumber`, `TrackingUrl`, and `Remarks`; return the updated
shipment and enquiry.

All admin endpoints must enforce the Admin/SuperAdmin authorization policy.
Mutation success should return `{ "success": true, "data": <updated resource>,
"message": "..." }`; validation/authorization failures should return an
appropriate 4xx status with `{ "success": false, "message": "..." }`.
The detail endpoint should include nested quotation, shipment, and history
data so the admin UI can show all operational information.

B2B admin smoke-test example:
```bash
curl -X POST "https://localhost:7254/api/B2BOrderEnquiry/72/status" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"UNDER_REVIEW","remarks":"Documents verified"}'
```

---

## 7. Admin catalogue — categories, subcategories, and product images

The React admin now calls the following authenticated endpoints on
`DIGITAL_API_URL`. These routes and response formats must be implemented by
the digital API; this repository contains the frontend only.

### Categories

`GET /Category/GetAllAdmin` returns all categories with their subcategories
so both the admin hierarchy page and product form can use one request:
```json
{
  "success": true,
  "message": "Categories retrieved successfully.",
  "data": [
    {
      "id": 1,
      "categoryName": "Apparel",
      "description": "Clothing and accessories",
      "isActive": true,
      "subCategories": [
        { "id": 11, "categoryId": 1, "subCategoryName": "Shirts", "isActive": true }
      ]
    }
  ]
}
```

| Method | Endpoint | Request | Success response |
|---|---|---|---|
| POST | `/Category/Create` | `{ "CategoryName": "Apparel", "Description": "...", "IsActive": true }` | `{ "success": true, "data": { "Id": 1, "CategoryName": "Apparel", "SubCategories": [] }, "message": "Category created." }` |
| PUT | `/Category/Update/{id}` | Same fields as create | Updated category in `data` |
| DELETE | `/Category/Delete/{id}` | No body | `{ "success": true, "data": null, "message": "Category deleted." }` |
| POST | `/SubCategory/Create` | `{ "CategoryId": 1, "SubCategoryName": "Shirts", "Description": "...", "IsActive": true }` | `{ "success": true, "data": { "Id": 11, "CategoryId": 1, "SubCategoryName": "Shirts", "IsActive": true }, "message": "Subcategory created." }` |
| PUT | `/SubCategory/Update/{id}` | Same fields as create | Updated subcategory in `data` |
| DELETE | `/SubCategory/Delete/{id}` | No body | `{ "success": true, "data": null, "message": "Subcategory deleted." }` |

Category and subcategory names must be unique within their parent scope.
Return `400` for invalid names/parent IDs, `404` for missing records, and
`409` rather than deleting a category or subcategory that is still assigned
to products. Every mutation requires an admin role.

### Multiple product images

`POST /Product/UploadImages` accepts `multipart/form-data` with a `productId`
field and one or more files under the repeated `images` field. The product
must already exist: on create, the admin first saves all product fields with
`POST /Product/Create`, reads the new product ID from the response, then
uploads the image files with that ID. On edit, the existing product ID is
used. The API must associate every uploaded image with that product ID and
return one URL per uploaded file in upload order. The current admin accepts
PNG, JPEG, WebP, and GIF files; the API must verify content as well as the
declared MIME type and apply server-side size limits:

```text
productId = 42
images = <first image file>
images = <second image file>
```

The success response:
```json
{
  "success": true,
  "data": {
    "imageUrls": [
      "https://cdn.example.com/products/abc-front.jpg",
      "https://cdn.example.com/products/abc-back.jpg"
    ]
  },
  "message": "Images uploaded."
}
```

After upload, the admin updates the same product ID with the returned URLs.
On product create/update, keep the existing `Imageurl` field as the primary
image for older clients and persist the full ordered image list in
`ImageUrls`:
```json
// Product/Create or Product/Update/{id} JSON request fields (relevant subset)
{
  "ProductsName": "Cotton shirt",
  "Category": "Apparel",
  "SubCategory": "Shirts",
  "Imageurl": "https://cdn.example.com/products/abc-front.jpg",
  "ImageUrls": [
    "https://cdn.example.com/products/abc-front.jpg",
    "https://cdn.example.com/products/abc-back.jpg"
  ]
}
```

`POST /Product/Create` and `PUT /Product/Update/{id}` respond with the saved
product so the admin can confirm the assigned category and image list:
```json
{
  "success": true,
  "data": {
    "Id": 42,
    "ProductsName": "Cotton shirt",
    "Category": "Apparel",
    "SubCategory": "Shirts",
    "Imageurl": "https://cdn.example.com/products/abc-front.jpg",
    "ImageUrls": [
      "https://cdn.example.com/products/abc-front.jpg",
      "https://cdn.example.com/products/abc-back.jpg"
    ]
  },
  "message": "Product saved."
}
```

`POST /Product/Create` must return the newly created ID in `data.Id` (or
`data.id`) so the frontend can link subsequent image uploads. The upload
endpoint must reject unknown product IDs and must not attach images to a
different product. If image upload fails after product creation, the product
record remains saved without the newly uploaded images; the API should return
a clear 4xx error and the frontend will report the failure.

`GET /Product/GetAll` and `/Product/GetbyProductid/{id}` are public catalogue
endpoints and must include `id`, `productName`, `price`, `longDescription`,
`category`, `subCategory`, and image data for every product. The home page,
navigation, catalogue page, and B2B enquiry form derive available categories
and subcategories from this product data; do not hard-code category labels in
the frontend. The sample response previously omitted `subCategory`; include
it to enable subcategory filters.

The catalogue accepts optional, comma-separated filter query parameters.
Within one facet the selected values are ORed; selected category and
subcategory facets are combined with AND:
```http
GET /Product/GetAll?category=AC%20Cover,Appliance%20Cover&subCategory=Window%20AC%20Cover
```

When filters are supplied, return only matching products in the standard
envelope. Both a plain array and a paged `items` object are supported:
```json
{
  "success": true,
  "message": "Products retrieved successfully.",
  "data": {
    "items": [
      {
        "id": "25e310b6-a3db-4661-9480-03d4f0dd91f2",
        "productName": "AC cover",
        "price": 300,
        "category": "AC Cover",
        "subCategory": "Window AC Cover",
        "images": [
          { "id": 8, "imagesPath": "/ProductImages/P_20261004052223794_e4fee96f-d821-4444-8df9-448a9160a037.png" }
        ]
      }
    ],
    "totalCount": 1
  }
}
```

The sidebar counts and options are built from the unfiltered product list;
the frontend sends selected facets as `category` and `subCategory` on the
filtered request. Return the fields above for each result, including category
and subcategory values, so local filtering and counts remain consistent.

For best compatibility return `images` as a JSON array of objects or provide
`ImageUrls` as an array of URLs. The frontend also accepts the current
JSON-encoded `images` string, for example:
```json
{
  "id": "25e310b6-a3db-4661-9480-03d4f0dd91f2",
  "productName": "AC cover",
  "price": 300,
  "category": "AC Cover",
  "subCategory": "Window AC Cover",
  "images": [
    { "id": 8, "imagesPath": "/ProductImages/ac-cover.png" }
  ]
}
```

Image paths may be absolute public URLs or paths relative to the digital API
host (for example `/ProductImages/ac-cover.png`). Do not return an operating
system disk path such as `D:/ProductImages/image.png` as the image URL.
Instead expose the stored file through static-file hosting and return
`/ProductImages/image.png` (or its absolute public URL). The frontend
normalizes legacy `D:/ProductImages/...` values to that public route, but the
backend must ensure the route is served and accessible to storefront users.
`ImageUrls` is an ordered array of public image URLs; the first entry is the
storefront cover image. If a legacy product only has `Imageurl`, expose it as
the first (and only) item in `ImageUrls`. Upload responses must not report
success unless every submitted file has a corresponding URL. Enforce allowed
image MIME types, size limits, and storage-path safety on the server, and
return validation errors as 4xx responses with
`{ "success": false, "message": "..." }`.

---

## 8. Admin landing pages — Digital API (`DIGITAL_API_URL`)

The admin landing-page studio stores campaign pages server-side so generated
`/p/{slug}` links work for customers on other devices and can be shared on
social platforms. The visual direction should be clean, minimal, and
product-focused; do not reuse Apple's protected logos, copy, or imagery.
Admin endpoints must enforce the Admin/SuperAdmin authorization policy.

| Method | Endpoint | Behavior |
|---|---|---|
| GET | `/LandingPage` | Admin list, including drafts and published pages. |
| GET | `/LandingPage/{id}` | Admin detail for editing. |
| POST | `/LandingPage` | Create a draft or published page. |
| PUT | `/LandingPage/{id}` | Update page content and publish state. |
| DELETE | `/LandingPage/{id}` | Delete a page. |
| GET | `/LandingPage/slug/{slug}` | Public read endpoint. Return only published pages; return 404 for drafts or unknown slugs. |

Page requests and responses contain `Id`, `Title`, `Slug`, `Description`,
`BackgroundColor`, `TextColor`, `ButtonColor`, `IsPublished`, and ordered
`Slides`. Each slide contains `SortOrder`, `Eyebrow`, `Title`, `Description`,
`ImageUrl`, `ImageAlt`, `ImageHeight`, `ImageFit`, `ProductId`, and
`ButtonLabel`. Each slideshow entry has one uploaded image; create multiple
entries to create a slideshow. Optional `ProductContents` entries contain
`ProductId`, `Description`, `GalleryImages` (an array of uploaded image URLs),
`VideoUrl`, `Highlights`, and `Sections`. Upload media through
`POST /LandingPage/media/uploadfile` with a multipart `file` field; return a
public media URL in the standard response `data` envelope. A Buy button with a
`ProductId` sends customers to
`/checkout?productId={ProductId}`; the existing checkout flow owns login,
address, payment, and order creation. A slide without a product links to the
product catalogue.

Return the standard `{ "success": true, "data": <resource>, "message": "" }`
envelope. Slugs must be URL-safe and unique (including concurrent creates),
slide ordering must be preserved, and invalid colors/dimensions, missing
required slide title/image, or unknown product IDs must return 400. Page
creation and updates must validate image URLs and allowed dimensions; public
reads must not expose drafts or private admin data.

## 9. Admin users and roles — User API (`USER_API_URL`)

The admin Users screen calls the authentication/user API (default
`https://localhost:7101/api`). Every route below must enforce the
Admin/SuperAdmin authorization policy on the server; hiding the admin screen
in the frontend is not an authorization boundary.

### Users

| Method | Endpoint | Request / behavior |
|---|---|---|
| GET | `/Auth/GetAllUsers` | Return all manageable users, including their assigned role name and active status. |
| GET | `/Auth/GetById/{id}` | Return one user record. |
| POST | `/users` | Create a user with `Name`, `Email`, `PhoneNumber`, `Password`, `RoleId`, and `IsActive`. Hash passwords server-side; never return password or password-hash fields. |
| PUT | `/users/{id}` | Update `Name`, `Email`, `PhoneNumber`, `RoleId`, and `IsActive`. A blank/omitted password leaves the existing password unchanged; a supplied password must be securely hashed. |
| DELETE | `/users/{id}` | Delete or deactivate the user according to the account-retention policy. |

Successful list responses should use `{ "success": true, "data": [], "message": "" }`
or `{ "success": true, "data": { "items": [] }, "message": "" }`. User objects
should include `Id`, `Name`, `Email`, `PhoneNumber`, `RoleId`, `RoleName`, and
`IsActive`. Reject duplicate/invalid email addresses and unknown role IDs with
a 4xx response.

### Roles

The existing `RoleController` supports these routes:

| Method | Endpoint | Request / behavior |
|---|---|---|
| GET | `/Role` | List roles for the user form's role selector and role management table. |
| GET | `/Role/{id}` | Get one role. |
| POST | `/Role` | Create a role using `Id` (optional), `Name`, `Description`, and `IsActive`. |
| PUT | `/Role` | Update a role using `Id`, `Name`, `Description`, and `IsActive`. |
| DELETE | `/Role/{id}` | Delete a role; reject deletion while users are assigned to it. |

Role objects should include `Id`, `Name`, `Description`, and `IsActive`.
Role names must be unique. Return validation/authorization failures as
appropriate 4xx responses and preserve the standard `{ success, data, message }`
response envelope. Both user and role mutation endpoints must be protected by
the server-side Admin/SuperAdmin policy.

## What was actually broken (fixed in this pass)

1. **Token key mismatch** — login stored `authToken`; every API client read
   `accessToken`. Every authenticated call silently went out with no auth
   header. → standardized on `accessToken` / `refreshToken` everywhere.
2. `Cart.jsx` referenced an undefined `product` variable in the checkout
   button → could crash the whole page.
3. `Checkout.jsx` always fetched the cart via `getCartbyproduct(productId)`,
   which returns `[]` with no `productId` — i.e. **every normal "Proceed to
   Checkout" from the cart page showed an empty cart.** Now it uses the full
   cart unless a `productId` (Buy Now) is present.
4. `Checkout.jsx` called `paymentService` and `shipmentService` without
   importing them, and `paymentService.js` **did not exist at all**. Placing
   any order crashed immediately.
5. `shipmentService.js` imported the API-client *factory function* itself
   instead of a built instance → `api.post is not a function`.
6. File name casing (`Checkoutservice.js`/`OrderService.js` vs. imports
   `checkoutService`/`orderService`) — resolves on case-insensitive Windows,
   **fails to build on case-sensitive Linux/Docker/most CI & hosting.**
7. `b2bService.js` imported a raw factory function as if it were a ready
   API client → every B2B/bulk-order call threw immediately.
8. `baseService.js` had the same broken-factory-import bug (affects the
   admin Users module).
9. No `/orders/:id` route existed — after a successful order, the app
   navigated to a URL with no matching route and silently bounced to
   `/login`, making a **successful** order look like a failure.
10. A stray `//comment` sat directly inside `<Routes>` JSX children, which
    React Router can throw on.
11. `MyBulkOrders.jsx` linked to `/my-bulk-orders/:id` but the registered
    route was `/bulk-order/:id` — clicking any bulk order 404'd.
12. `B2BTable.jsx`'s admin "View" button linked to `/admin/b2b-enquiries/:id`
    (hyphen) but the registered route is `/admin/b2b/enquiries/:id` (slash).
13. `MyBulkOrders.jsx` / `B2BOrderTracking.jsx` double-unwrapped the API
    response (`response.data.data`) — would always render empty/undefined
    once the b2bService import bug above was fixed.
14. `PaymentModel.jsx` previously had a fake `Math.random()` payment
    simulator. It now requires server-verified Razorpay Checkout or QR
    payment; it does not simulate successful charges.
15. `Bulkorder.jsx` (the page for a customer to *submit* a new bulk/B2B
    enquiry) was a completely empty file — implemented.
16. `.env.development` defined `VITE_USER_API` / `VITE_PRODUCT_API`, but
    `env.js` actually reads `VITE_USER_API_URL` / `VITE_DIGITAL_API_URL` —
    names never matched, so env overrides were silently ignored.
17. Five overlapping, inconsistent API-client files (`apiClient.js`,
    `apiInstances.js`, `api.js`, `apiService.js`, `publicapiClient.js`) —
    consolidated into one common module (`apiInstances.js`) that everything
    else now imports from, with the others kept only as thin backward-
    compatible re-export shims.

The project builds cleanly (`npm run build`) after these fixes.

---

## Authentication — `src/modules/Auth/authservice.js` (`userApi`)

The frontend expects every endpoint to return the standard envelope
`{ "success": true, "data": <payload>, "message": "..." }`. The API client
unwraps Axios responses; `authservice.js` unwraps this JSON envelope. The
authentication API implementation is not part of this frontend repository,
so the following endpoints and payloads must be implemented by the backend
before OTP registration or password recovery work end to end.

| Method | Endpoint | Status | Notes |
|---|---|---|---|
| POST | `/Auth/Login` | Update required | Accept email **or** mobile number and password |
| POST | `/Auth/Signup/RequestOtp` | 🆕 REQUIRED | Create a short-lived signup challenge and send OTP |
| POST | `/Auth/Signup/VerifyOtp` | 🆕 REQUIRED | Verify OTP and create the account with the submitted password |
| POST | `/Auth/ForgotPassword/RequestOtp` | 🆕 REQUIRED | Request password-reset OTP without revealing whether an account exists |
| POST | `/Auth/ForgotPassword/Reset` | 🆕 REQUIRED | Verify reset OTP and set the new password |
| POST | `/Auth/ChangePassword` | 🆕 REQUIRED | Authenticated password change |

### Login

Request accepts either contact method in the `identifier` field:
```json
{ "identifier": "customer@example.com", "password": "example-password" }
```

or:
```json
{ "identifier": "+919876543210", "password": "example-password" }
```

On success, return the standard envelope with a `data` object containing
`accessToken`, `refreshToken`, `user`, `roles`, and optional `permissions`.
`user` must include `fullName` (and may include email/mobileNumber); do not
require or display a user ID as the profile label. Return a 4xx response for
invalid credentials.

### Signup OTP

Request OTP with a full name and exactly one verified contact address:
```json
{ "fullName": "Alex Morgan", "email": "customer@example.com" }
```
or:
```json
{ "fullName": "Alex Morgan", "mobileNumber": "+919876543210" }
```

Return a challenge ID and expiration:
```json
{
  "success": true,
  "data": { "challengeId": "opaque-short-lived-id", "expiresInSeconds": 300 },
  "message": "Verification code sent."
}
```

The challenge must be random, short-lived, single-use, bound to the submitted
contact details, and rate-limited. Do not create the account until OTP
verification succeeds. Verification request:
```json
{ "challengeId": "opaque-short-lived-id", "otp": "123456", "password": "example-password" }
```
Return `{ "success": true, "data": { "verified": true }, "message": "Account created." }`
only after verifying the code and securely hashing the password. The frontend
requires passwords to be at least 8 characters and prompts the customer to
sign in after successful verification.

### Forgot / reset password

Request body:
```json
{ "identifier": "customer@example.com" }
```

Return a standard envelope containing a challenge ID and expiry using a
generic message that does not reveal whether the account exists. Deliver the
OTP only to the account's registered email or mobile number. Reset request:
```json
{ "challengeId": "opaque-short-lived-id", "otp": "123456", "newPassword": "new-example-password" }
```

On success, verify and consume the OTP, update the password hash, and return
`{ "success": true, "data": { "updated": true }, "message": "Password updated." }`.
Reject expired, invalid, or previously used challenges.

### Authenticated password change

`POST /Auth/ChangePassword` requires the user's bearer token and accepts:
```json
{ "currentPassword": "current-example-password", "newPassword": "new-example-password" }
```

Verify the current password, enforce the backend password policy, and securely
hash the replacement. Return
`{ "success": true, "data": { "updated": true }, "message": "Password changed." }`
or a 4xx error when the current password is incorrect or the new password is
invalid.

---

## Users and roles — `src/modules/Users/userService.js` (`userApi`)

### User registration

`POST /users` (the existing `USERS.CREATE` endpoint) now sends the backend
registration DTO:
```json
{
  "FullName": "Alex Morgan",
  "Email": "alex@example.com",
  "Password": "example-password",
  "Gender": "Female",
  "Role": "Manager"
}
```

The `Role` value is the selected role's name, not its database ID. The form
offers `Male`, `Female`, and `Other` for `Gender`. The response should use
the shared API envelope. User edits continue to use the existing update
endpoint and its `RoleId`-based request.

### Role management

The existing role endpoints accept the role DTO, including the selected
permission strings:
```json
{
  "id": "role-id",
  "name": "Manager",
  "description": "Manages product operations",
  "isActive": true,
  "permissions": [
    "Products.View",
    "Products.Create",
    "Orders.View"
  ]
}
```

The role editor offers module-scoped permission names in the form
`Module.Action`, with `View`, `Create`, `Edit`, and `Delete` actions where
available. `Dashboard` offers `View` only. The role list also displays saved
permissions. The API should return `permissions` as an array of these exact
strings on role reads and persist that array on role create/update.
