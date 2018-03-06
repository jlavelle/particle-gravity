const G = 0.1
let paused = false
let sim

const angle = (p1, p2) => Math.atan2(p2.y - p1.y, p2.x - p1.x)
const momentum = ({ velocity, mass }) => velocity.copy().mult(mass).mag()
const kineticEnergy = ({ velocity, mass }) => 0.5 * mass * (velocity.copy().mag() ^ 2)

const forceVec = (f, p1, p2) => {
  const a = angle(p1, p2)
  return createVector(f * Math.cos(a), f * Math.sin(a))
}

const gravity = (p1, p2) => {
  const distance = dist(p1.x, p1.y, p2.x, p2.y)
  const f = (G * p1.mass * p2.mass) / (distance ^ 2)
  if (f === Infinity || distance === 0) return createVector(0, 0)
  const fV = forceVec(f, p1, p2)
  return fV
}

const Particle = (position, velocity, mass, color) => {
  return {
    get x() {
      return position.x
    },
    get y() {
      return position.y
    },
    position,
    mass,
    color,
    velocity,
    update(force) {
      const a = p5.Vector.div(force, mass)
      const v = velocity.add(a)
      const p = position.add(v)
      return Particle(p, v, mass, color)
    }
  }
}

const Simulation = (particles) => {
  return {
    particles,
    step() {
      return Simulation(particles.map(p => {
        const force = particles.reduce((acc, other) => acc.add(gravity(p, other)), createVector(0, 0))
        return p.update(force)
      }))
    }
  }
}

const render = ({ particles }) => {
  particles.forEach(p => {
    fill(...p.color)
    const r = 10 + (p.mass / 50)
    ellipse(p.x, p.y, r, r)
  })
}

const updateStats = (simulation) => {
  const e = document.getElementById('energy')
  const m = document.getElementById('momentum')
  const totalMomentum = simulation.particles.reduce((acc, p) => acc + momentum(p), 0)
  const totalEnergy = simulation.particles.reduce((acc, p) => acc + kineticEnergy(p), 0)
  m.textContent = `Total Momentum: ${totalMomentum}`
  e.textContent = `Total Energy: ${totalEnergy}`
}

function setup() {
  frameRate(30)
  createCanvas(500, 500)
  sim = Simulation([
    Particle(createVector(250, 300), createVector(14, 0), 1, [0, 0, 0]),
    Particle(createVector(250, 350), createVector(13, 0), 1, [0, 0, 0]),
    Particle(createVector(250, 400), createVector(12, 0), 1, [0, 0, 0]),
    Particle(createVector(250, 450), createVector(12, 0), 1, [0, 0, 0]),
    Particle(createVector(250, 250), createVector(-0.02, -0.02), 1500, [255, 255, 0])
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