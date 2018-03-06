const G = 0.1
let paused = false
let showMomentum = true
let sim

const last = (n, as) => as.slice(as.length - n)

const angle = (p1, p2) => Math.atan2(p2.y - p1.y, p2.x - p1.x)
const momentum = ({ velocity, mass }) => velocity.copy().mult(mass)
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

const Particle = (position, velocity, mass, color, history=[]) => {
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
    history,
    update(force) {
      const a = p5.Vector.div(force, mass)
      const v = velocity.add(a)
      const oldP = position.copy()
      const p = position.add(v)
      return Particle(p, v, mass, color, [...last(500, history), oldP])
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
    if (showMomentum) {
      const m = momentum(p)
      fill(0)
      text(`${m.mag().toFixed(3)}`, p.x + 10, p.y + 10)
      stroke(100)
      line(p.x, p.y, p.x + m.x * 2, p.y + m.y * 2)
      noStroke()
    }
    p.history.forEach((pos, i) => {
      const tp = p.color.slice()
      tp[3] = (i / p.history.length) * 255
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
    Particle(createVector(500, 300), createVector(13, 0), 1, [0, 0, 255]),
    Particle(createVector(500, 350), createVector(13, 0), 1, [255, 0, 0]),
    Particle(createVector(500, 400), createVector(12, 0), 1, [0, 255, 0]),
    Particle(createVector(500, 450), createVector(12, 0), 1, [100, 100, 100]),
    Particle(createVector(500, 500), createVector(0, 0), 1500, [255, 255, 0])
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