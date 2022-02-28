let canvas, pg, colorPicker, slider, eraser, reset, save, tagInput;
let div = document.getElementById("canvas-p5-container");
let mode = 0;

function setup() {
  let width = div.offsetWidth * 0.95;
  let height = width * 0.75;
  width = Math.round(width);
  height = Math.round(height);
  canvas = createCanvas(width, height);
  
  pg = createGraphics(width, height);

  pg.background('#ffffff');
  canvas.parent('canvas-p5-container');
  canvas.addClass('drawing-canvas');
  
  colorPicker = createColorPicker('#000000');
  colorPicker.parent('panel-p5-container');

  slider = createSlider(1, 50, 10, 1);
  slider.parent('panel-p5-container');
  
  eraser = createButton('Eraser');
  eraser.mousePressed(switchEraser);
  eraser.parent('panel-p5-container');

  reset = createButton('Reset');
  reset.mousePressed(resetCanvas);
  reset.parent('panel-p5-container');
  
  save = createButton('Save Canvas');
  save.mousePressed(saveCanvasTest);
  save.parent('panel-p5-container');

  //tagInput = document.getElementById("stacked-drawing-tags");
  //tagInput.addEventListener("change", enableWordSelection);
}

function saveCanvasTest() {
  let dataURL = canvas.canvas.toDataURL();
  console.log(dataURL);
}

function windowResized() {
  let width = div.offsetWidth * 0.95;
  let height = width * 0.75;
  width = Math.round(width);
  height = Math.round(height);
  canvas = resizeCanvas(width, height);
  background('#ffffff');
  pg.width = width;
  pg.height = height;
  console.log(width + " " + height);
  image(pg, 0, 0, width, height);
  console.log(pg.width);


}


function draw() {
  pg.strokeWeight(slider.value());
  
  if (mode == 0) {
    eraser.style('background-color', '#c0c0c0');
    pg.stroke(colorPicker.color());
    pg.fill(colorPicker.color());
  }
  else {
    eraser.style('background-color', '#ff5c5c');
    pg.stroke('#ffffff');
    pg.fill('#ffffff');
  }

  image(pg, 0,0);
}

function mousePressed(){
  pg.circle(mouseX,mouseY,1);
} 

function mouseDragged(){
  pg.line(mouseX, mouseY, pmouseX, pmouseY);
}

function switchEraser() {
  mode = !mode;
}

function resetCanvas() {
  pg.background('#ffffff');
  image(pg, 0,0);
}

// tags
/*
function enableWordSelection() {
  $("#drawing-selection").show();
}

function enableWordSelection() {
  let drawingSelection = document.getElementById("drawing-selection")
  console.log((tagInput && tagInput.value)==true);
  if (tagInput && tagInput.value) {
    drawingSelection.style.display = 'block';
  }
  else {
    drawingSelection.style.display = 'none';
  }
}*/