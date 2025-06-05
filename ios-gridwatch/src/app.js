import { LineChart, FixedScaleAxis } from "chartist"
import {data} from "./data"
const total=document.getElementById("total")
const daily=document.getElementById("daily")
const week=document.getElementById("week")
const year=document.getElementById("year")
const current=document.getElementById("current")
const site_names=[]
const siteName=document.getElementById("siteName")
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

const time=document.getElementById("time")
const averageDemand=document.getElementById("averageDemand")
const percentOfDemand=document.getElementById("percentOfDemand")
let updater
function updateDemand(currentGeneration){
    time.textContent=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})
    const averageMW=demandAtTime(Date.now())
    averageDemand.textContent=averageMW.toFixed(2)
    percentOfDemand.textContent=(currentGeneration/(averageMW*10)).toFixed(2)
}
const eventSource=new EventSource("http://192.168.1.95:1323/sse")
eventSource.addEventListener("message",(e)=>{

    const data1=JSON.parse(e.data);
    total.textContent=`${data1["total_kwh"].toFixed(2)}kWh`
    current.textContent=`${data1["current_w"].toFixed(2)}w`
    daily.textContent=`${data1["day_kwh"].toFixed(2)}kWh`
    week.textContent=`${data1["week_kwh"].toFixed(2)}kWh`
    year.textContent=`${data1["year_kwh"].toFixed(2)}kWh`
    if(sites_carousel.firstElementChild){//if !pageload
        while(rank.firstChild){
            rank.firstChild.remove()
        }
        const sortedSites=data1['sites'].sort((a,b)=>b.snapshot-a.snapshot)
        sortedSites.forEach((site,i) => {
            const spacelessName=site.name.replaceAll(" ","")
            sites_carousel.querySelectorAll(`.${spacelessName}-snapshot`).forEach(span=>{
                span.textContent=`${(site.snapshot/1000).toFixed(2)}kw`
            })
            rank.append(createSiteRow(i+1,site));
        });
    }
    else{ //if pageload
        const sortedSites=data1['sites'].sort((a,b)=>b.snapshot-a.snapshot)
        sortedSites.forEach((site,i) => {
            site_names.push(site.name)
            sites_carousel.append(createSiteCard(site))
            addBullet(glide_carousel)
            rank.append(createSiteRow(i+1,site))
        });
        new Glide('.glide',config_carousel).mount()
        const cards=document.querySelectorAll('.site-card').forEach(e=>{
            e.addEventListener('click',handleCardClick)
        })
        updateDemand(parseFloat(data1["current_w"])/1000)
        updater=setInterval(()=>{updateDemand(parseFloat(data1["current_w"])/1000)},15000)
    }

})

document.querySelectorAll('.periodSelector').forEach((s)=>{
    s.addEventListener('click',handlePeriodSelection)
})

function createSiteRow(rank,siteData){
    const row=document.createElement('tr')
    const rankCell=document.createElement('td')
    const nameCell=document.createElement('td')
    const generationCell=document.createElement('td')
    rankCell.textContent=rank
    nameCell.textContent=siteData.name
    generationCell.textContent=`${(siteData.snapshot/1000).toFixed(2)}kw`
    row.append(rankCell,nameCell,generationCell)
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
    span.textContent=`${(siteData.snapshot/1000).toFixed(2)}kw`
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
            meterReading.textContent=data2.meter.toFixed(2)
            currentProduction.textContent=data2.current.toFixed(0)
            generationInPeriod.textContent=data2.generation_in_period.toFixed(2)
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
    const dateInTime=new Date(pointInTime)
    const timeFromPoint=`${dateInTime.getHours()}:${dateInTime.getMinutes()}`
    const timeOnReferenceDay=new Date(`1 jan 2020 ${timeFromPoint}`)
    let index=0
    while(index<data.length && timeOnReferenceDay.valueOf()>new Date(data[index].x).valueOf()){
        index++
    }
    if (index==0){//the time is 00:00
        return data[index].y
    }
    const y1=data[index-1].y
    const y2=data[index].y
    const xd=dateInTime.getMinutes()<30?dateInTime.getMinutes():dateInTime.getMinutes()-30
    const changePerMinute=(y2-y1)/30
    return y1+xd*changePerMinute
}

console.log(demandAtTime(Date.now()))

new LineChart(
    '#demandGraph',{
        series:[{
            name: 'average demand',
            data: data.map(d=>{return{x:new Date(d.x).valueOf(),y:d.y}})
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
        }
      }
    );


