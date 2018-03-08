const G = 1
let paused = false
let showMomentum = false
let showVelocity = true
let showForce = true
let sim

const Fn = (() => {
  const pipe = fs => fs.reduce((g, f) => a => f(g(a)))

  return { pipe }
})()

const Arr = (() => {
  // Misc
  const last = as => as[as.length - 1]
  const lastN = (n, as) => as.slice(as.length - n)
  const range = n => [...Array(n).keys()]

  // Functor
  const map = f => as => as.map(f)

  // Chain
  const join = as => as.reduce((a, b) => [...a, ...b], [])
  const chain = f => as => as.reduce((p, c) => [...p, ...f(c)], [])

  return { last, lastN, range, map, join, chain }
})()

const Vec = (() => {
  const scale = (k, [x, y]) => [k * x, k * y]
  const dot = ([x1, y1], [x2, y2]) => x1 * x2 + y1 * y2
  const sum = ([x1, y1], [x2, y2]) => [x1 + x2, y1 + y2]
  const diff = (v1, v2) => sum(v1, scale(-1, v2))
  const norm = ([x, y]) => {
    return x === 0 ? [-y, 0] : [-y / x, 1]
  }
  const mag = ([x, y]) => Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))
  const unit = v => scale(1 / Math.abs(mag(v)), v)
  const fromRadial = (theta, r) => [Math.cos(theta) * r, Math.sin(theta) * r]
  const eq = ([x1, y1], [x2, y2]) => x1 === x2 && y1 === y2
  const x = ([x, _]) => x
  const y = ([_, y]) => y
  const zero = [0, 0]

  return { scale, dot, sum, diff, norm, mag, unit, fromRadial, eq, x, y, zero }
})()

const Physics = {
  gravity: (p1, p2) => {
    const offset = Vec.diff(p2.s, p1.s)
    const distance = Vec.mag(offset)
    const f = G * p1.m * p2.m / Math.pow(distance, 2)

    const degen = f === Infinity || distance === 0
    return degen ? Vec.zero : Vec.scale(f, Vec.unit(offset))
  },
  momentum: ({ v, m }) => Vec.scale(m, v),
  kinetic: ({ v, m }) => 0.5 * m * Math.pow(Vec.mag(v), 2),
  orbitalV: ({ m }, r) => Math.sqrt(G * m / r)
}

const Particle = (() => {
  const create = (s, v, m, color, h = []) => ({ s, v, m, color, h, tick: true })

  const force = system => p =>
    system.reduce((g, p2) => Vec.sum(g, Physics.gravity(p, p2)), Vec.zero)

  const accel = system => p => Vec.scale(1 / p.m, force(system)(p))

  const update = system => {
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

  return { update, create }
})()

const Simulation = {
  evolve: Particle.update,

  stats: particles => ({
    momentum: particles.map(Physics.momentum).reduce(Vec.sum),
    energy: particles.map(Physics.kinetic).reduce((a, b) => a + b),
    com: Vec.scale(
      1 / particles.map(p => p.m).reduce((a, b) => a + b),
      particles.map(p => Vec.scale(p.m, p.s)).reduce(Vec.sum)
    )
  })
}

const Dataset = (() => {
  const { create } = Particle
  const { orbitalV } = Physics

  const sun = create(Vec.zero, Vec.zero, 30000, [0, 0, 255])

  const randomColor = () =>
    [0, 0, 0].map(_ => Math.floor(Math.random() * 255) % 255)

  const orbital = p => r => {
    // mass ratio
    const mr = 0.1

    const offset = Vec.fromRadial(Math.random() * Math.PI, r)

    const s = Vec.sum(p.s, offset)
    const v = Vec.sum(
      p.v,
      Vec.scale(orbitalV(p, r), Vec.unit(Vec.norm(offset)))
    )
    const m = p.m * mr * Math.random()

    return Particle.create(s, v, m, randomColor())
  }

  const debrisField = ({ n, r, center }) =>
    Fn.pipe([Arr.range, Arr.map(x => (1 + x) * r), Arr.map(orbital(center))])(n)

  const solar = () => {
    const planets = debrisField({ n: 5, r: 200, center: sun })
    const moons = Arr.chain(p => debrisField({ n: 2, r: 30, center: p }))(
      planets
    )

    return [sun, ...planets, ...moons]
  }

  return { solar }
})()

const Display = (() => {
  const zoomSensitivity = 0.75
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

  const render = particles => {
    const stats = Simulation.stats(particles)

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

  const scroll = e => {
    const sign = e.delta === 0 ? 1 : e.delta / Math.abs(e.delta)
    zoom *= Math.pow(zoomSensitivity, sign)
    return false
  }

  return { render, scroll }
})()

function setup() {
  frameRate(30)
  createCanvas(1000, 1000)
  noStroke()

  sim = Dataset.solar()
}

function draw() {
  clear()
  background(0)
  if (!paused) {
    sim = Simulation.evolve(sim)
  }
  Display.render(sim)
}

function keyPressed() {
  if (key === " ") {
    sim = sim.step()
  } else if (key === "p") {
    paused = !paused
  }
}

function mouseWheel(event) {
  return Display.scroll(event)
}
