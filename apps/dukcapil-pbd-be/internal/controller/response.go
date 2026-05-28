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

func paramInt(c echo.Context, name string) (int, error) {
	value, err := strconv.Atoi(c.Param(name))
	if err != nil {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "parameter "+name+" tidak valid")
	}
	return value, nil
}
