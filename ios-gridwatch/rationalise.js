import { demand_data } from "./src/demand_data.js";
import * as fs from "fs"

const data=demand_data.map(d=>{
  return {x:new Date(d.Date+" "+d.Time).valueOf(),y:d.Demand}
})

// Convert to JSON string
const jsonString = JSON.stringify(data, null, 2); // `null, 2` makes it pretty-printed

// Write to file
fs.writeFile('output.json', jsonString, (err) => {
  if (err) {
    console.error('Error writing file:', err);
  } else {
    console.log('Successfully wrote to output.json');
  }
});