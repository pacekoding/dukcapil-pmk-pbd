package storage

import (
	"context"
	"errors"
	"io"
	"time"
)

var (
	ErrInvalidKey = errors.New("invalid storage key")
	ErrNotFound   = errors.New("stored object not found")
	ErrEmpty      = errors.New("stored object is empty")
	ErrTooLarge   = errors.New("stored object exceeds size limit")
	ErrCollision  = errors.New("stored object already exists")
)

type SaveRequest struct {
	Visibility string
	Module     string
	Category   string
	Year       string
	Extension  string
	Reader     io.Reader
	MaxBytes   int64
}

type Object struct {
	Key            string
	StoredFilename string
	Size           int64
	ChecksumSHA256 string
}

type Metadata struct {
	Key      string
	Size     int64
	Modified time.Time
}

type ReadSeekCloser interface {
	io.Reader
	io.Seeker
	io.Closer
}

type Service interface {
	Save(ctx context.Context, request SaveRequest) (Object, error)
	Open(ctx context.Context, key string) (ReadSeekCloser, error)
	Delete(ctx context.Context, key string) error
	Exists(ctx context.Context, key string) (bool, error)
	GetMetadata(ctx context.Context, key string) (Metadata, error)
}
