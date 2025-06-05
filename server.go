package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	e := echo.New()

	e.Use(middleware.Recover())
	e.Static("/imgs", "ios-gridwatch/public/imgs")
	e.Static("/assets", "ios-gridwatch/dist/assets")
	e.Static("/", "ios-gridwatch/src/")
	e.File("/", "ios-gridwatch/dist/index.html")
	e.File("/dev.html", "ios-gridwatch/index.html")

	e.GET("/sse", func(c echo.Context) error {
		log.Printf("SSE client connected, ip:%v", c.RealIP())
		w := c.Response()
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		ticker := time.NewTicker(1 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-c.Request().Context().Done():
				log.Printf("SSE client disconnected, ip:%v", c.RealIP())
				return nil
			case <-ticker.C:
				solar_data, err := get_solar_data()
				if err != nil {
					log.Print("Error:", err)
					return nil
				}
				data, jsonErr := json.Marshal(solar_data)
				if jsonErr != nil {
					log.Print("Error:", jsonErr)
					return nil
				}
				event := Event{
					Data: []byte(data),
				}
				if err := event.MarshalTo(w); err != nil {
					return err
				}
				w.Flush()
			}
		}
	})

	e.GET("/site/:site/:period", func(c echo.Context) error {
		siteName := c.Param("site")
		period, err := strconv.ParseInt(c.Param("period"), 10, 64)
		if err != nil {
			log.Print("Error: ", err)
			return c.JSON(http.StatusBadRequest, map[string]string{"message": "bad period"})
		}
		w := c.Response()
		w.Header().Set("Access-Control-Allow-Origin", "*")
		site_data, err := FetchSitePeriodData(siteName, int(period))
		if err != nil {
			log.Print("Error: ", err)
			return c.JSON(http.StatusBadGateway, map[string]string{"message": "bad query"})
		}

		return c.JSON(http.StatusOK, site_data)
	})

	e.Logger.Fatal(e.Start("0.0.0.0:1323"))
}
