import * as Arr from "./arr"
import * as Vec from "./vec2"
import * as Physics from "./physics"
import * as Particle from "./particle"

const zoomSensitivity = 0.75

let showMomentum = false
let showVelocity = false
let showForce = false
let zoom = 1.0

const renderVector = (p, v, scale, color) => {
  const [x, y] = p
  const [vx, vy] = v

  stroke(...color)
  line(x, y, x + vx * scale, y + vy * scale)
  noStroke()
}

const particleRadius = p => 10 + p.m / 50

const renderTrail = p => {
  const r = particleRadius(p) / 3

  p.h.forEach(({ s }, i) => {
    const ratio = i / p.h.length
    const tp = p.color.slice()
    tp[3] = 255 * ratio
    fill(...tp)
    ellipse(Vec.x(s), Vec.y(s), r * ratio, r * ratio)
  })
}

const renderParticle = p => {
  const { x, y } = Vec

  fill(...p.color)
  const r = particleRadius(p)
  ellipse(x(p.s), y(p.s), r, r)

  noStroke()
  renderTrail(p)
}

const renderParticleMetadata = p => {
  if (showVelocity) {
    renderVector(p.s, p.v, 5, [100])
  }
  if (showForce && p.h.length) {
    renderVector(p.s, Vec.diff(p.v, Arr.last(p.h).v), 30, [100])
  }
}

const transform = com => {
  translate(-Vec.x(com), -Vec.y(com))
  translate(width / 2, height / 2)

  scale(zoom)
}

export const render = particles => {
  const stats = Particle.stats(particles)

  push()
  transform(stats.com)

  particles.forEach(p => {
    renderParticle(p)
    renderParticleMetadata(p)
  })
  pop()

  updateStats(stats)
}

const updateStats = stats => {
  const { momentum, energy, com } = stats

  const [e, m, c] = ["energy", "momentum", "com"].map(id =>
    document.getElementById(id)
  )
  m.textContent = `Total Momentum: ${momentum}`
  e.textContent = `Total Energy: ${energy}`
  c.textContent = `COM: ${com}`
}

export const scroll = e => {
  const sign = e.delta === 0 ? 1 : e.delta / Math.abs(e.delta)
  zoom *= Math.pow(zoomSensitivity, sign)
  return false
}
