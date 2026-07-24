CREATE TABLE IF NOT EXISTS optima_info_articles (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT NOT NULL DEFAULT '',
  thumbnail_original_name TEXT NOT NULL DEFAULT '',
  thumbnail_mime_type TEXT NOT NULL DEFAULT '',
  thumbnail_size BIGINT NOT NULL DEFAULT 0,
  attachment_url TEXT NOT NULL DEFAULT '',
  attachment_original_name TEXT NOT NULL DEFAULT '',
  attachment_mime_type TEXT NOT NULL DEFAULT '',
  attachment_size BIGINT NOT NULL DEFAULT 0,
  external_url TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(16) NOT NULL DEFAULT 'Draft',
  start_date DATE,
  end_date DATE,
  author_user_id BIGINT,
  author_name TEXT NOT NULL DEFAULT '',
  published_by_user_id BIGINT,
  published_by_name TEXT NOT NULL DEFAULT '',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT optima_info_articles_slug_not_blank CHECK (BTRIM(slug) <> ''),
  CONSTRAINT optima_info_articles_status_check CHECK (
    status IN ('Draft', 'Published', 'Archived')
  ),
  CONSTRAINT optima_info_articles_period_check CHECK (
    start_date IS NULL OR end_date IS NULL OR start_date <= end_date
  ),
  CONSTRAINT optima_info_articles_thumbnail_size_nonnegative CHECK (thumbnail_size >= 0),
  CONSTRAINT optima_info_articles_attachment_size_nonnegative CHECK (attachment_size >= 0),
  CONSTRAINT optima_info_articles_display_order_nonnegative CHECK (display_order >= 0),
  CONSTRAINT optima_info_articles_author_fk FOREIGN KEY (author_user_id) REFERENCES admin_users(id) ON DELETE SET NULL,
  CONSTRAINT optima_info_articles_published_by_fk FOREIGN KEY (published_by_user_id) REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_optima_info_articles_slug_unique
  ON optima_info_articles (LOWER(slug));
CREATE INDEX IF NOT EXISTS idx_optima_info_articles_status
  ON optima_info_articles (status, published_at DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_optima_info_articles_category
  ON optima_info_articles (LOWER(category));
CREATE INDEX IF NOT EXISTS idx_optima_info_articles_featured
  ON optima_info_articles (is_featured, display_order ASC, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_optima_info_articles_title
  ON optima_info_articles (LOWER(title));
