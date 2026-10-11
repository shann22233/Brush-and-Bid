/* =========================================================
BRUSH and BID
SHARED JAVASCRIPT
========================================================= */

(function () {

"use strict";


/* =====================================================
   API CONFIGURATION
===================================================== */

const API_BASE = "http://localhost:5010";

window.API_BASE = API_BASE;


/* =====================================================
   GET CURRENT USER
===================================================== */

function getCurrentUser() {

    const loggedIn =
        localStorage.getItem("loggedIn") === "true";

    const userId =
        localStorage.getItem("userId") ||
        localStorage.getItem("user_id") ||
        "";

    const name =
        localStorage.getItem("userName") ||
        "";

    const email =
        localStorage.getItem("userEmail") ||
        "";

    const rawRole =
        localStorage.getItem("userRole") ||
        "";

    let role = "";

    if (rawRole.toLowerCase() === "artist") {
        role = "Artist";
    }

    else if (rawRole.toLowerCase() === "bidder") {
        role = "Bidder";
    }

    else if (rawRole.toLowerCase() === "admin") {
        role = "Admin";
    }

    return {

        loggedIn: loggedIn,

        id: String(userId),

        user_id: String(userId),

        name:
            name ||
            email.split("@")[0] ||
            "User",

        email: email,

        role: role

    };

}


window.getCurrentUser = getCurrentUser;


/* =====================================================
   API FETCH HELPER
===================================================== */

window.apiFetch = async function (path, options = {}) {

    const config = {
        ...options,
        headers: {
            ...(options.headers || {})
        }
    };


    /*
     * Automatically convert JavaScript objects
     * into JSON.
     */

    if (
        config.body &&
        typeof config.body !== "string"
    ) {

        config.headers["Content-Type"] =
            "application/json";

        config.body =
            JSON.stringify(config.body);

    }


    let response;

    startLoadingBar();

    try {

        response =
            await fetch(
                API_BASE + path,
                config
            );

    }

    finally {

        stopLoadingBar();

    }


    let data = null;


    try {

        data =
            await response.json();

    }

    catch (error) {

        data = null;

    }


    if (!response.ok) {

        throw new Error(
            data?.message ||
            data?.error ||
            `Request failed (${response.status})`
        );

    }


    return data;

};


/* =====================================================
   ENSURE USER ID
===================================================== */

window.ensureUserId = async function () {

    const user =
        getCurrentUser();


    if (user.id) {

        return user.id;

    }


    if (
        !user.loggedIn ||
        !user.email
    ) {

        return "";

    }


    try {

        const data =
            await window.apiFetch(
                "/api/users"
            );


        const users =
            Array.isArray(data)
                ? data
                : (
                    data?.users ||
                    []
                );


        const found =
            users.find(
                item =>
                    String(
                        item.email || ""
                    ).toLowerCase() ===
                    user.email.toLowerCase()
            );


        if (!found) {

            return "";

        }


        const id =
            found.user_id ||
            found.id ||
            "";


        if (id) {

            localStorage.setItem(
                "userId",
                id
            );

        }


        return String(id);

    }

    catch (error) {

        console.error(
            "Unable to determine user ID:",
            error
        );

        return "";

    }

};


/* =====================================================
   ROLE NORMALIZATION
===================================================== */

function normalizeRole(role) {

    const value =
        String(role || "")
        .trim()
        .toLowerCase();


    if (value === "artist") {

        return "Artist";

    }


    if (value === "bidder") {

        return "Bidder";

    }


    if (value === "admin") {

        return "Admin";

    }


    return "";

}


window.normalizeRole =
    normalizeRole;


/* =====================================================
   SAVE LOGIN SESSION
   Used after login and after OTP verification.
   Password is NEVER stored.
===================================================== */

function saveLoginSession(user) {

    localStorage.setItem("loggedIn", "true");

    localStorage.setItem(
        "userId",
        user.user_id || user.userId || user.id || ""
    );

    localStorage.setItem(
        "userName",
        user.full_name || user.name || "User"
    );

    localStorage.setItem(
        "userEmail",
        user.email || ""
    );

    localStorage.setItem(
        "userRole",
        normalizeRole(user.role)
    );

    localStorage.setItem(
        "userPhone",
        user.phone || ""
    );

}


window.saveLoginSession =
    saveLoginSession;


/* =====================================================
   SUBMIT BUTTON STATE
   Keeps a form's submit button disabled (faded)
   until every required field is filled in and
   every required checkbox is ticked.
===================================================== */

function updateSubmitState(form) {

    if (!form) {
        return;
    }

    const button =
        form.querySelector("button[type='submit']");

    if (!button) {
        return;
    }

    const allFilled =
        Array.from(
            form.querySelectorAll("[required]")
        ).every(function (field) {

            if (field.type === "checkbox") {
                return field.checked;
            }

            const value = field.value.trim();

            if (field.pattern) {
                return new RegExp(
                    "^(?:" + field.pattern + ")$"
                ).test(value);
            }

            return value !== "";
        });

    button.disabled = !allFilled;

}


function watchRequiredFields(formId) {

    const form =
        document.getElementById(formId);

    if (!form) {
        return;
    }

    form.addEventListener("input", function () {
        updateSubmitState(form);
    });

    form.addEventListener("change", function () {
        updateSubmitState(form);
    });

    form.addEventListener("reset", function () {
        setTimeout(function () {
            updateSubmitState(form);
        });
    });

    updateSubmitState(form);

}


window.updateSubmitState =
    updateSubmitState;

window.watchRequiredFields =
    watchRequiredFields;


document.addEventListener("DOMContentLoaded", function () {

    watchRequiredFields("registerForm");

    watchRequiredFields("standaloneRegisterForm");

    watchRequiredFields("otpForm");

    watchRequiredFields("registerOtpForm");

    watchRequiredFields("forgotRequestForm");

    watchRequiredFields("forgotResetForm");

});


/* =====================================================
   PROFILE INITIAL
   Uses the FIRST LETTER of the EMAIL ADDRESS
===================================================== */

function getInitial(email) {

    const clean =
        String(
            email || ""
        ).trim();


    if (clean) {

        return clean
            .charAt(0)
            .toUpperCase();

    }


    return "U";

}


/* =====================================================
   PROFILE PAGE
===================================================== */

function getProfilePage(role) {

    role =
        normalizeRole(role);


    if (role === "Bidder") {

        return "bidderprofile.html";

    }


    if (role === "Artist") {

        return "artistprofile.html";

    }


    if (role === "Admin") {

        return "admindashboard.html";

    }


    return "#";

}


window.getProfilePage =
    getProfilePage;


/* =====================================================
   LOGOUT
===================================================== */

window.logoutUser = function () {

    const keys = [

        "loggedIn",

        "userId",

        "user_id",

        "userName",

        "userEmail",

        "userRole",

        "userPhone"

    ];


    keys.forEach(
        key =>
            localStorage.removeItem(key)
    );


    /*
     * Do not remove unrelated website data.
     *
     * Most importantly, passwords are never
     * stored here.
     */


    window.location.href =
        "index.html";

};


/* =====================================================
   PROFILE DROPDOWN
===================================================== */

window.toggleProfileMenu = function () {

    const menu =
        document.getElementById(
            "profileMenu"
        );


    if (!menu) {

        return;

    }


    menu.classList.toggle(
        "show"
    );

};


/* =====================================================
   BUILD ROLE MENU
===================================================== */

function buildRoleMenu(role) {

    const navbar =
        document.getElementById(
            "navbar"
        );


    if (!navbar) {

        return;

    }


    /*
     * Remove previously generated role menu.
     */

    navbar
        .querySelectorAll(
            "#roleMenu, .role-menu-generated"
        )
        .forEach(
            element =>
                element.remove()
        );


    role =
        normalizeRole(role);


    /*
     * No role = no role menu.
     */

    if (
        ![
            "Bidder",
            "Artist",
            "Admin"
        ].includes(role)
    ) {

        return;

    }


    const menu =
        document.createElement(
            "li"
        );


    menu.id =
        "roleMenu";


    menu.className =
        "dropdown role-menu-generated";


    let items = [];


    /* =================================================
       BIDDER MENU
    ================================================= */

    if (role === "Bidder") {

        items = [

            [
                "View Artworks",
                "viewartworks.html"
            ],

            [
                "Place Bid",
                "placebid.html"
            ],

            [
                "My Bids",
                "mybids.html"
            ],

            [
                "Profile",
                "bidderprofile.html"
            ]

        ];

    }


    /* =================================================
       ARTIST MENU
    ================================================= */

    else if (role === "Artist") {

        items = [

            [
                "Upload Artwork",
                "uploadartwork.html"
            ],

            [
                "My Artworks",
                "artist-artworks.html"
            ],

            [
                "View Auctions",
                "viewauctions.html"
            ],

            [
                "Profile",
                "artistprofile.html"
            ]

        ];

    }


    /* =================================================
       ADMIN MENU
    ================================================= */

    else if (role === "Admin") {

        items = [

            [
                "Dashboard",
                "admindashboard.html"
            ],

            [
                "Manage Users",
                "manageusers.html"
            ],

            [
                "Manage Artworks",
                "manageartworks.html"
            ],

            [
                "Manage Auctions",
                "manageauctions.html"
            ],

            [
                "Reports",
                "reports.html"
            ]

        ];

    }


    const dropdown =
        items
            .map(
                item =>

                `<li>
                    <a href="${item[1]}">
                        ${item[0]}
                    </a>
                </li>`

            )
            .join("");


    menu.innerHTML = `

        <a
            href="#"
            class="role-main-link">

            ${role} ▼

        </a>

        <ul
            class="dropdown-content">

            ${dropdown}

        </ul>

    `;


    navbar.appendChild(
        menu
    );


    const mainLink =
        menu.querySelector(
            ".role-main-link"
        );


    const dropdownElement =
        menu.querySelector(
            ".dropdown-content"
        );


    if (
        mainLink &&
        dropdownElement
    ) {

        mainLink.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                event.stopPropagation();

                dropdownElement
                    .classList
                    .toggle("show");

            }
        );


        dropdownElement.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

            }
        );

    }

}


/* =====================================================
   SET HEADER
===================================================== */

function setHeader() {

    const user =
        getCurrentUser();


    const loginButton =
        document.getElementById(
            "loginBtn"
        );


    const profileArea =
        document.getElementById(
            "profileArea"
        );


    /*
     * USER NOT LOGGED IN
     */

    if (!user.loggedIn) {

        if (loginButton) {

            loginButton.style.display =
                "";

        }


        if (profileArea) {

            profileArea.style.display =
                "none";

        }


        buildRoleMenu("");

        return;

    }


    /*
     * USER LOGGED IN
     */

    if (loginButton) {

        loginButton.style.display =
            "none";

    }


    if (profileArea) {

        profileArea.style.display =
            "flex";

    }


    /* =================================================
       PROFILE ICON

       The first letter of the registered
       email address is displayed.

       Example:
       joantt3012@gmail.com → J
       alex@gmail.com       → A
       user@gmail.com       → U
    ================================================= */

    const icon =
        document.getElementById(
            "profileIcon"
        );


    if (icon) {

        icon.textContent =
            getInitial(
                user.email
            );

        icon.className =
            "profile-icon profile-initial";

        icon.title =
            user.email || user.name;

    }


    /* Profile name */

    const name =
        document.getElementById(
            "profileName"
        );


    if (name) {

        name.textContent =
            user.name;

    }


    /* Profile email */

    const email =
        document.getElementById(
            "profileEmail"
        );


    if (email) {

        email.textContent =
            user.email;

    }


    /* Profile role */

    const role =
        document.getElementById(
            "profileRole"
        );


    if (role) {

        role.textContent =
            user.role;

    }


    /* Profile page */

    const profilePage =
        document.getElementById(
            "profilePage"
        );


    if (profilePage) {

        profilePage.href =
            getProfilePage(
                user.role
            );

    }


    /*
     * Other pages may contain
     * these display elements.
     */

    const displayElements = [

        "profileDisplayName",

        "artistDisplayName",

        "adminDisplayName",

        "largeProfileName"

    ];


    displayElements.forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.textContent =
                    user.name;

            }

        }
    );


    const largeRole =
        document.getElementById(
            "largeProfileRole"
        );


    if (largeRole) {

        if (
            user.role === "Admin"
        ) {

            largeRole.textContent =
                "Administrator";

        }

        else {

            largeRole.textContent =
                "Registered " +
                user.role;

        }

    }


    /*
     * Build role-specific navigation.
     */

    buildRoleMenu(
        user.role
    );

}


window.setHeader =
    setHeader;


/* =====================================================
   LOGIN LINK FROM OTHER PAGES
===================================================== */

function handleLoginRedirect() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    if (
        params.get("login") === "true" &&
        typeof window.openLogin ===
            "function"
    ) {

        window.openLogin();

    }

}


/* =====================================================
   DOCUMENT CLICK HANDLER
===================================================== */

document.addEventListener(
    "click",
    function (event) {

        /*
         * Close profile menu when
         * clicking outside it.
         */

        const profileArea =
            document.getElementById(
                "profileArea"
            );


        const profileMenu =
            document.getElementById(
                "profileMenu"
            );


        if (
            profileArea &&
            profileMenu &&
            !profileArea.contains(
                event.target
            )
        ) {

            profileMenu
                .classList
                .remove("show");

        }


        /*
         * Close role dropdown
         * when clicking outside.
         */

        const roleMenu =
            document.getElementById(
                "roleMenu"
            );


        if (
            roleMenu &&
            !roleMenu.contains(
                event.target
            )
        ) {

            const dropdown =
                roleMenu.querySelector(
                    ".dropdown-content"
                );


            if (dropdown) {

                dropdown
                    .classList
                    .remove("show");

            }

        }

    }
);


/* =====================================================
   INITIALIZE HEADER
===================================================== */

window.addEventListener(
    "DOMContentLoaded",
    function () {

        setHeader();

        handleLoginRedirect();

    }
);
 

})();


/* =========================================================
TERMS & CONDITIONS / PRIVACY POLICY
========================================================= */

(function () {

"use strict";


const POLICY_CONTENT = {

    terms: {

        title:
            "Terms & Conditions",

        html: `

            <h3>
                1. Account Use
            </h3>

            <p>
                Users must provide accurate information
                and keep their account credentials secure.
            </p>


            <h3>
                2. Artwork Submissions
            </h3>

            <p>
                Artists must submit original or lawfully
                owned artwork. Submissions are subject
                to administrative review.
            </p>


            <h3>
                3. Bidding
            </h3>

            <p>
                Bids are binding once submitted.
                A bidder should enter only amounts
                they are prepared to pay.
            </p>


            <h3>
                4. Auctions
            </h3>

            <p>
                Each weekly auction follows the
                published start and end time.
                The highest valid bid at closing
                is treated as the winning bid,
                subject to platform verification.
            </p>


            <h3>
                5. Prohibited Activity
            </h3>

            <p>
                Users must not manipulate bids,
                submit misleading information,
                or interfere with the operation
                of the platform.
            </p>


            <h3>
                6. Changes
            </h3>

            <p>
                BRUSH and BID may update these terms
                when necessary. Continued use after
                an update indicates acceptance.
            </p>

        `

    },


    privacy: {

        title:
            "Privacy Policy",

        html: `

            <h3>
                1. Information We Collect
            </h3>

            <p>
                We may store account, profile,
                artwork, bid, and shipping information
                needed to operate the auction platform.
            </p>


            <h3>
                2. How Information Is Used
            </h3>

            <p>
                Information is used to authenticate
                users, display profiles and artwork,
                process bids, administer auctions,
                and arrange delivery of winning artwork.
            </p>


            <h3>
                3. Data Protection
            </h3>

            <p>
                Reasonable technical and administrative
                measures should be used to protect
                stored information from unauthorized access.
            </p>


            <h3>
                4. Sharing
            </h3>

            <p>
                Information should only be shared when
                required to operate the service,
                complete delivery, comply with law,
                or with the user's consent.
            </p>


            <h3>
                5. Your Choices
            </h3>

            <p>
                Users can request correction of profile
                and shipping information through the
                relevant account pages.
            </p>


            <h3>
                6. Updates
            </h3>

            <p>
                This policy may be updated as the
                platform evolves.
            </p>

        `

    }

};


/* =====================================================
   CREATE POLICY MODAL
===================================================== */

function getPolicyModal() {

    let modal =
        document.getElementById(
            "policyModal"
        );


    if (modal) {

        return modal;

    }


    modal =
        document.createElement(
            "div"
        );


    modal.id =
        "policyModal";


    modal.className =
        "policy-modal";


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    modal.innerHTML = `

        <div
            class="policy-modal-box"
            role="dialog"
            aria-modal="true">

            <div
                class="policy-modal-header">

                <h2
                    id="policyModalTitle">
                </h2>

                <button
                    type="button"
                    class="policy-modal-close"
                    id="policyModalClose">

                    ×

                </button>

            </div>


            <div
                id="policyModalContent"
                class="policy-modal-content">
            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target === modal ||
                event.target.id ===
                    "policyModalClose"
            ) {

                closePolicy();

            }

        }
    );


    return modal;

}


/* =====================================================
   OPEN POLICY
===================================================== */

function openPolicy(type) {

    const content =
        POLICY_CONTENT[type];


    if (!content) {

        return;

    }


    const modal =
        getPolicyModal();


    const title =
        document.getElementById(
            "policyModalTitle"
        );


    const body =
        document.getElementById(
            "policyModalContent"
        );


    if (title) {

        title.textContent =
            content.title;

    }


    if (body) {

        body.innerHTML =
            content.html;

    }


    modal.classList.add(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "policy-modal-open"
    );

}


/* =====================================================
   CLOSE POLICY
===================================================== */

function closePolicy() {

    const modal =
        document.getElementById(
            "policyModal"
        );


    if (!modal) {

        return;

    }


    modal.classList.remove(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "policy-modal-open"
    );

}


window.openPolicy =
    openPolicy;


window.closePolicy =
    closePolicy;


/* =====================================================
   POLICY LINKS
===================================================== */

document.addEventListener(
    "click",
    function (event) {

        const link =
            event.target.closest(
                "a"
            );


        if (!link) {

            return;

        }


        const href =
            (
                link.getAttribute(
                    "href"
                ) || ""
            ).toLowerCase();


        if (
            href.includes(
                "terms.html"
            )
        ) {

            event.preventDefault();

            openPolicy(
                "terms"
            );

        }


        else if (
            href.includes(
                "privacy.html"
            )
        ) {

            event.preventDefault();

            openPolicy(
                "privacy"
            );

        }

    },
    true
);


/* =====================================================
   ESCAPE TO CLOSE POLICY
===================================================== */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape"
        ) {

            closePolicy();

        }

    }
);

})();

/* =====================================================
   TOAST MESSAGES
   On-page messages that replace browser alert() popups.
   type: "success" | "error" | "info"
===================================================== */

function showToast(message, type) {

    if (!message) {
        return;
    }

    let container =
        document.getElementById("toastContainer");

    if (!container) {

        container = document.createElement("div");

        container.id = "toastContainer";

        container.className = "toast-container";

        container.setAttribute("aria-live", "polite");

        document.body.appendChild(container);

    }

    const toast = document.createElement("div");

    toast.className = "toast toast-" + (type || "info");

    toast.setAttribute(
        "role",
        type === "error" ? "alert" : "status"
    );

    toast.textContent = message;

    container.appendChild(toast);

    function dismiss() {

        toast.classList.add("toast-hide");

        setTimeout(function () {
            toast.remove();
        }, 300);

    }

    toast.addEventListener("click", dismiss);

    setTimeout(dismiss, type === "error" ? 6000 : 4000);

}


/*
 * Show a toast on the NEXT page load.
 * Use before location.reload() or a redirect.
 */
function flashToast(message, type) {

    try {

        sessionStorage.setItem(
            "flashToast",
            JSON.stringify({ message: message, type: type })
        );

    }

    catch (error) {

        showToast(message, type);

    }

}


window.showToast = showToast;

window.flashToast = flashToast;


document.addEventListener("DOMContentLoaded", function () {

    try {

        const saved =
            sessionStorage.getItem("flashToast");

        if (saved) {

            sessionStorage.removeItem("flashToast");

            const toast = JSON.parse(saved);

            showToast(toast.message, toast.type);

        }

    }

    catch (error) {
        /* storage unavailable - nothing to show */
    }

});


/* =====================================================
   SHOW / HIDE PASSWORD
   Adds an eye button to every password field.
===================================================== */

const EYE_ICON =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';

const EYE_OFF_ICON =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';


function addPasswordToggles() {

    document
    .querySelectorAll("input[type='password']")
    .forEach(function (input) {

        if (input.dataset.toggleAdded) {
            return;
        }

        input.dataset.toggleAdded = "true";

        const wrapper = document.createElement("span");

        wrapper.className = "password-field";

        input.parentNode.insertBefore(wrapper, input);

        wrapper.appendChild(input);

        const button = document.createElement("button");

        button.type = "button";

        button.className = "password-toggle";

        button.setAttribute("aria-label", "Show password");

        button.innerHTML = EYE_ICON;

        button.addEventListener("click", function () {

            const hidden = input.type === "password";

            input.type = hidden ? "text" : "password";

            button.innerHTML = hidden ? EYE_OFF_ICON : EYE_ICON;

            button.setAttribute(
                "aria-label",
                hidden ? "Hide password" : "Show password"
            );

            input.focus();

        });

        wrapper.appendChild(button);

    });

}


window.addPasswordToggles = addPasswordToggles;


document.addEventListener(
    "DOMContentLoaded",
    addPasswordToggles
);


/* =====================================================
   LOADING BAR
   Thin bar at the top of the page while apiFetch()
   requests are in progress.
===================================================== */

let activeRequests = 0;

let loadingBarTimer = null;


function startLoadingBar() {

    activeRequests++;

    if (activeRequests > 1) {
        return;
    }

    /* Only show for requests slower than 200ms to avoid flicker. */

    loadingBarTimer = setTimeout(function () {

        let bar = document.getElementById("loadingBar");

        if (!bar) {

            bar = document.createElement("div");

            bar.id = "loadingBar";

            bar.className = "loading-bar";

            document.body.appendChild(bar);

        }

        bar.classList.add("active");

    }, 200);

}


function stopLoadingBar() {

    activeRequests = Math.max(0, activeRequests - 1);

    if (activeRequests > 0) {
        return;
    }

    clearTimeout(loadingBarTimer);

    const bar = document.getElementById("loadingBar");

    if (bar) {
        bar.classList.remove("active");
    }

}


/* =====================================================
   MEMBER-ONLY NAVIGATION
   Logged out: Home, About (+ Login button).
   Logged in:  Gallery, Auctions and the role menu.
   Pages listed here also load member-guard.js.
===================================================== */

const MEMBER_PAGES = [
    "gallery.html",
    "auctions.html",
    "artwork-details.html",
    "artist-artworks.html",
    "viewartworks.html",
    "placebid.html",
    "mybids.html",
    "bidderprofile.html",
    "shippingdetails.html",
    "uploadartwork.html",
    "viewauctions.html",
    "artistprofile.html"
];

const GUEST_ONLY_LINKS = [
    "index.html",
    "about.html"
];

const MEMBER_ONLY_LINKS = [
    "gallery.html",
    "auctions.html"
];


function isLoggedIn() {

    try {
        return localStorage.getItem("loggedIn") === "true";
    }

    catch (error) {
        return false;
    }

}


function pageFromHref(href) {

    try {
        return new URL(href, window.location.href)
            .pathname.split("/").pop() || "index.html";
    }

    catch (error) {
        return "";
    }

}


function updateNavForLogin() {

    const loggedIn = isLoggedIn();

    let hide = loggedIn ? GUEST_ONLY_LINKS : MEMBER_ONLY_LINKS;

    /* Artists follow their own auctions from the Artist menu ("View Auctions"). */

    if (currentRoleKey() === "artist") {
        hide = hide.concat("auctions.html");
    }

    document
    .querySelectorAll("header nav #navbar > li > a[href]")
    .forEach(function (link) {

        const item = link.closest("li");

        if (item && item.id !== "roleMenu") {

            item.hidden =
                hide.includes(pageFromHref(link.getAttribute("href")));

        }

    });

}


/* The logo always leads home (needed once "Home" is hidden). */

function linkLogoHome() {

    document
    .querySelectorAll("header .logo h1, header > h1")
    .forEach(function (logo) {

        if (logo.querySelector("a")) {
            return;
        }

        const link = document.createElement("a");

        link.href = "index.html";

        link.className = "logo-link";

        link.setAttribute("aria-label", "Brush and Bid home");

        while (logo.firstChild) {
            link.appendChild(logo.firstChild);
        }

        logo.appendChild(link);

    });

}


/*
 * Where to go after logging in. Only plain local page
 * names are accepted so ?next= can't send users off-site.
 */

function safeNextPage(value) {

    return value &&
        /^[a-z0-9-]+\.html(\?[A-Za-z0-9=&%_-]*)?$/i.test(value)
            ? value
            : "";

}


function goAfterLogin() {

    let next =
        new URLSearchParams(window.location.search).get("next");

    try {

        next = next || sessionStorage.getItem("loginNext");

        sessionStorage.removeItem("loginNext");

    }

    catch (error) {
        /* storage unavailable */
    }

    next = safeNextPage(next);

    if (next) {
        window.location.href = next;
    }

    else {
        window.location.href = "index.html";
    }

}


window.goAfterLogin = goAfterLogin;

window.isLoggedIn = isLoggedIn;


/* Logged-out visitors who click a member link get the login popup. */

document.addEventListener(
    "click",
    function (event) {

        if (isLoggedIn()) {
            return;
        }

        const link =
            event.target.closest && event.target.closest("a[href]");

        if (!link) {
            return;
        }

        const page = pageFromHref(link.getAttribute("href"));

        if (!MEMBER_PAGES.includes(page)) {
            return;
        }

        event.preventDefault();

        const url = new URL(link.getAttribute("href"), window.location.href);

        const next = page + url.search;

        if (typeof window.openLogin === "function") {

            try {
                sessionStorage.setItem("loginNext", next);
            }

            catch (error) {
                /* storage unavailable */
            }

            window.openLogin();

        }

        else {

            window.location.href =
                "index.html?login=true&next=" + encodeURIComponent(next);

        }

    },
    true
);


updateNavForLogin();

linkLogoHome();

document.addEventListener("DOMContentLoaded", function () {

    updateNavForLogin();

    linkLogoHome();

});


/* =====================================================
   ROLE ON THE PAGE
   <html data-user-role="guest|bidder|artist|admin">
   Elements marked data-show-for="bidder artist" are only
   shown to those roles (see style.css).
===================================================== */

function currentRoleKey() {

    if (!isLoggedIn()) {
        return "guest";
    }

    try {
        return String(localStorage.getItem("userRole") || "").toLowerCase() || "guest";
    }

    catch (error) {
        return "guest";
    }

}

window.currentRoleKey = currentRoleKey;

document.documentElement.dataset.userRole = currentRoleKey();
