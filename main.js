const G = 0.1
let paused = false
let showMomentum = false
let showVelocity = true
let showForce = true
let particles = []

const last = (n, as) => as.slice(as.length - n)

const randomColor = () => [0, 0, 0].map(_ => Math.floor(Math.random() * 255) % 255)

const angle = (p1, p2) => Math.atan2(p2.pos.y - p1.pos.y, p2.pos.x - p1.pos.x)
const distance = (p1, p2) => dist(p1.pos.x, p1.pos.y, p2.pos.x, p2.pos.y)

const momentum = ({ vel, mass }) => vel.copy().mult(mass)
const kineticEnergy = ({ vel, mass }) => 0.5 * mass * Math.pow(vel.copy().mag(), 2)
const orbitalSpeed = ({ mass }, r) => Math.sqrt(G * mass / r)

const forceVec = (f, p1, p2) => {
  const a = angle(p1, p2)
  return createVector(f * Math.cos(a), f * Math.sin(a))
}

const gravity = (p1, p2) => {
  const d = distance(p1, p2)
  const f = (G * p1.mass * p2.mass) / Math.pow(d, 2)
  if (f === Infinity || d === 0) return createVector(0, 0)
  return forceVec(f, p1, p2)
}

const Particle = {
  make: (pos, vel, mass, color, hist = [], lastf = null) => ({ pos, vel, mass, color, hist, lastf }),
  update: p => force => {
    const { mass, vel, pos, hist } = p
    const a = p5.Vector.div(force, mass)
    const v = vel.add(a)
    const np = pos.add(v)
    return { ...p, vel: v, pos: np, lastf: force, hist: [...last(500, hist), pos.copy()] }
  }
}

const Simulation = {
  step: ps => ps.map(p => {
    const f = ps.reduce((a, o) => a.add(gravity(p, o)), createVector(0, 0))
    return Particle.update(p)(f)
  })
}

const showVec = (p, v, scale, color) => {
  const { x, y } = p
  const { x: vx, y: vy } = v
  stroke(...color)
  line(x, y, x + vx * scale, y + vy * scale)
  noStroke()
}

const render = (particles) => {
  particles.forEach(p => {
    const { color, mass, pos, vel, lastf, hist } = p
    const { x, y } = pos
    fill(...color)
    const r = 10 + (mass / 50)
    ellipse(x, y, r, r)

    if (showMomentum) {
      const m = momentum(p)
      fill(0)
      text(`${m.mag().toFixed(3)}`, x + 10, y + 10)
    }
    if (showVelocity) showVec(pos, vel, 2, [100])
    if (showForce && lastf) showVec(pos, lastf, 20, [100])
    noStroke()

    hist.forEach((pos, i) => {
      const tp = color.slice()
      tp[3] = (i / hist.length) * 255
      fill(...tp)
      ellipse(pos.x, pos.y, r / 3, r / 3)
    })
  })
}

const updateStats = (particles) => {
  const e = document.getElementById('energy')
  const m = document.getElementById('momentum')
  const totalMomentum = particles.reduce((acc, p) => acc.add(momentum(p)), createVector(0, 0))
  const totalEnergy = particles.reduce((acc, p) => acc + kineticEnergy(p), 0)
  m.textContent = `Total Momentum: ${totalMomentum.mag()}`
  e.textContent = `Total Energy: ${totalEnergy}`
}

function setup() {
  const { make } = Particle
  frameRate(60)
  createCanvas(1000, 1000)
  noStroke()
  const sun = make(createVector(500, 500), createVector(0, 0), 1500, [255, 255, 0])
  const planets = [1, 2, 3, 4, 5].map(n => {
    const x = 500
    const height = n * 50 + (Math.random() * 25)
    const y = height + 500
    const s = orbitalSpeed(sun, height)
    return make(createVector(x, y), createVector(s, 0), 1 + Math.random() * 5, randomColor())
  })
  particles = [
    ...planets,
    sun
  ]
}

function draw() {
  clear()
  if (!paused) {
    particles = Simulation.step(particles)
  }
  render(particles)
  updateStats(particles)
}

function mousePressed() {
  paused = !paused
}

function keyPressed() {
  if (key === ' ') {
    particles = Simulation.step(particles)
  }
}