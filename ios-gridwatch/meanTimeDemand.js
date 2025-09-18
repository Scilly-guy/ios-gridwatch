import { demandData as data } from "./removedLockDownData.js";
import * as fs from "fs";

function referenceDay(time=Date.now()){
    return new Date(`1 jan 2020 ${new Date(time).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}`)
}

function mean(array) {
    const sum = array.reduce((acc, val) => acc + val, 0);
    return array.length === 0 ? NaN : sum / array.length;
  }

const meanTimeDemand={}
data.forEach(d=>{
    const reference=referenceDay(d.x).valueOf().toString()
    if(meanTimeDemand[reference])meanTimeDemand[reference].push(d.y)
        else meanTimeDemand[reference]=[d.y]
})

const referencedData=[]
const keys=Object.keys(meanTimeDemand)
keys.forEach(k=>{
    referencedData.push({x:parseInt(k),y:mean(meanTimeDemand[k])})
})

const jsonString = JSON.stringify(referencedData, null, 2); // `null, 2` makes it pretty-printed

// Write to file
fs.writeFile('averageDay.js', jsonString, (err) => {
  if (err) {
    console.error('Error writing file:', err);
  } else {
    console.log('Successfully wrote to averageDay.js');
  }
});
