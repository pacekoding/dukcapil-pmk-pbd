package middleware

import (
	"net/http"
	"strings"

	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/security"

	"github.com/labstack/echo"
)

const ClaimsContextKey = "authClaims"

type AuthMiddleware struct {
	tokens *security.Manager
}

func NewAuthMiddleware(tokens *security.Manager) *AuthMiddleware {
	return &AuthMiddleware{tokens: tokens}
}

func (m *AuthMiddleware) RequireRoles(roles ...model.Role) echo.MiddlewareFunc {
	allowedRoles := map[model.Role]bool{}
	for _, role := range roles {
		allowedRoles[role] = true
	}

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			token := bearerToken(c.Request().Header.Get(echo.HeaderAuthorization))
			if token == "" {
				return echo.NewHTTPError(http.StatusUnauthorized, "token login wajib dikirim")
			}

			claims, err := m.tokens.Verify(token)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "token login tidak valid")
			}

			if len(allowedRoles) > 0 && !allowedRoles[claims.Role] {
				return echo.NewHTTPError(http.StatusForbidden, "role tidak memiliki akses")
			}

			c.Set(ClaimsContextKey, claims)
			return next(c)
		}
	}
}

func ClaimsFromContext(c echo.Context) (security.Claims, bool) {
	claims, ok := c.Get(ClaimsContextKey).(security.Claims)
	return claims, ok
}

func bearerToken(header string) string {
	const prefix = "Bearer "
	if !strings.HasPrefix(header, prefix) {
		return ""
	}
	return strings.TrimSpace(strings.TrimPrefix(header, prefix))
}
