/* =====================================================
   ADMIN PAGE GUARD
   Load in the <head> of every admin page, before any
   other script, so the page never shows to non-admins.

   NOTE: this only stops people opening admin pages in
   the browser. The /api/admin/... endpoints must also
   check the user on the server.
===================================================== */

(function () {

    let isAdmin = false;

    try {

        isAdmin =
            localStorage.getItem("loggedIn") === "true" &&
            String(localStorage.getItem("userRole") || "")
                .toLowerCase() === "admin";

    }

    catch (error) {

        isAdmin = false;

    }


    if (isAdmin) {
        return;
    }


    /* Hide the page immediately so nothing flashes. */

    document.documentElement.style.display = "none";


    const page =
        window.location.pathname.split("/").pop();

    window.location.replace(
        "adminlogin.html?next=" +
        encodeURIComponent(page)
    );

})();
