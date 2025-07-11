import { LineChart, FixedScaleAxis } from "chartist"
import { averageSummerDay } from "./averageSummerDay"
import { averageWinterDay } from "./averageWinterDay"
import { averageDay } from "./averageDay"
import { highestDemand } from "./highestDemand"
import { lowestDemand } from "./lowestDemand"
import { twoSTDsAbove } from "./twoSTDsAbove"
import { twoSTDsBelow } from "./twoSTDsBelow"
import { roundUpToQuarterSignificant } from "./mathematicalFunctions"
import { initDropdown } from "./dropdown"
let liveData={}
const sitePeriodData={}
const total=document.getElementById("total")
const daily=document.getElementById("daily")
const week=document.getElementById("week")
const year=document.getElementById("year")
const current=document.getElementById("current")
const site_names=[]
const bestProduction=document.getElementById("bestProduction")
const rank=document.querySelector("#rank table tbody")
const generationInPeriod=document.getElementById("generationInPeriod")
const siteDialog=document.getElementById("siteOverview")
const closeSiteDialog=document.getElementById("closeSiteOverview")
const scrollButtonDialogLeft=document.getElementById("scroll-left")
const scrollButtonDialogRight=document.getElementById("scroll-right")
const siteSelection=document.getElementById("siteSelection")
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
const demandGraph=document.getElementById("demandGraph")
const legend={
    average:document.getElementById("legend_average"),
    end:document.getElementById("legend_end"),
    now:document.getElementById("legend_now"),
    min:document.getElementById("legend_min"),
    max:document.getElementById("legend_max"),
    summer:document.getElementById("legend_summer"),
    winter:document.getElementById("legend_winter"),
    std:document.getElementById("legend_std"),
    solar:document.getElementById("legend_solar"),
    max_value:{
        average:averageDay.reduce((a,b)=>Math.max(a,b.y),0),
        min:lowestDemand.reduce((a,b)=>Math.max(a,b.y),0),
        max:highestDemand.reduce((a,b)=>Math.max(a,b.y),0),
        summmer:averageSummerDay.reduce((a,b)=>Math.max(a,b.y),0),
        winter:averageWinterDay.reduce((a,b)=>Math.max(a,b.y),0),
        standard_deviation:twoSTDsBelow.reduce((a,b)=>Math.max(a,b.y),0),
    }
}
const averagedDataTransition=referenceDay().valueOf()
const combinedSolarData=[]
drawAverageChart()

function drawAverageChart(){
    legend.max_value.solar=combinedSolarData.reduce((a,b)=>Math.max(a,b.y),0)*scale.value
    const max_value=roundUpToQuarterSignificant(Math.max(
        legend.average.checked?legend.max_value.average:0,
        legend.solar.checked?legend.max_value.solar:0,
        legend.min.checked?legend.max_value.min:0,
        legend.max.checked?legend.max_value.max:0,
        legend.summer.checked?legend.max_value.summmer:0,
        legend.winter.checked?legend.max_value.winter:0,
        legend.std.checked?legend.max_value.standard_deviation:0
    ))
    const noLine=[{x:referenceDay(),y:0},{x:referenceDay().valueOf()+1,y:0}]
    const endLine=[{x:averagedDataTransition,y:max_value},{x:averagedDataTransition+100,y:0}]
    const nowLine=[{x:referenceDay(),y:max_value},{x:referenceDay().valueOf()+100,y:0}]
    const average={name:'Average Day',data:legend.average.checked?averageDay:noLine}
    const end={name:'pageLoad',data:legend.solar.checked&&legend.end.checked?endLine:noLine}
    const now={name:'Now',data:legend.now.checked?nowLine:noLine}
    const summer={name:'Average Summer',data:legend.summer.checked?averageSummerDay:noLine}
    const winter={name:'Average Winter',data:legend.winter.checked?averageWinterDay:noLine}
    const low={name:'Two Standard Deviations Below',data:legend.std.checked?twoSTDsBelow:noLine}
    const high={name:'Two Standard Deviations Above',data:legend.std.checked?twoSTDsAbove:noLine}
    const solar={name:'Solar',data:legend.solar.checked?combinedSolarData.map(d=>{return {x:d.x,y:d.y*scale.value}}):noLine}
    const lowest={name:'Lowest',data:legend.min.checked?lowestDemand:noLine}
    const highest={name:'Average Winter',data:legend.max.checked?highestDemand:noLine}

    demandGraph.graph= new LineChart(
    '#demandGraph',{
        series:[
            average,
            end,
            now,
            solar,
            summer,
            winter,
            lowest,
            highest, 
            high,
            low
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
function drawSiteGraph(){
    const period=document.querySelector('[name="period"]:checked').value
    //set labeling for graph according to length of the period
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

    const noLine=[{x:sitePeriodData[period.toString()][0].data[0][0],y:0},{x:sitePeriodData[period.toString()][0].data[0][0]+1,y:0}]
    const series=[]
    sitePeriodData[period.toString()].forEach(site=>{
        const spacelessName=site.name.replaceAll(" ","")
        if(document.querySelector("#"+spacelessName+"_checkbox").checked){
            series.push(site.data.map((d)=>{return{x:d[0],y:d[1]}}))
        }
        else{
            series.push(noLine)
        }
    })

    console.log(series)
    demandGraph.graph= new LineChart(
    '#siteGraph',{
        series
      },
      {
        axisX: {
          type: FixedScaleAxis,
          divisor: 12,
          labelInterpolationFnc: value =>
            new Date(value).toLocaleString(undefined, localeString)
        },
        axisY:{
            labelInterpolationFnc: value=>`${value}`
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
                siteSelection.append(createSiteSelector(site.name))
                addBullet(glide_carousel)
            });
            new Glide('.glide',config_carousel).mount()
            const cards=document.querySelectorAll('.site-card span.name').forEach(e=>{
                e.addEventListener('click',handleCardClick)
            })
            initDropdown();
            const dropDownOptions=document.querySelectorAll("[name='selectedSites']")
            dropDownOptions.forEach(d=>{
                d.addEventListener("input",handleSiteSelection)
            })
            fetchAllPeriodData(1)
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

document.querySelectorAll("[name=legend]").forEach(e=>{
    e.addEventListener("input",drawAverageChart)
})

function createSiteRow(rank,siteData){
    const row=document.createElement('tr')
    const rankCell=document.createElement('td')
    const nameCell=document.createElement('td')
    const generationCell=document.createElement('td')
    const meterCell=document.createElement('td')
    const maxPercentCell=document.createElement('td')
    rankCell.textContent=rank
    const name=document.createElement('a')
    name.textContent=siteData.name
    name.classList.add("name")
    name.addEventListener("click",handleCardClick)
    nameCell.append(name)
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
    img.src="/imgs/Canopy.svg"
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

function createSiteSelector(siteName){
    const label=document.createElement("label")
    label.textContent=siteName
    label.classList.add("dropdown-option")
    const checkbox=document.createElement("input")
    const spacelessName=siteName.replaceAll(" ","")
    checkbox.id=spacelessName+"_checkbox"
    label.setAttribute("for",spacelessName+"_checkbox")
    checkbox.name="selectedSites"
    checkbox.type="checkbox"
    label.append(checkbox)
    return label
}

function handleSiteSelection(){
    const selectedSites=document.querySelectorAll("[name='selectedSites']:checked")
    let list=''
    selectedSites.forEach((s)=>{list=list+" "+s.parentNode.textContent})
}

function handleCardClick(e){
    const siteName=e.currentTarget.textContent.replaceAll(" ","")
    document.getElementById(siteName+"_checkbox").setAttribute("checked","checked")
    drawSiteGraph()
    siteDialog.show()
}

function addBullet(glide_el){
    const bullets=glide_el.querySelector(".glide__bullets")
    const current_number=bullets.children.length
    const button=document.createElement("button")
    button.classList.add("glide__bullet")
    button.setAttributeNS(null,"data-glide-dir",`=${current_number}`)
    bullets.append(button)
}

function handlePeriodSelection(){
    drawSiteGraph()
}

siteDialog.show=function(){
    siteDialog.classList.remove("display-none")
}
siteDialog.close=function(){
    siteDialog.classList.add("display-none")
}

closeSiteDialog.addEventListener("click",siteDialog.close)

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
            generationInPeriod.textContent=formatWatts(data2.generation_in_period,true)
            bestProduction.textContent=formatWatts(data2.max)
            const chartData=data2.data.map((d)=>{
                return {x:new Date(d[0]*1000),y:d[1]}
            })
            siteDialog.show()
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

const periods=[1,7,31,365]
let periodIndex=0;
function fetchAllPeriodData(period){
    const address=`/site/all/${period}`
    fetch(address).then((res)=>{
        res.json().then((data3)=>{
            data3.forEach(d3=>{
                d3.data.forEach(d=>d[0]*=1000)
            })
            sitePeriodData[period.toString()]=data3
            periodIndex++;
            if(periodIndex<periods.length){
                fetchAllPeriodData(periods[periodIndex])
            }
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

function demandAtTime(pointInTime){
    const referenceTime=referenceDay(pointInTime)
    let index=0
    while(index<averageDay.length && referenceTime.valueOf()>new Date(averageDay[index].x).valueOf()){
        index++
    }
    if (index==0){//the time is 00:00
        return averageDay[index].y
    }
    const y1=averageDay[index-1].y
    const y2=averageDay[index].y
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




