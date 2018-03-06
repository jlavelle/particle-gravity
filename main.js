const G = 0.1
let paused = false
let showMomentum = false
let showVelocity = true
let showForce = true
let sim

const last = (n, as) => as.slice(as.length - n)

const angle = (p1, p2) => Math.atan2(p2.pos.y - p1.pos.y, p2.pos.x - p1.pos.x)
const momentum = ({ vel, mass }) => vel.copy().mult(mass)
const kineticEnergy = ({ vel, mass }) => 0.5 * mass * (vel.copy().mag() ^ 2)

const forceVec = (f, p1, p2) => {
  const a = angle(p1, p2)
  return createVector(f * Math.cos(a), f * Math.sin(a))
}

const gravity = (p1, p2) => {
  const distance = dist(p1.pos.x, p1.pos.y, p2.pos.x, p2.pos.y)
  const f = (G * p1.mass * p2.mass) / (distance ^ 2)
  if (f === Infinity || distance === 0) return createVector(0, 0)
  return forceVec(f, p1, p2)
}

const mkParticle = (pos, vel, mass, color, hist = [], lastf = null) => ({ pos, vel, mass, color, hist, lastf })

const Particle = {
  update: p => force => {
    const { mass, vel, pos, hist } = p
    const a = p5.Vector.div(force, mass)
    const v = vel.add(a)
    const np = pos.add(v)
    return { ...p, vel: v, pos: np, lastf: force, hist: [...last(500, hist), pos.copy()] }
  }
}

const Simulation = (particles) => {
  return {
    particles,
    step() {
      return Simulation(particles.map(p => {
        const force = particles.reduce((acc, other) => acc.add(gravity(p, other)), createVector(0, 0))
        return Particle.update(p)(force)
      }))
    }
  }
}

const showVec = (p, v, scale, color) => {
  const { x, y } = p
  const { x: vx, y: vy } = v
  stroke(...color)
  line(x, y, x + vx * scale, y + vy * scale)
  noStroke()
}

const render = ({ particles }) => {
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
    if (showForce && lastf) showVec(pos, lastf, 2, [100])
    noStroke()
    
    hist.forEach((pos, i) => {
      const tp = color.slice()
      tp[3] = (i / hist.length) * 255
      fill(...tp)
      ellipse(pos.x, pos.y, r / 3, r / 3)
    })
  })
}

const updateStats = (simulation) => {
  const e = document.getElementById('energy')
  const m = document.getElementById('momentum')
  const totalMomentum = simulation.particles.reduce((acc, p) => acc.add(momentum(p)), createVector(0, 0))
  const totalEnergy = simulation.particles.reduce((acc, p) => acc + kineticEnergy(p), 0)
  m.textContent = `Total Momentum: ${totalMomentum.mag()}`
  e.textContent = `Total Energy: ${totalEnergy}`
}

function setup() {
  frameRate(30)
  createCanvas(1000, 1000)
  noStroke()
  sim = Simulation([
    mkParticle(createVector(500, 300), createVector(13, 0), 5, [0, 0, 255]),
    mkParticle(createVector(500, 350), createVector(13, 0), 5, [255, 0, 0]),
    mkParticle(createVector(500, 400), createVector(4, 0), 2, [0, 255, 0]),
    mkParticle(createVector(500, 450), createVector(12, 0), 1, [100, 100, 100]),
    mkParticle(createVector(500, 500), createVector(0, 0), 1500, [255, 255, 0])
  ])
}

function draw() {
  clear()
  if (!paused) {
    sim = sim.step()
  }
  render(sim)
  updateStats(sim)
}

function mousePressed() {
  paused = !paused
}

function keyPressed() {
  if (key === ' ') {
    sim = sim.step()
  }
}