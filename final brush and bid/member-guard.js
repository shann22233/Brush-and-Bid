/* =====================================================
   MEMBER PAGE GUARD
   Load in the <head> of every page that needs a logged-in
   user (gallery, auctions, bidding, artist pages...).

   - Visitors who are not logged in are sent to the home
     page with the login popup open, then brought back
     after login.
   - Pages for one kind of user list it on the tag:
       <script src="member-guard.js" data-roles="bidder"></script>
     Other logged-in users are sent to the home page.

   NOTE: like admin-guard.js, this only controls what the
   browser shows. The server must still check the user.
===================================================== */

(function () {

    const script = document.currentScript;

    const allowedRoles =
        String((script && script.dataset.roles) || "")
            .toLowerCase()
            .split(/[\s,]+/)
            .filter(Boolean);

    let loggedIn = false;

    let role = "";

    try {

        loggedIn =
            localStorage.getItem("loggedIn") === "true";

        role =
            String(localStorage.getItem("userRole") || "").toLowerCase();

    }

    catch (error) {

        loggedIn = false;

    }


    document.documentElement.dataset.userRole =
        loggedIn ? role : "guest";


    if (loggedIn && (!allowedRoles.length || allowedRoles.includes(role))) {
        return;
    }


    /* Hide the page immediately so nothing flashes. */

    document.documentElement.style.display = "none";


    if (!loggedIn) {

        const page =
            window.location.pathname.split("/").pop() +
            window.location.search;

        window.location.replace(
            "index.html?login=true&next=" +
            encodeURIComponent(page)
        );

        return;

    }


    /* Logged in, but this page is for another kind of user. */

    const names = {
        bidder: "bidders",
        artist: "artists",
        admin: "admins"
    };

    try {

        sessionStorage.setItem(
            "flashToast",
            JSON.stringify({
                message:
                    "That page is only for " +
                    allowedRoles.map(function (r) { return names[r] || r; }).join(" and ") +
                    ".",
                type: "info"
            })
        );

    }

    catch (error) {
        /* storage unavailable */
    }

    window.location.replace("index.html");

})();
