import * as Fn from "./fn"
import * as Arr from "./arr"
import * as Vec from "./vec2"
import * as Particle from "./particle"
import * as Physics from "./physics"

const { create } = Particle
const { orbitalV } = Physics

const randomColor = () =>
  [0, 0, 0].map(_ => Math.floor(Math.random() * 255) % 255)

const orbital = p => r => {
  // mass ratio
  const mr = 0.1

  const offset = Vec.fromRadial(Math.random() * Math.PI, r)

  const s = Vec.sum(p.s, offset)
  const v = Vec.sum(p.v, Vec.scale(orbitalV(p, r), Vec.unit(Vec.norm(offset))))
  const m = p.m * mr * Math.random()

  return Particle.create(s, v, m, randomColor())
}

export const debrisField = ({ n, r, center }) =>
  Fn.pipe([Arr.range, Arr.map(x => (1 + x) * r), Arr.map(orbital(center))])(n)

export const solar = () => {
  const sun = create(Vec.zero, Vec.zero, 30000, [0, 0, 255])
  const planets = debrisField({ n: 5, r: 300, center: sun })
  const moons = Arr.chain(p => debrisField({ n: 2, r: 50, center: p }))(planets)

  return [sun, ...planets, ...moons]
}
