package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

const prometheusURL = "http://localhost:9090/api/v1/query"

type SolarData struct {
	Total_kwh float32    `json:"total_kwh"`
	Day_kwh   float32    `json:"day_kwh"`
	Week_kwh  float32    `json:"week_kwh"`
	Year_kwh  float32    `json:"year_kwh"`
	Current_w float32    `json:"current_w"`
	Sites     []SiteData `json:"sites"`
}

type SiteData struct {
	Name     string  `json:"name"`
	Snapshot float64 `json:"snapshot"`
	Today    float64 `json:"today"`
	Week     float64 `json:"week"`
	Last_365 float64 `json:"year"`
}

func get_solar_data() (SolarData, error) {
	var sites []SiteData
	now := time.Now()
	//year, month, day := now.Date()
	//location := now.Location()
	//midnight := time.Date(year, month, day, 0, 0, 0, 0, location)
	//week := midnight.Add(-7 * 24 * time.Hour)
	//one_year_ago := time.Date(year-1, month, day, 0, 0, 0, 0, location)
	//timeFormat := "2006-01-02T15:04:05Z"
	seconds_since_midnight_int := now.Hour()*3600 + now.Minute()*60 + now.Second()
	//seconds_since_last_week_int := 7 * 24 * 60 * 60
	seconds_since_midnight := strconv.FormatInt(int64(seconds_since_midnight_int), 10) + "s"
	//seconds_since_last_week := strconv.FormatInt(int64(seconds_since_last_week_int), 10) + "s"

	//get daily statistics
	increase_day, err := fetchPrometheusIncrease("solar_generation_meter", seconds_since_midnight)
	if err != nil {
		log.Printf("Error fetching old meter readings: %v\n", err)
		return SolarData{}, err
	}
	var day_total float64

	for _, site := range increase_day {
		if len(sites) == 0 {
			sites = append(sites, SiteData{Name: site.Metric.Site, Today: site.GetValue()})
			day_total += site.GetValue()
		} else {
			for i := range sites {
				if sites[i].Name == site.Metric.Site {
					sites[i].Today = site.GetValue()
					day_total += site.GetValue()
					break
				} else if i == len(sites)-1 {
					sites = append(sites, SiteData{Name: site.Metric.Site, Today: site.GetValue()})
					day_total += site.GetValue()
				}
			}
		}
	}

	//get weekly stistics
	increase_week, err := fetchPrometheusIncrease("solar_generation_meter", "7d")
	if err != nil {
		log.Printf("Error fetching old meter readings: %v\n", err)
		return SolarData{}, err
	}
	var week_total float64

	for _, site := range increase_week {
		for i := range sites {
			if sites[i].Name == site.Metric.Site {
				sites[i].Week = site.GetValue()
				week_total += site.GetValue()
				break
			} else if i == len(sites)-1 {
				sites = append(sites, SiteData{Name: site.Metric.Site, Week: site.GetValue()})
				week_total += site.GetValue()
			}
		}
	}

	//get statistics for the last year
	increase_year, err := fetchPrometheusIncrease("solar_generation_meter", "365d")
	if err != nil {
		log.Printf("Error fetching old meter readings: %v\n", err)
		return SolarData{}, err
	}
	var year_total float64

	for _, site := range increase_year {
		for i := range sites {
			if sites[i].Name == site.Metric.Site {
				sites[i].Last_365 = site.GetValue()
				year_total += site.GetValue()
				break
			} else if i == len(sites)-1 {
				sites = append(sites, SiteData{Name: site.Metric.Site, Last_365: site.GetValue()})
				year_total += site.GetValue()
			}
		}
	}

	//get snapshot statistics
	latest_data, err := fetchPrometheusSnapshotData("solar_watts", "")
	if err != nil {
		log.Printf("Error fetching current output: %v\n", err)
		return SolarData{}, err
	}
	latest_total_watts := 0.0
	for _, site := range latest_data {
		site_watts, _ := strconv.ParseFloat(site.Value[1].(string), 64)
		latest_total_watts += site_watts
	}

	for _, site := range latest_data {
		for i := range sites {
			if sites[i].Name == site.Metric.Site {
				sites[i].Snapshot = site.GetValue()
				latest_total_watts += sites[i].Snapshot
				break
			} else if i == len(sites)-1 {
				site_watts, _ := strconv.ParseFloat(site.Value[1].(string), 64)
				sites = append(sites, SiteData{Name: site.Metric.Site, Snapshot: site_watts})
				latest_total_watts += site_watts
			}
		}
	}

	//all time data
	all_time_data, err := fetchPrometheusVectorQuery("sum(solar_generation_meter)")
	if err != nil {
		log.Printf("Error fetching current output: %v\n", err)
		return SolarData{}, err
	}

	return SolarData{
		Total_kwh: float32(all_time_data.GetValue()),
		Week_kwh:  float32(week_total),
		Day_kwh:   float32(day_total),
		Year_kwh:  float32(year_total),
		Current_w: float32(latest_total_watts),
		Sites:     sites}, nil
}

type PrometheusSnapshotResponse struct {
	Data struct {
		Result []PrometheusSnapshotData `json:"result"`
	} `json:"data"`
}

type PrometheusVectorResponse struct {
	Data struct {
		Result []PrometheusVectorData `json:"result"`
	} `json:"data"`
}

type PrometheusSnapshotData struct {
	Metric struct {
		Name string `json:"__name__"`
		Site string `json:"site"`
	} `json:"metric"`
	Value []interface{} `json:"value"`
}

type PrometheusVectorData struct {
	Value []interface{} `json:"value"`
}

func (p PrometheusSnapshotData) GetValue() float64 {
	value, _ := strconv.ParseFloat(p.Value[1].(string), 64)
	return value
}
func (p PrometheusVectorData) GetValue() float64 {
	value, _ := strconv.ParseFloat(p.Value[1].(string), 64)
	return value
}

type PrometheusRangeResponse struct {
	Data struct {
		Result []PrometheusRangeData `json:"result"`
	} `json:"data"`
}

type PrometheusRangeData struct {
	Metric struct {
		Name string `json:"__name__"`
		Site string `json:"site"`
	} `json:"metric"`
	Values [][]interface{} `json:"values"`
}

func (p PrometheusRangeData) GetValues() (return_values []float64) {
	for _, value := range p.Values {
		v, _ := strconv.ParseFloat(value[1].(string), 64)
		return_values = append(return_values, v)
	}
	return return_values
}

func fetchPrometheusSnapshotData(metric string, age string) ([]PrometheusSnapshotData, error) {
	var url string
	if age != "" {
		url = fmt.Sprintf("%s?query=%s&offset=%s]", prometheusURL, metric, age)
	} else {
		url = fmt.Sprintf("%s?query=%s", prometheusURL, metric)
	}
	resp, err := http.Get(url)
	if err != nil {
		return []PrometheusSnapshotData{}, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return []PrometheusSnapshotData{}, err
	}
	var promResp PrometheusSnapshotResponse
	err = json.Unmarshal(body, &promResp)
	if err != nil {
		return []PrometheusSnapshotData{}, err
	}
	return promResp.Data.Result, nil
}

func fetchPrometheusQuery(query string) ([]PrometheusSnapshotData, error) {
	url := fmt.Sprintf("%s?query=%s", prometheusURL, query)
	resp, err := http.Get(url)
	if err != nil {
		return []PrometheusSnapshotData{}, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return []PrometheusSnapshotData{}, err
	}
	var promResp PrometheusSnapshotResponse
	err = json.Unmarshal(body, &promResp)
	if err != nil {
		return []PrometheusSnapshotData{}, err
	}
	return promResp.Data.Result, nil
}

func fetchPrometheusVectorQuery(query string) (PrometheusVectorData, error) {
	url := fmt.Sprintf("%s?query=%s", prometheusURL, query)
	resp, err := http.Get(url)
	if err != nil {
		return PrometheusVectorData{}, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return PrometheusVectorData{}, err
	}
	var promResp PrometheusVectorResponse
	err = json.Unmarshal(body, &promResp)
	if err != nil {
		return PrometheusVectorData{}, err
	}
	if len(promResp.Data.Result) == 0 {
		return PrometheusVectorData{}, errors.New("error with prometheus query")
	}
	return promResp.Data.Result[0], nil
}

func fetchPrometheusIncrease(metric string, period string) ([]PrometheusSnapshotData, error) {
	url := fmt.Sprintf("%s?query=increase(%s[%s])", prometheusURL, metric, period)
	resp, err := http.Get(url)
	if err != nil {
		return []PrometheusSnapshotData{}, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return []PrometheusSnapshotData{}, err
	}
	var promResp PrometheusSnapshotResponse
	err = json.Unmarshal(body, &promResp)
	if err != nil {
		return []PrometheusSnapshotData{}, err
	}
	return promResp.Data.Result, nil
}

func fetchPrometheusDataRange(query, start, end, step string) ([]PrometheusRangeData, error) {
	// Build API request
	url := fmt.Sprintf("%s_range?query=%s&start=%s&end=%s&step=%s", prometheusURL, query, start, end, step)

	// Send HTTP request
	resp, err := http.Get(url)
	if err != nil {
		return []PrometheusRangeData{}, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return []PrometheusRangeData{}, err
	}

	// Parse JSON response
	var promResp PrometheusRangeResponse
	err = json.Unmarshal(body, &promResp)
	if err != nil {
		return []PrometheusRangeData{}, err
	}

	return promResp.Data.Result, nil
}

func fetchPrometheusRangeQuery(query string) ([]PrometheusRangeData, error) {
	url := fmt.Sprintf("%s?query=%s", prometheusURL, query)
	resp, err := http.Get(url)
	if err != nil {
		return []PrometheusRangeData{}, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return []PrometheusRangeData{}, err
	}
	var promResp PrometheusRangeResponse
	err = json.Unmarshal(body, &promResp)
	if err != nil {
		return []PrometheusRangeData{}, err
	}
	return promResp.Data.Result, nil
}

type SitePeriodData struct {
	Name    string          `json:"name"`
	Meter   float64         `json:"meter"`
	Current float64         `json:"current"`
	Period  float64         `json:"generation_in_period"`
	Data    [][]interface{} `json:"data"`
}

func FetchSitePeriodData(site string, numberOfDays int) (sitePeriodData SitePeriodData, err error) {
	var query1, query2, query3, query4 string
	sitePeriodData.Name = strings.ReplaceAll(site, "+", " ")
	if site != "" {
		query1 = fmt.Sprintf("solar_generation_meter{site=\"%s\"}", site)
		query2 = fmt.Sprintf("solar_watts{site=\"%s\"}", site)
		if numberOfDays < 1 {
			numberOfDays = 1
		}
		var resolution string
		switch {
		case numberOfDays <= 1:
			resolution = "1m"
		case numberOfDays <= 7:
			resolution = "15m"
		case numberOfDays <= 31:
			resolution = "30m"
		default:
			resolution = "2h"
		}
		query3 = fmt.Sprintf("solar_watts{site=\"%s\"}[%vd:%s]", site, numberOfDays, resolution)
		query4 = fmt.Sprintf("increase(solar_generation_meter{site=\"%s\"}[%vd])", site, numberOfDays)
	} else {
		return SitePeriodData{}, errors.New("you must include a site name")
	}
	meter, err := fetchPrometheusQuery(query1)
	if err != nil {
		return sitePeriodData, err
	}
	if len(meter) < 1 {
		return sitePeriodData, errors.New("site: " + site + " - not found")
	}
	sitePeriodData.Meter = meter[0].GetValue()

	current_generation, err := fetchPrometheusQuery(query2)
	if err != nil {
		return sitePeriodData, err
	}
	sitePeriodData.Current = current_generation[0].GetValue()

	data, err := fetchPrometheusRangeQuery(query3)
	if err != nil {
		return sitePeriodData, err
	}
	sitePeriodData.Data = data[0].Values

	period_generation, err := fetchPrometheusQuery(query4)
	if err != nil {
		return sitePeriodData, err
	}
	sitePeriodData.Period = period_generation[0].GetValue()

	return
}
