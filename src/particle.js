import * as Arr from "./arr"
import * as Vec from "./vec2"
import * as Physics from "./physics"

export const create = (s, v, m, color, h = []) => ({
  s,
  v,
  m,
  color,
  h,
  tick: true
})

const force = system => p =>
  system.reduce((g, p2) => Vec.sum(g, Physics.gravity(p, p2)), Vec.zero)

const accel = system => p => Vec.scale(1 / p.m, force(system)(p))

export const update = system => {
  const accels = s => Arr.map(accel(s))(s)

  const s0 = system
  // Step 1: update positions
  const a1 = accels(s0)
  const s1 = s0.map((p, i) => ({
    ...p,
    s: [p.s, p.v, Vec.scale(1 / 2, a1[i])].reduce(Vec.sum)
  }))

  // Step 2: update velocities with recomputed accelerations
  const a2 = accels(s1)
  const s2 = s1.map((p, i) => ({
    ...p,
    v: Vec.sum(p.v, Vec.scale(1 / 2, Vec.sum(a1[i], a2[i]))),
    h: [...Arr.lastN(100, p.h), p]
  }))

  return s2
}
