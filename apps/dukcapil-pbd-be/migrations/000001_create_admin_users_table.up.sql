CREATE TABLE IF NOT EXISTS admin_users (
	id BIGSERIAL PRIMARY KEY,
	username VARCHAR(64) NOT NULL UNIQUE,
	full_name VARCHAR(120) NOT NULL,
	role VARCHAR(32) NOT NULL,
	password_hash TEXT NOT NULL,
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT admin_users_role_check CHECK (
		role IN ('superadmin', 'admin_dukcapil', 'admin_pmk', 'admin_sekretariat')
	)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_username_lower ON admin_users (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);
