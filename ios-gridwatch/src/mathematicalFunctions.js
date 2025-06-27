export function roundUpToQuarterSignificant(num) {
    if (num === 0) return 0;
  
    const absNum = Math.abs(num);
    const order = Math.floor(Math.log10(absNum));
    const factor = Math.pow(10, order);
  
    // Normalize the number to a range like 1–10
    const normalized = absNum / factor;
  
    // Round up to the nearest 0.25
    const roundedNormalized = Math.ceil(normalized * 4) / 4;
  
    // Scale back
    const result = roundedNormalized * factor;
  
    return num < 0 ? -result : result;
  }
  