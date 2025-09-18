import { averageDay } from "./src/averageDay.js";
import { averageWinterDay } from "./src/averageWinterDay.js";
import * as fs from "fs"

averageDay.sort((a,b)=>a.x-b.x)
averageWinterDay.sort((a,b)=>a.x-b.x)

// Convert to JSON string
const jsonString1 = JSON.stringify(averageDay, null, 2); // `null, 2` makes it pretty-printed
const jsonString2 = JSON.stringify(averageWinterDay, null, 2); // `null, 2` makes it pretty-printed

// Write to file
fs.writeFile('averageDay.js', jsonString1, (err) => {
  if (err) {
    console.error('Error writing file:', err);
  } else {
    console.log('Successfully wrote to averageDay.js');
  }
});
// Write to file
fs.writeFile('averageWinterDay.js', jsonString2, (err) => {
  if (err) {
    console.error('Error writing file:', err);
  } else {
    console.log('Successfully wrote to averageWinterDay.js');
  }
});