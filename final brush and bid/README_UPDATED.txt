BRUSH and BID - Updated Frontend
================================

Changes implemented:
- Centralized role-aware navigation in script.js.
- Bidder / Artist / Admin menus are generated from localStorage.userRole and normalized for lowercase/uppercase roles.
- Removed hardcoded role dropdowns and duplicate createRoleMenu logic.
- Added profile controls to about.html, auctions.html and artwork-details.html.
- Admin profile target changed to admindashboard.html.
- Artist profile -> GET/POST /api/artist-profile
- Bidder profile -> GET/POST /api/bidder-profile
- Artwork upload -> POST /api/artworks with base64 image
- Artist auctions -> GET /api/artworks/artist/:artistId
- View artworks -> GET /api/artworks
- Artwork details -> GET /api/artworks/:id
- Place bid -> GET artwork, GET bids, POST bid
- My bids -> GET /api/bids/user/:userId
- Shipping -> GET/POST /api/shipping
- Manage users -> GET /api/users, PUT status, DELETE user
- Manage artworks page created -> approve/reject/select endpoints
- Manage auctions reads real artworks/current auction
- Reports reads users/artworks/current auction/bids APIs
- Admin dashboard reads /api/dashboard
- Gallery reads real artist users
- Artist artworks reads real artist artwork endpoint
- Auctions uses real endDate/endTime countdown
- Terms and Privacy pages created and linked from registration.
- Register page rebuilt as a functional standalone registration page.
- Shipping page rebuilt with shared style/header/footer.
- Artwork links now use numeric artwork_id values.
- Artwork details Back button returns to the artist artworks page when that was the referring page.
- Home hero heading/paragraph typography hierarchy improved.

API base:
By default requests use relative paths such as /api/users. If the frontend is hosted separately from the backend, set window.API_BASE before script.js, e.g.:
window.API_BASE = "http://localhost:5000";

Important:
The uploaded project contained the frontend/SQL but not server.js, so live API behavior could not be executed here. The frontend is wired to the endpoint contract in your checklist.
