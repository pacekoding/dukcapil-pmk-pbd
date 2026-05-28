package migrations

import "embed"

// FS contains SQL migrations consumed by golang-migrate at application startup.
//
//go:embed *.sql
var FS embed.FS
