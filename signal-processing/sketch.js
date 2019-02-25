var soundFile;
var fft;

var filterFreq, filterRes, log, filterList;

const Q_MAX = 10;

const types = ["notch", "lowpass", "highpass", "bandpass", "allpass"];
const colours = {
  notch: "#D8D8A7",
  lowpass: "#4D88BA",
  highpass: "#97D5F5",
  bandpass: "#A074C4",
  allpass: "#C76B31"
};
const filters = [];

function preload() {
  soundFormats("mp3");
  soundFile = loadSound("./10-25-27_dur=1200secs.mp3");
}

function setup() {
  createCanvas(1250, 550);
  fill(255, 40, 255);

  log = createDiv("");
  filterList = createDiv("");

  // Disconnect soundfile from master output.
  // Then, connect it to the filter, so that we only hear the filtered sound
  soundFile.disconnect();

  addFilter();

  fft = new p5.FFT();
}

function keyPressed() {
  if (key === " ") {
    toggleFilters();
    return;
  }

  if (key === "r") {
    console.log("reset");
    filters.map(f => f.disconnect());
    filters.splice(0);
    addFilter();
    return;
  }

  if (key === "ArrowLeft") {
    cycleType(true);
    return;
  }
  if (key === "ArrowRight") {
    cycleType();
    return;
  }

  if (key === "p") {
    // toggle play/ pause on p
    if (soundFile.isPlaying()) {
      soundFile.pause();
      console.log("paused");
    } else {
      soundFile.play();
      console.log("playing");
    }
    return;
  }
}

// Changes the current active filter type
function cycleType(reverse) {
  if (reverse) {
    const t = types.pop();
    types.unshift(t);
  } else {
    const t = types.shift();
    types.push(t);
  }

  const f = filters.pop();
  f.disconnect();
  addFilter();
}

// switch the filters between their type and allpass
function toggleFilters() {
  filters.forEach(f => f.toggle());
}

function addFilter() {
  const newFilter = new p5.Filter(types[0]);

  if (filters.length === 0) {
    soundFile.connect(newFilter);
  } else {
    filters[filters.length - 1].disconnect();
    filters[filters.length - 1].connect(newFilter);
  }

  filters.push(newFilter);
  const items = [];
  filters.slice(0, -1).forEach(f => {
    items.push(` ${f.biquad.type} f=${f.biquad.frequency.value} Q=${f.biquad.Q.value.toFixed(4)}`);
  });
  console.log("current filters");
  items.forEach(i => console.log("  " + i));
  filterList.html(`<ul class="filters"><li>${items.join("</li><li>")}</li></ul>`);
}

function mouseClicked() {
  if (!soundFile.isPlaying()) {
    soundFile.play();
    return;
  }

  addFilter();
}

function draw() {
  background(30);

  // Map mouseX to a bandpass freq from the FFT spectrum range: 10Hz - 22050Hz
  let filterFreq = Math.max(10, Math.floor(map(mouseX, 0, width, 10, 22050)));
  // Map mouseY to Q
  let Q = Math.max(0.01, map(mouseY, 0, height, 0.001, Q_MAX));

  // set filter parameters.
  filters[filters.length - 1].set(filterFreq, Q);

  if (soundFile.isPlaying()) {
    log.html(
      `<div class="current-filter"> <strong>${types[0]}</strong> <span>f ${filterFreq.toFixed(
        0
      )}</span> <span>Q ${Q.toFixed(4)}</span></div>`
    );
  } else {
    log.html(`Click to Start`);
  }

  // Draw every value in the FFT spectrum analysis where
  // x = lowest (10Hz) to highest (22050Hz) frequencies,
  // h = energy (amplitude / volume) at that frequency
  var spectrum = fft.analyze();
  noStroke();
  fill("#659151");
  for (var i = 0; i < spectrum.length; i++) {
    var x = map(i, 0, spectrum.length, 0, width);
    var h = -height + map(spectrum[i], 0, 255, height, 0);
    rect(x, height, width / spectrum.length, h);
  }

  for (const f of filters) {
    const t = f.biquad.type;
    fill(colours[t]);
    const barWidth = ((f.biquad.Q.value - Q_MAX) * width) / spectrum.length;
    const filterX = map(f.biquad.frequency.value, 10, 22050, 0, width) - 0.5 * barWidth;
    rect(filterX, height, barWidth, -height);
  }
}
