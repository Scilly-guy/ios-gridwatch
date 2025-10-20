package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	port_env := os.Getenv("GRIDWATCH_PORT")
	if port_env == "" {
		port_env = "1323"
	}
	port := flag.String("port", port_env, "Port to run on")

	host_env := os.Getenv("GRIDWATCH_HOST")
	if host_env == "" {
		host_env = "localhost"
	}
	host := flag.String("host", host_env, "Host to listen on")
	flag.Parse()

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
		w.Header().Set("Access-Control-Allow-Origin", *host)

		send := func() error {
			solarData, err := get_solar_data()
			if err != nil {
				log.Print("Error:", err)
				return err
			}
			data, jsonErr := json.Marshal(solarData)
			if jsonErr != nil {
				log.Print("Error:", jsonErr)
				return jsonErr
			}
			event := Event{
				Data: []byte(data),
			}
			if err := event.MarshalTo(w); err != nil {
				return err
			}
			w.Flush()
			return nil
		}

		// send initial event
		if err := send(); err != nil {
			return nil
		}

		ticker := time.NewTicker(60 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-c.Request().Context().Done():
				log.Printf("SSE client disconnected, ip:%v", c.RealIP())
				return nil
			case <-ticker.C:
				if err := send(); err != nil {
					return nil
				}
			}
		}
	})

	var validSite = regexp.MustCompile(`^[a-zA-Z0-9_+-]+$`)

	e.GET("/site/:site/:period", func(c echo.Context) error {
		siteName := c.Param("site")
		if !validSite.MatchString(siteName) {
			log.Print("Error: Bad Route")
			return c.JSON(http.StatusBadRequest, map[string]string{"message": "bad route"})
		}
		period, err := strconv.ParseInt(c.Param("period"), 10, 64)
		w := c.Response()
		//FIXME:CORS
		w.Header().Set("Access-Control-Allow-Origin", "*")

		if err != nil {
			log.Print("Error: ", err)
			return c.JSON(http.StatusBadRequest, map[string]string{"message": "bad period"})
		}

		if siteName == "all" {
			site_data, err := FetchPeriodData(int(period))
			if err != nil {
				log.Print("Error: ", err)
				return c.JSON(http.StatusBadGateway, map[string]string{"message": "bad query"})
			}

			return c.JSON(http.StatusOK, site_data)
		} else {
			site_data, err := FetchSitePeriodData(siteName, int(period))
			if err != nil {
				log.Print("Error: ", err)
				return c.JSON(http.StatusBadGateway, map[string]string{"message": "bad query"})
			}

			return c.JSON(http.StatusOK, site_data)
		}
	})

	e.GET("/site/all", func(c echo.Context) error {
		w := c.Response()
		//FIXME:CORS
		w.Header().Set("Access-Control-Allow-Origin", "*")

		site_data, err := FetchTodaysGenerationData()
		if err != nil {
			log.Print("Error: ", err)
			return c.JSON(http.StatusBadGateway, map[string]string{"message": "bad query"})
		}

		return c.JSON(http.StatusOK, site_data)
	})

	listen_on := fmt.Sprintf("%s:%s", *host, *port)
	e.Logger.Fatal(e.Start(listen_on))
}
