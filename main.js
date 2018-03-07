const G = 1;
let paused = false;
let showMomentum = false;
let showVelocity = true;
let showForce = true;
let sim;

const lastN = (n, as) => as.slice(as.length - n);
const last = as => as[as.length - 1];

const Vec = (() => {
  const scale = (k, [x, y]) => [k * x, k * y];
  const dot = ([x1, y1], [x2, y2]) => x1 * x2 + y1 * y2;
  const sum = ([x1, y1], [x2, y2]) => [x1 + x2, y1 + y2];
  const diff = (v1, v2) => sum(v1, scale(-1, v2));
  const norm = ([x1, y1], [x2, y2]) => {
    const dx = x2 - x1;
    const dy = y2 - y1;

    return dx === 0 ? [-dy, 0] : [-dy / dx, 1];
  };
  const mag = ([x, y]) => Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
  const unit = v => scale(1 / Math.abs(mag(v)), v);
  const eq = ([x1, y1], [x2, y2]) => x1 === x2 && y1 === y2;
  const x = ([x, _]) => x;
  const y = ([_, y]) => y;

  return { scale, dot, sum, diff, norm, mag, unit, eq, x, y };
})();

const Physics = {
  gravity: (p1, p2) => {
    const offset = Vec.diff(p2.s, p1.s);
    const distance = Vec.mag(offset);
    const f = G * p1.m * p2.m / Math.pow(distance, 2);

    const degen = f === Infinity || distance === 0;
    return degen ? [0, 0] : Vec.scale(f, Vec.unit(offset));
  },
  momentum: ({ v, m }) => Vec.scale(m, v),
  kinetic: ({ v, m }) => 0.5 * m * Math.pow(Vec.mag(v), 2),
  orbitalV: ({ m }, r) => Math.sqrt(G * m / r)
};

const Particle = {
  update: force => p => {
    const { s, v, m, h } = p;

    const a = Vec.scale(1 / m, force);
    const v_ = Vec.sum(v, a);
    const s_ = Vec.sum(s, v_);

    return { ...p, s: s_, v: v_, h: [...lastN(50, h), p] };
  },
  create: (s, v, m, color, h = []) => ({ s, v, m, color, h })
};

const Simulation = {
  evolve: particles =>
    particles.map(p => {
      const force = particles.reduce(
        (g, p2) => Vec.sum(g, Physics.gravity(p, p2)),
        [0, 0]
      );
      return Particle.update(force)(p);
    }),

  stats: particles => ({
    momentum: particles.map(Physics.momentum).reduce(Vec.sum),
    energy: particles.map(Physics.kinetic).reduce((a, b) => a + b)
  })
};

const Dataset = (() => {
  const { create } = Particle;
  const { orbitalV } = Physics;

  const sun = create([500, 500], [0, 0], 3000, [0, 0, 255]);

  const randomColor = () =>
    [0, 0, 0].map(_ => Math.floor(Math.random() * 255) % 255);

  const solar = () => {
    const planets = [1, 2, 3, 4, 5].map(n => {
      const x = 500;
      const height = n * 50 + Math.random() * 25;
      const y = height + 500;
      const s = Physics.orbitalV(sun, height);
      return create([x, y], [s, 0], 1 + Math.random() * 5, randomColor());
    });

    return [sun, ...planets];
  };

  const threebody = () => {
    const planet = create(
      [500, 900],
      [orbitalV(sun, 400), 0],
      200,
      randomColor()
    );
    const moon = create(
      [500, 925],
      [orbitalV(planet, 25) + orbitalV(sun, 425), 0],
      1,
      randomColor()
    );
    return [planet, moon, sun];
  };

  return { solar, threebody };
})();

const Display = (() => {
  const renderVector = (p, v, scale, color) => {
    const [x, y] = p;
    const [vx, vy] = v;

    stroke(...color);
    line(x, y, x + vx * scale, y + vy * scale);
    noStroke();
  };

  const renderParticle = p => {
    const { x, y } = Vec;

    fill(...p.color);
    const r = 10 + p.m / 50;
    ellipse(x(p.s), y(p.s), r, r);

    noStroke();
    p.h.forEach(({ s: pos }, i) => {
      const tp = p.color.slice();
      tp[3] = 255 * (i / p.h.length);
      fill(...tp);
      ellipse(x(pos), y(pos), r / 3, r / 3);
    });
  };

  const renderParticleMetadata = p => {
    if (showVelocity) {
      renderVector(p.s, p.v, 5, [100]);
    }
    if (showForce && p.h.length) {
      renderVector(p.s, Vec.diff(p.v, last(p.h).v), 30, [100]);
    }
  };

  const render = particles => {
    particles.forEach(p => {
      renderParticle(p);
      renderParticleMetadata(p);
    });
    updateStats(particles);
  };

  const updateStats = particles => {
    const { momentum, energy } = Simulation.stats(particles);

    const [e, m] = ["energy", "momentum"].map(id =>
      document.getElementById(id)
    );
    m.textContent = `Total Momentum: ${momentum}`;
    e.textContent = `Total Energy: ${energy}`;
  };

  return { render };
})();

function setup() {
  frameRate(30);
  createCanvas(1000, 1000);
  noStroke();

  sim = Dataset.threebody();
}

function draw() {
  clear();
  if (!paused) {
    sim = Simulation.evolve(sim);
  }
  Display.render(sim);
}

function keyPressed() {
  if (key === " ") {
    sim = sim.step();
  } else if (key === "p") {
    paused = !paused;
  }
}
