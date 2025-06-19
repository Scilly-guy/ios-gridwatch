import { LineChart, FixedScaleAxis } from "chartist"
import {data} from "./data"
let liveData={}
const total=document.getElementById("total")
const daily=document.getElementById("daily")
const week=document.getElementById("week")
const year=document.getElementById("year")
const current=document.getElementById("current")
const site_names=[]
const siteName=document.getElementById("siteName")
const bestProduction=document.getElementById("bestProduction")
const rank=document.querySelector("#rank table tbody")
const meterReading=document.getElementById("meterReading")
const currentProduction=document.getElementById("currentProduction")
const generationInPeriod=document.getElementById("generationInPeriod")
const siteDialog=document.getElementById("siteOverview")
const scrollButtonDialogLeft=document.getElementById("scroll-left")
const scrollButtonDialogRight=document.getElementById("scroll-right")
const sites_carousel=document.getElementById("sites")
const glide_carousel=document.querySelector(".glide")
const config_carousel={
    type:"carousel",
    focusAt:"center",
    perView:3
}
const scale=document.getElementById("scale")
const scale_value=document.getElementById("scale_value")
const sortingOptions=document.querySelectorAll("[name=sort]")
const averagedDataTransition=referenceDay().valueOf()
const combinedSolarData=[]
drawAverageChart()

function drawAverageChart(){
    return new LineChart(
    '#demandGraph',{
        series:[{
            name: 'average demand',
            data: data
          },
          {
            name:'pageLoad',
            data:[{x:averagedDataTransition,y:3},
            {x:averagedDataTransition+100,y:0}]
          },
          {
            name:'now',
            data:[{x:referenceDay(),y:3},
            {x:referenceDay().valueOf()+100,y:0}]
          },
          {
            name:'combined solar generation',
            data:combinedSolarData.map(d=>{return {x:d.x,y:d.y*scale.value}})
          }
        ]
      },
      {
        axisX: {
          type: FixedScaleAxis,
          divisor: 12,
          labelInterpolationFnc: value =>
            new Date(value).toLocaleString(undefined, 
                {hour:'numeric',
                minute:'numeric'})
        },
        axisY:{
            labelInterpolationFnc: value=>`${value} MW`
        }
      }
    );
}

const time=document.getElementById("time")
const averageDemand=document.getElementById("averageDemand")
const percentOfDemand=document.getElementById("percentOfDemand")

function updateDemand(currentGeneration){
    time.textContent=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})
    const averageMW=demandAtTime(Date.now())
    averageDemand.textContent=formatWatts(averageMW*1000000)
    percentOfDemand.textContent=(currentGeneration/(averageMW*10)).toFixed(2)//averageMW * 10 = averageMW * 1000 / 100 = average_kW / 100 = 1%
    drawAverageChart()
}

function updateAggregated(){
    total.textContent=formatWatts(liveData["total_kwh"]*1000,true)
    current.textContent=formatWatts(liveData["current_w"])
    daily.textContent=formatWatts(liveData["day_kwh"]*1000,true)
    week.textContent=formatWatts(liveData["week_kwh"]*1000,true)
    year.textContent=formatWatts(liveData["year_kwh"]*1000,true)
}

function updateTable(){
    const selected = document.querySelector('input[name="sort"]:checked');
    let option="generation"
    if (selected) {
        option=selected.value
    }
    switch(option){
        case "generation":
            liveData.sites.sort((a,b)=>b.snapshot-a.snapshot)
            break;
        case "meter":
            liveData.sites.sort((a,b)=>b.today-a.today)
            break;
        case "max":
            liveData.sites.sort((a,b)=>b.max_percent-a.max_percent)
            break;
        default:
            liveData.sites.sort((a,b)=>b.snapshot-a.snapshot)
            break;
    }
    while(rank.firstChild){
        rank.firstChild.remove()
    }
    liveData.sites.forEach((site,i)=>{
        rank.append(createSiteRow(i+1,site))
    })
}

document.addEventListener("DOMContentLoaded",()=>{
    const eventSource=new EventSource("/sse")
    eventSource.addEventListener("message",(e)=>{

        liveData=JSON.parse(e.data);
        if(liveData.sites && liveData.sites.length){
            liveData.sites.forEach((site)=>{
                site.max_percent=site.snapshot/site.max*100
            })
        }
        updateTable();
        updateAggregated();
        updateDemand(parseFloat(liveData["current_w"])/1000)
        if(sites_carousel.firstElementChild){//if not first message
            liveData.sites.forEach((site,i) => {
                const spacelessName=site.name.replaceAll(" ","")
                sites_carousel.querySelectorAll(`.${spacelessName}-snapshot`).forEach(span=>{
                    span.textContent=formatWatts(site.snapshot)
                })
            });
            combinedSolarData.push({
                x:referenceDay(),
                y:liveData["current_w"]/1000000,
            })
        }
        else{ //if first message
            const sortedSites=liveData['sites'].sort((a,b)=>b.snapshot-a.snapshot)
            sortedSites.forEach((site,i) => {
                site_names.push(site.name)
                sites_carousel.append(createSiteCard(site))
                addBullet(glide_carousel)
            });
            new Glide('.glide',config_carousel).mount()
            const cards=document.querySelectorAll('.site-card').forEach(e=>{
                e.addEventListener('click',handleCardClick)
            })
        }

    })
    window.addEventListener("beforeunload",()=>{
        eventSource.close()
    })
})


document.querySelectorAll('.periodSelector').forEach((s)=>{
    s.addEventListener('click',handlePeriodSelection)
})

scale_value.textContent=scale.value
scale.addEventListener("input",()=>{
    scale_value.textContent=scale.value
    drawAverageChart()
})

sortingOptions.forEach(e=>{
    e.addEventListener("click",()=>{
        updateTable()
    })
})

function createSiteRow(rank,siteData){
    const row=document.createElement('tr')
    const rankCell=document.createElement('td')
    const nameCell=document.createElement('td')
    const generationCell=document.createElement('td')
    const meterCell=document.createElement('td')
    const maxPercentCell=document.createElement('td')
    rankCell.textContent=rank
    nameCell.textContent=siteData.name
    generationCell.textContent=formatWatts(siteData.snapshot)
    meterCell.textContent=formatWatts(siteData.today*1000,true)
    maxPercentCell.textContent=siteData.max_percent.toFixed(2)+"%"
    row.append(rankCell,nameCell,generationCell,meterCell,maxPercentCell)
    return row
}

function createSiteCard(siteData){
    const li=document.createElement('li')
    li.classList.add("site-card","glide__slide")
    const img=document.createElement('img')
    const name=document.createElement('span')
    name.classList.add('name')
    const obj=document.createElement('object')
    obj.setAttribute("data",`/imgs/${siteData.name}.png`)
    obj.type="image/png"
    img.src="/imgs/RoofTop.png"
    name.textContent=siteData.name
    name.setAttributeNS(null,'data-name',siteData.name)
    const span=document.createElement('span')
    span.classList.add("generation-total")
    const spacelessName=siteData.name.replaceAll(" ","")
    span.classList.add(`${spacelessName}-snapshot`)
    span.textContent=formatWatts(siteData.snapshot)
    obj.append(img)
    li.append(obj,name,span)
    return li
}

function handleCardClick(e){
    const period=document.querySelector('[name="period"]:checked').value
    const selectedSite=e.currentTarget.querySelector('.name').textContent
    fetchPeriodData(selectedSite,period)
}

function addBullet(glide_el){
    const bullets=glide_el.querySelector(".glide__bullets")
    const current_number=bullets.children.length
    const button=document.createElement("button")
    button.classList.add("glide__bullet")
    button.setAttributeNS(null,"data-glide-dir",`=${current_number}`)
    bullets.append(button)
}

function handlePeriodSelection(e){
    const period=e.currentTarget.parentNode.querySelector("[name='period'").value
    const site=siteName.textContent
    fetchPeriodData(site,period)
}

function fetchPeriodData(site,period){
    //set labeling for chart according to length of the period
    let localeString={}
    if(period<=1){
        localeString.hour='numeric'
        localeString.minute='numeric'
        localeString.weekday='short'
    }else if(period<=7){
        localeString.weekday='short'
        localeString.day='numeric'
    }else{
        localeString.day='numeric'
        localeString.month='short'
    }
    let selectedSite=site.replaceAll(' ','+')
    const address=`/site/${selectedSite}/${period}`
    fetch(address).then((res)=>{
        res.json().then((data2)=>{
            siteName.textContent=data2.name
            meterReading.textContent=formatWatts(data2.meter,true)
            currentProduction.textContent=formatWatts(data2.current)
            generationInPeriod.textContent=formatWatts(data2.generation_in_period,true)
            bestProduction.textContent=formatWatts(data2.max)
            const chartData=data2.data.map((d)=>{
                return {x:new Date(d[0]*1000),y:d[1]}
            })
            siteDialog.showModal()
            new LineChart(
                '#siteChart',{
                    series:[{
                        name: 'solar generation',
                        data: chartData
                      }
                    ]
                  },
                  {
                    axisX: {
                      type: FixedScaleAxis,
                      divisor: 5,
                      labelInterpolationFnc: value =>
                        new Date(value).toLocaleString(undefined, localeString)
                    }
                  }
                );

            /*setTimeout(()=>{
            document.querySelectorAll('.ct-line').forEach(ct_line=>{
                ct_line.classList.add("chart-line");
                ct_line.classList.remove('ct-line')
            })
            document.querySelectorAll('.ct-point').forEach(ct_point=>{
                ct_point.classList.add("chart-point");
                ct_point.classList.remove('ct-point')
            })
            },5)*/
        })
    })
}

function fetchCombinedSolarData(){
    fetch("/site/all").then((res)=>{
        res.json().then((data3)=>{
            combinedSolarData.push(...data3.values.map(r=>{
                return{
                    x:referenceDay(r[0]*1000).valueOf()-(15*60*1000),//Prometheus uses seconds so convert to milliseconds for js, also move the data point to the middle of the time period it represents
                    y:parseFloat(r[1]/1000000)//the supplied value is in watts, convert to MW for the graph
                }
            }))
            //most recent point should not be 15 minutes less
            combinedSolarData[combinedSolarData.length-1].x+=(15*60*1000)
            //most recent point should be halfway between now and 15 minutes after the one before
            const zero=combinedSolarData[combinedSolarData.length-2].x+(15*60*1000)
            const lastAveragedPoint=zero+(referenceDay().valueOf()-zero)/2
            combinedSolarData[combinedSolarData.length-1].x=lastAveragedPoint
            drawAverageChart()
        })
    })
}
fetchCombinedSolarData()

scrollButtonDialogLeft.addEventListener('click',(e)=>{
    const period=e.currentTarget.parentNode.parentNode.querySelector("[name='period']:checked").value
    const currentSiteName=siteName.textContent
    const currentIndex=site_names.indexOf(currentSiteName)
    const newIndex=currentIndex-1>=0?currentIndex-1:currentIndex-1+site_names.length;
    const newSite=site_names[newIndex]
    fetchPeriodData(newSite,period)
})
scrollButtonDialogRight.addEventListener('click',(e)=>{
    const period=e.currentTarget.parentNode.parentNode.querySelector("[name='period']:checked").value
    const currentSiteName=siteName.textContent
    const currentIndex=site_names.indexOf(currentSiteName)
    const newIndex=currentIndex+1>=site_names.length?0:currentIndex+1;
    const newSite=site_names[newIndex]
    fetchPeriodData(newSite,period)
})

function demandAtTime(pointInTime){
    const referenceTime=referenceDay(pointInTime)
    let index=0
    while(index<data.length && referenceTime.valueOf()>new Date(data[index].x).valueOf()){
        index++
    }
    if (index==0){//the time is 00:00
        return data[index].y
    }
    const y1=data[index-1].y
    const y2=data[index].y
    const mins=referenceTime.getMinutes()
    const xd=mins<30?mins:mins-30
    const changePerMinute=(y2-y1)/30
    return y1+xd*changePerMinute //linear interpolation
}

function referenceDay(time=Date.now()){
    return new Date(`1 jan 2020 ${new Date(time).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}`)
}

function formatWatts(watts,wattHour=false) {
    const units = ['W', 'kW', 'MW', 'GW'];
    let index = 0;
    let value = watts;
  
    while (value >= 1000 && index < units.length - 1) {
      value /= 1000;
      index++;
    }
  
    return `${value.toFixed(2)} ${units[index]}${wattHour?'h':''}`;
  }




