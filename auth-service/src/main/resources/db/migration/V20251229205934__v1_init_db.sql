CREATE TABLE users (
    id bigserial PRIMARY KEY,
    name varchar(255) NOT NULL,
    email varchar(255) NOT NULL UNIQUE,
    hashed_password varchar(255) NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);