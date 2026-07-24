package security

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"dukcapil-pbd-be/internal/model"
)

type Manager struct {
	secret []byte
	ttl    time.Duration
}

type Claims struct {
	UserID        int64                 `json:"userId"`
	Username      string                `json:"username"`
	Name          string                `json:"name"`
	Role          model.Role            `json:"role"`
	SystemAccess  []string              `json:"systemAccess"`
	RegionScope   model.UserRegionScope `json:"regionScope"`
	TahunAnggaran string                `json:"tahunAnggaran"`
	IssuedAt      int64                 `json:"iat"`
	ExpiresAt     int64                 `json:"exp"`
}

func NewManager(secret string, ttl time.Duration) *Manager {
	if strings.TrimSpace(secret) == "" {
		secret = "dev-secret-change-me"
	}

	return &Manager{
		secret: []byte(secret),
		ttl:    ttl,
	}
}

func (m *Manager) Issue(user model.User, tahunAnggaran string) (string, error) {
	now := time.Now()
	header := map[string]string{
		"alg": "HS256",
		"typ": "JWT",
	}
	claims := Claims{
		UserID:        user.ID,
		Username:      user.Username,
		Name:          user.Name,
		Role:          user.Role,
		SystemAccess:  user.SystemAccess,
		RegionScope:   user.RegionScope,
		TahunAnggaran: tahunAnggaran,
		IssuedAt:      now.Unix(),
		ExpiresAt:     now.Add(m.ttl).Unix(),
	}

	headerPayload, err := encodeSegment(header)
	if err != nil {
		return "", err
	}
	claimsPayload, err := encodeSegment(claims)
	if err != nil {
		return "", err
	}

	unsigned := headerPayload + "." + claimsPayload
	signature := sign(unsigned, m.secret)
	return unsigned + "." + signature, nil
}

func (m *Manager) Verify(token string) (Claims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return Claims{}, errors.New("invalid token")
	}

	unsigned := parts[0] + "." + parts[1]
	expected := sign(unsigned, m.secret)
	if !hmac.Equal([]byte(expected), []byte(parts[2])) {
		return Claims{}, errors.New("invalid token signature")
	}

	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return Claims{}, fmt.Errorf("decode claims: %w", err)
	}

	var claims Claims
	if err := json.Unmarshal(payload, &claims); err != nil {
		return Claims{}, fmt.Errorf("parse claims: %w", err)
	}
	if claims.ExpiresAt < time.Now().Unix() {
		return Claims{}, errors.New("token expired")
	}

	return claims, nil
}

func encodeSegment(value any) (string, error) {
	payload, err := json.Marshal(value)
	if err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(payload), nil
}

func sign(unsigned string, secret []byte) string {
	hash := hmac.New(sha256.New, secret)
	hash.Write([]byte(unsigned))
	return base64.RawURLEncoding.EncodeToString(hash.Sum(nil))
}
