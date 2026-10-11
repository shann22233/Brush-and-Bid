DROP DATABASE IF EXISTS brush_and_bid;

CREATE DATABASE brush_and_bid;

USE brush_and_bid;


-- ============================================================
-- 1. USERS
-- ============================================================

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,

    full_name VARCHAR(150) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    phone VARCHAR(20) DEFAULT NULL,

    password_hash VARCHAR(255) NOT NULL,

    role ENUM('bidder', 'artist') NOT NULL,

    status ENUM('Active', 'Inactive')
        NOT NULL DEFAULT 'Active',

    email_verified BOOLEAN
        NOT NULL DEFAULT FALSE,

    otp_code VARCHAR(10)
        DEFAULT NULL,

    otp_expiry DATETIME
        DEFAULT NULL,

    joined_date DATE
        NOT NULL DEFAULT (CURRENT_DATE),

    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


CREATE INDEX idx_users_role
ON users(role);

CREATE INDEX idx_users_status
ON users(status);

CREATE INDEX idx_users_email
ON users(email);




-- ============================================================
-- 3. ARTIST PROFILES
-- ============================================================

CREATE TABLE artist_profiles (

    artist_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL UNIQUE,

    full_name VARCHAR(150),

    email VARCHAR(150),

    bio TEXT,

    phone VARCHAR(20),

    specialization VARCHAR(150),

    experience_years INT,

    portfolio_link VARCHAR(500),

    address TEXT,

    city VARCHAR(100),

    state VARCHAR(100),

    country VARCHAR(100)
        DEFAULT 'India',

    profile_image MEDIUMTEXT,

    CONSTRAINT fk_artist_profile_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE

);


-- ============================================================
-- 4. BIDDER PROFILES
-- ============================================================

CREATE TABLE bidder_profiles (

    bidder_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL UNIQUE,

    full_name VARCHAR(150),

    email VARCHAR(150),

    phone VARCHAR(20),

    date_of_birth DATE,

    gender VARCHAR(30),

    address TEXT,

    city VARCHAR(100),

    state VARCHAR(100),

    country VARCHAR(100)
        DEFAULT 'India',

    pincode VARCHAR(15),

    profile_image MEDIUMTEXT,

    CONSTRAINT fk_bidder_profile_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE

);


-- ============================================================
-- 5. AUCTIONS
--    (created BEFORE artworks now, since artworks.auction_id
--    needs to reference this table with a real foreign key)
-- ============================================================

CREATE TABLE auctions (

    auction_id INT AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(200) NOT NULL,

    description TEXT,

    start_time DATETIME NOT NULL,

    end_time DATETIME NOT NULL,

    status ENUM(
        'Scheduled',
        'Active',
        'Closed'
    )
    NOT NULL DEFAULT 'Scheduled',

    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_auction_time
        CHECK (end_time > start_time)

);


CREATE INDEX idx_auctions_status
ON auctions(status);

CREATE INDEX idx_auctions_start
ON auctions(start_time);

CREATE INDEX idx_auctions_end
ON auctions(end_time);


-- ============================================================
-- 6. ARTWORKS
-- ============================================================

CREATE TABLE artworks (

    artwork_id INT AUTO_INCREMENT PRIMARY KEY,

    artist_id INT NOT NULL,

    title VARCHAR(150) NOT NULL,

    description TEXT,

    category VARCHAR(100),

    medium VARCHAR(100),

    dimensions VARCHAR(100),

    year_created INT,

    starting_price DECIMAL(10,2) NOT NULL,

    current_bid DECIMAL(10,2) NOT NULL DEFAULT 0,

    image_url MEDIUMTEXT,

    status ENUM(
        'Pending',
        'Approved',
        'Rejected'
    )
    NOT NULL DEFAULT 'Pending',

    auction_id INT DEFAULT NULL,

    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_artwork_artist
        FOREIGN KEY (artist_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    -- ============================================================
    -- FIX: this foreign key was missing before. Without it, MySQL
    -- had no way to reject an artwork pointing at an auction_id
    -- that doesn't exist, and deleting an auction would leave
    -- artworks pointing at a dead ID. ON DELETE SET NULL means
    -- if an auction is ever deleted, the artwork simply becomes
    -- unassigned again instead of breaking.
    -- ============================================================
    CONSTRAINT fk_artwork_auction
        FOREIGN KEY (auction_id)
        REFERENCES auctions(auction_id)
        ON DELETE SET NULL,

    CONSTRAINT chk_starting_price
        CHECK (starting_price > 0),

    CONSTRAINT chk_current_bid
        CHECK (current_bid >= 0)

);


CREATE INDEX idx_artworks_artist
ON artworks(artist_id);

CREATE INDEX idx_artworks_status
ON artworks(status);

CREATE INDEX idx_artworks_auction
ON artworks(auction_id);


-- ============================================================
-- 7. BIDS
-- ============================================================

CREATE TABLE bids (

    bid_id INT AUTO_INCREMENT PRIMARY KEY,

    bidder_id INT NOT NULL,

    artwork_id INT NOT NULL,

    auction_id INT NOT NULL,

    bid_amount DECIMAL(10,2) NOT NULL,

    bid_time TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bid_bidder
        FOREIGN KEY (bidder_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_bid_artwork
        FOREIGN KEY (artwork_id)
        REFERENCES artworks(artwork_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_bid_auction
        FOREIGN KEY (auction_id)
        REFERENCES auctions(auction_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_bid_amount
        CHECK (bid_amount > 0)

);


CREATE INDEX idx_bids_bidder
ON bids(bidder_id);

CREATE INDEX idx_bids_artwork
ON bids(artwork_id);

CREATE INDEX idx_bids_auction
ON bids(auction_id);

CREATE INDEX idx_bids_time
ON bids(bid_time);


-- ============================================================
-- 8. SHIPPING DETAILS
-- ============================================================

CREATE TABLE shipping_details (

    shipping_id INT AUTO_INCREMENT PRIMARY KEY,

    bidder_id INT NOT NULL,

    bid_id INT NOT NULL UNIQUE,

    full_name VARCHAR(150) NOT NULL,

    phone VARCHAR(20),

    email VARCHAR(150),

    address TEXT NOT NULL,

    city VARCHAR(100) NOT NULL,

    state VARCHAR(100) NOT NULL,

    country VARCHAR(100)
        DEFAULT 'India',

    pincode VARCHAR(15) NOT NULL,

    shipping_status VARCHAR(50) NOT NULL DEFAULT 'Order Confirmed',

    tracking_number VARCHAR(100) DEFAULT NULL,

    order_confirmed_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    packing_at DATETIME DEFAULT NULL,

    shipped_at DATETIME DEFAULT NULL,

    out_for_delivery_at DATETIME DEFAULT NULL,

    delivered_at DATETIME DEFAULT NULL,

    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_shipping_bidder
        FOREIGN KEY (bidder_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_shipping_bid
        FOREIGN KEY (bid_id)
        REFERENCES bids(bid_id)
        ON DELETE CASCADE

);


CREATE INDEX idx_shipping_bidder
ON shipping_details(bidder_id);

CREATE INDEX idx_shipping_bid
ON shipping_details(bid_id);


-- ============================================================
-- 9. PAYMENT TRANSACTIONS / BILLING
-- ============================================================

CREATE TABLE payment_transactions (

    transaction_id INT AUTO_INCREMENT PRIMARY KEY,

    bidder_id INT NOT NULL,

    bid_id INT NOT NULL UNIQUE,

    amount DECIMAL(10,2) NOT NULL,

    payment_method ENUM('UPI', 'Card', 'Net Banking') NOT NULL,

    transaction_reference VARCHAR(100) NOT NULL UNIQUE,

    payment_status ENUM('Pending', 'Paid', 'Failed') NOT NULL DEFAULT 'Pending',

    paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_bidder
        FOREIGN KEY (bidder_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_payment_bid
        FOREIGN KEY (bid_id)
        REFERENCES bids(bid_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_payment_amount
        CHECK (amount > 0)

);

CREATE INDEX idx_payment_bidder
ON payment_transactions(bidder_id);

CREATE INDEX idx_payment_status
ON payment_transactions(payment_status);


-- ============================================================
-- 11. TEST ARTIST
-- ============================================================

INSERT INTO users
(
    full_name,
    email,
    password_hash,
    role,
    status,
    email_verified
)
VALUES
(
    'Ananya Sharma',
    'ananya@email.com',
    '$2b$10$06TswYzUOZsFx4ZV1iEWI.2UVP24SVtLfke31kFud0rjDaztO4Xdm',
    'artist',
    'Active',
    TRUE
);


-- ============================================================
-- 12. TEST BIDDER
-- ============================================================

INSERT INTO users
(
    full_name,
    email,
    password_hash,
    role,
    status,
    email_verified
)
VALUES
(
    'Rahul Kumar',
    'rahul@email.com',
    '$2b$10$kgpuGXCceD3vtIGknIoBg.A.YWY0G0m1f02..eKGAWRh65Vqa0h6a',
    'bidder',
    'Active',
    TRUE
);


-- ============================================================
-- 13. TEST ARTIST PROFILE
-- ============================================================

INSERT INTO artist_profiles
(
    user_id,
    full_name,
    email,
    phone,
    address,
    city,
    state,
    country,
    bio
)
VALUES
(
    1,
    'Ananya Sharma',
    'ananya@email.com',
    '9876543210',
    'Bengaluru',
    'Bengaluru',
    'Karnataka',
    'India',
    'Contemporary artist specialising in creative artwork.'
);
USE brush_and_bid;

-- ============================================================
-- 13b. TEST ACTIVE AUCTION
--    Added so the public Auctions page has a live auction to
--    find. start_time is set 1 day in the past and end_time
--    7 days in the future (relative to whenever this script is
--    run), so it will not be immediately auto-closed by the
--    "UPDATE auctions SET status='Closed' ... WHERE end_time
--    <= NOW()" logic in server.js.
-- ============================================================

INSERT INTO auctions
(
    title,
    description,
    start_time,
    end_time,
    status
)
VALUES
(
    'Featured Art Auction',
    'A curated auction of approved artworks.',
    NOW(),
    DATE_ADD(NOW(), INTERVAL 7 DAY),
    'Active'
);

INSERT INTO artworks
(
    artist_id,
    title,
    description,
    category,
    medium,
    dimensions,
    year_created,
    starting_price,
    current_bid,
    image_url,
    status,
    auction_id
)
VALUES
(
    1,                              -- Ananya Sharma's user_id
    'Sunset Over the Hills',
    'A vibrant acrylic landscape capturing golden hour light.',
    'Landscape',
    'Acrylic on Canvas',
    '60cm x 40cm',
    2024,
    12000.00,
    12000.00,
    'https://satgurus.com/cdn/shop/articles/indian-art_paintings.jpg?v=1712575516',
    'Approved',
    1                               -- links it to the Active auction above
);

-- ============================================================
-- 14. TEST BIDDER PROFILE
-- ============================================================

INSERT INTO bidder_profiles
(
    user_id,
    full_name,
    email,
    phone,
    address,
    city,
    state,
    country,
    pincode
)
VALUES
(
    2,
    'Rahul Kumar',
    'rahul@email.com',
    '9876500000',
    'Bengaluru',
    'Bengaluru',
    'Karnataka',
    'India',
    '560001'
);


-- ============================================================
-- DISPLAY / VERIFICATION
-- ============================================================

SELECT user_id, full_name, email, role, status, email_verified, joined_date
FROM users ORDER BY user_id;

SELECT artist_id, user_id, full_name, email, phone, specialization, experience_years, portfolio_link, city, state, country
FROM artist_profiles ORDER BY artist_id;

SELECT bidder_id, user_id, full_name, email, phone, date_of_birth, gender, city, state, country, pincode
FROM bidder_profiles ORDER BY bidder_id;

SELECT artwork_id, artist_id, title, category, starting_price, current_bid, status, auction_id
FROM artworks ORDER BY artwork_id;

SELECT auction_id, title, start_time, end_time, status
FROM auctions ORDER BY auction_id;

SELECT bid_id, bidder_id, artwork_id, auction_id, bid_amount, bid_time
FROM bids ORDER BY bid_id;

SELECT shipping_id, bidder_id, bid_id, full_name, phone, city, state, country, pincode
FROM shipping_details ORDER BY shipping_id;

SELECT transaction_id, bidder_id, bid_id, amount, payment_method, transaction_reference, payment_status, paid_at
FROM payment_transactions ORDER BY transaction_id;

SHOW TABLES;
