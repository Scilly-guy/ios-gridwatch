import { demandData } from "./src/demandData.js";
import * as fs from "fs"
const lockDownStart=new Date("23 March 2020").valueOf()
const lockDownEnd=new Date("4 July 2020").valueOf()

const data=demandData.filter(d=>d.x<lockDownStart || d.x>lockDownEnd )

// Convert to JSON string
const jsonString = JSON.stringify(data, null, 2); // `null, 2` makes it pretty-printed

// Write to file
fs.writeFile('removedLockDownData.json', jsonString, (err) => {
  if (err) {
    console.error('Error writing file:', err);
  } else {
    console.log('Successfully wrote to removedLockDownData.json');
  }
});