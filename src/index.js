import * as Vec from "./vec2"
import * as Arr from "./arr"
import * as Physics from "./physics"
import * as Dataset from "./dataset"
import * as Particle from "./particle"
import * as Display from "./display"

let paused = false
let sim

window.setup = function() {
  frameRate(30)
  createCanvas(1000, 1000)
  noStroke()

  sim = Dataset.solar()
}

window.draw = function() {
  clear()
  background(0)
  if (!paused) {
    sim = Particle.update(sim)
  }
  Display.render(sim)
}

window.keyPressed = function() {
  if (key === " ") {
    sim = sim.step()
  } else if (key === "p") {
    paused = !paused
  }
}

window.mouseWheel = function(event) {
  return Display.scroll(event)
}
