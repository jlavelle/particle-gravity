export const scale = (k, [x, y]) => [k * x, k * y]
export const dot = ([x1, y1], [x2, y2]) => x1 * x2 + y1 * y2
export const sum = ([x1, y1], [x2, y2]) => [x1 + x2, y1 + y2]
export const diff = (v1, v2) => sum(v1, scale(-1, v2))
export const norm = ([x, y]) => {
  return x === 0 ? [-y, 0] : [-y / x, 1]
}
export const mag = ([x, y]) => Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))
export const unit = v => scale(1 / Math.abs(mag(v)), v)
export const fromRadial = (theta, r) => [
  Math.cos(theta) * r,
  Math.sin(theta) * r
]
export const eq = ([x1, y1], [x2, y2]) => x1 === x2 && y1 === y2
export const x = ([x, _]) => x
export const y = ([_, y]) => y
export const zero = [0, 0]
