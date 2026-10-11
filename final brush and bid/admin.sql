USE brush_and_bid;

-- ============================================================
-- ADMIN SQL
-- Run this file after brush_and_bid.sql in MySQL Workbench.
-- ============================================================

ALTER TABLE users
MODIFY role ENUM('bidder', 'artist', 'admin') NOT NULL;

CREATE TABLE IF NOT EXISTS admin_emails (
    admin_email_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (full_name, email, password_hash, role, status, email_verified)
VALUES
('Joan Tressa Thomas', 'joantressathomas5@gmail.com', '$2b$10$QfSKHpeUHeut7bR7HqUvDec5xq3FFZNVB7ZzZRUBdReX91hTB5WIy', 'admin', 'Active', TRUE),
('Supritha raju s', 'supritharaju550@gmail.com', '$2b$10$4Ec8YQeId1TLP7LW6elLL.bWVYB9M63ZtVx5Fgd29tBQj6Q.Xi1fC', 'admin', 'Active', TRUE),
('Navya Gowda', 'navyagowda8924@gmail.com', '$2b$10$OqvTnVcM73XVQQFjD0kHLOvV8k7FfwTSm1ltrY3dQthZlaSSMqYsS', 'admin', 'Active', TRUE),
('Arpita Sharon', 'arpitasharon08@gmail.com', '$2b$10$jZv6uEyF/rSICTNruTpOcubdIuRGIr.zJt3My6umLxJuAYfwP7ecS', 'admin', 'Active', TRUE);

INSERT INTO admin_emails (email, status)
VALUES
('joantressathomas5@gmail.com', 'Active'),
('supritharaju550@gmail.com', 'Active'),
('navyagowda8924@gmail.com', 'Active'),
('arpitasharon08@gmail.com', 'Active');

-- ADMIN DISPLAY / VERIFICATION
SELECT user_id, full_name, email, role, status, email_verified, joined_date
FROM users WHERE role = 'admin' ORDER BY user_id;

SELECT admin_email_id, email, status, created_at
FROM admin_emails ORDER BY admin_email_id;

SHOW TABLES;
USE brush_and_bid;

UPDATE users
SET password_hash = '$2b$10$CFFdPmRGmXUDAjSiJcMmm.ytXiuNDHKuV0CNuW/FIt2RcPJs8PL4y'
WHERE email = 'arpitasharon08@gmail.com'
  AND role = 'admin';
  SELECT user_id, full_name, email, role, status, email_verified
FROM users
WHERE email = 'arpitasharon08@gmail.com';