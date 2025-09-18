export class Float64RingBuffer {
  constructor(size) {
    this.size = size;
    this.xBuffer = new Float64Array(size);
    this.yBuffer = new Float64Array(size);
    this.index = 0;
    this.count = 0;
  }

  push(...points) {
    for (const point of points) {
      const { x, y } = point;
      this.xBuffer[this.index] = x;
      this.yBuffer[this.index] = y;

      this.index = (this.index + 1) % this.size;
      if (this.count < this.size) this.count++;
    }
  }

  getHighestY(){
    return this.yBuffer.reduce((a,b)=>Math.max(a,b),0)
  }

  getValues(scale=1) {
    const result = [];
    const start = this.count === this.size ? this.index : 0;
    for (let i = 0; i < this.count; i++) {
        const idx = (start + i) % this.size;
        if (this.xBuffer[idx] != 0) {
            result.push({
                x: this.xBuffer[idx],
                y: this.yBuffer[idx] * scale
            });
        }
    }
    return result;
}
  editRecent(n, point) {
    if (n >= this.count) throw new RangeError("Not enough elements in buffer");
    const idx = (this.index - 1 - n + this.size) % this.size;
    if (point.x !== undefined) this.xBuffer[idx] = point.x;
    if (point.y !== undefined) this.yBuffer[idx] = point.y;
    }

  getRecent(n) {
    if (n >= this.count) throw new RangeError("Not enough elements in buffer");
    const idx = (this.index - 1 - n + this.size) % this.size;
    return {x:this.xBuffer[idx],y:this.yBuffer[idx]}
    }
}