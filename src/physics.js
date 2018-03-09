import * as Vec from "./vec2"

const G = 0.01
export const gravity = (p1, p2) => {
  const offset = Vec.diff(p2.s, p1.s)
  const distance = Vec.mag(offset)
  const f = G * p1.m * p2.m / Math.pow(distance, 2)

  const degen = f === Infinity || distance === 0
  return degen ? Vec.zero : Vec.scale(f, Vec.unit(offset))
}
export const momentum = ({ v, m }) => Vec.scale(m, v)
export const kinetic = ({ v, m }) => 0.5 * m * Math.pow(Vec.mag(v), 2)
export const orbitalV = ({ m }, r) => Math.sqrt(G * m / r)
