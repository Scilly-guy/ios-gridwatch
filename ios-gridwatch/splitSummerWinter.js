import { demandData } from "./removedLockDownData.js";
import * as fs from "fs"
const summerStart="1 May"
const winterStart="1 Nov"

const summerData=demandData.filter(d=>{
  const year=new Date(d.x).getFullYear()
  const summer=new Date(`${summerStart} ${year} 00:00`).valueOf()
  const winter=new Date(`${winterStart} ${year} 00:00`).valueOf()
  return d.x>=summer && d.x<winter
})

const winterData=demandData.filter(d=>{
  const year=new Date(d.x).getFullYear()
  const summer=new Date(`${summerStart} ${year} 00:00`).valueOf()
  const winter=new Date(`${winterStart} ${year} 00:00`).valueOf()
  return d.x<summer || d.x>=winter
})

// Convert to JSON string
const jsonString1 = JSON.stringify(summerData, null, 2); // `null, 2` makes it pretty-printed
const jsonString2 = JSON.stringify(winterData, null, 2); // `null, 2` makes it pretty-printed

// Write to file
fs.writeFile('summerData.json', jsonString1, (err) => {
  if (err) {
    console.error('Error writing file:', err);
  } else {
    console.log('Successfully wrote to summerData.json');
  }
});
// Write to file
fs.writeFile('winterData.json', jsonString2, (err) => {
  if (err) {
    console.error('Error writing file:', err);
  } else {
    console.log('Successfully wrote to winterData.json');
  }
});