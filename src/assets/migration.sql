-- ============================================
-- Tabla 1: products (simula info del POS/ERP)
-- ============================================
CREATE TABLE products (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(150)   NOT NULL,
    description   TEXT,
    category      VARCHAR(100),
    sku           VARCHAR(50)    UNIQUE,
    price         DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stock         INTEGER        NOT NULL DEFAULT 0,
    image_url     VARCHAR(500),
    is_available  BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Tabla 2: orders (pedidos con estado)
-- ============================================
CREATE TABLE orders (
    id            SERIAL PRIMARY KEY,
    order_number  INTEGER        NOT NULL UNIQUE,
    customer_name VARCHAR(150),
    status        VARCHAR(20)    NOT NULL DEFAULT 'preparing'
                  CHECK (status IN ('preparing', 'ready', 'delivered', 'cancelled')),
    items         JSONB          NOT NULL DEFAULT '[]',
    total         DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    notes         TEXT,
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
);
