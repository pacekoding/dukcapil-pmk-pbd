package controller

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo"
)

type responseEnvelope struct {
	Data any `json:"data"`
}

func jsonData(c echo.Context, status int, data any) error {
	return c.JSON(status, responseEnvelope{Data: data})
}

func paramInt64(c echo.Context, name string) (int64, error) {
	value, err := strconv.ParseInt(c.Param(name), 10, 64)
	if err != nil {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "parameter "+name+" tidak valid")
	}
	return value, nil
}
