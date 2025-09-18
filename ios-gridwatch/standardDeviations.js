import { demandData as data } from "./removedLockDownData.js";
import { std } from "mathjs"
import * as fs from "fs";

function referenceDay(time=Date.now()){
    return new Date(`1 jan 2020 ${new Date(time).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}`)
}

function calc_std(array) {
    const sum = array.reduce((acc, val) => acc + val, 0);
    const mean= array.length === 0 ? NaN : sum / array.length;
    if(mean===NaN) return NaN
    const standardDeviation=std(array)
    return {u2:mean+2*standardDeviation,l2:mean-2*standardDeviation}
  }

const meanTimeDemand={}
data.forEach(d=>{
    if(d.y>0.2){
        const reference=referenceDay(d.x).valueOf().toString()
        if(meanTimeDemand[reference])meanTimeDemand[reference].push(d.y)
            else meanTimeDemand[reference]=[d.y]
    }
})

const lowestDemand=[]
const highestDemand=[]
const keys=Object.keys(meanTimeDemand)
keys.forEach(k=>{
    lowestDemand.push({x:parseInt(k),y:calc_std(meanTimeDemand[k]).l2})
    highestDemand.push({x:parseInt(k),y:calc_std(meanTimeDemand[k]).u2})
})
lowestDemand.sort((a,b)=>a.x-b.x)
highestDemand.sort((a,b)=>a.x-b.x)
const jsonString1 = JSON.stringify(lowestDemand, null, 2); // `null, 2` makes it pretty-printed
const jsonString2 = JSON.stringify(highestDemand, null, 2); // `null, 2` makes it pretty-printed

// Write to file
fs.writeFile('twoSTDsAbove.js', jsonString1, (err) => {
  if (err) {
    console.error('Error writing file:', err);
  } else {
    console.log('Successfully wrote to twoSTDsAbove.js');
  }
});
// Write to file
fs.writeFile('2STDsBelow.js', jsonString2, (err) => {
  if (err) {
    console.error('Error writing file:', err);
  } else {
    console.log('Successfully wrote to 2STDsBelow.js');
  }
});
