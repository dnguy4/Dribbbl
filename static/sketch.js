let canvas, pg, colorPicker, eraser, reset;
let mode = 0;
let drawing = 0;
let div = document.getElementById("canvas-p5-container");
let brushSize = $("input[name='brush-size']:checked").val();

let testWordPool = {
  "bird": ['sparrow','hawk','robin','green heron','duck','eagle','egret','crow','owl','finch','goose','swan'],
  "pokemon": ['rowlet','dartrix', 'decidueye', 'litten', 'torracat', 'incineroar', 'popplio', 'brionne', 'primarina']
};

let wordsChosen = 0;


function setup() {
  let width = div.offsetWidth * 0.95;
  let height = width * 0.75;
  width = Math.round(width);
  height = Math.round(height);
  canvas = createCanvas(width, height);
  
  pg = createGraphics(width, height);

  $("input[name='brush-size']").change(function() {
    brushSize = $("input[name='brush-size']:checked").val();
  });

  pg.background('#ffffff');
  canvas.parent('canvas-p5-container');
  canvas.addClass('drawing-canvas');
  
  colorPicker = createColorPicker('#000000');
  colorPicker.parent('panel-p5-container');
  
  eraser = createButton('Eraser');
  eraser.mouseClicked(switchEraser);
  eraser.parent('panel-p5-container');

  reset = createButton('Reset');
  reset.mouseClicked(resetCanvas);
  reset.parent('panel-p5-container');
}

function importTags(tags){
  // https://www.jqueryscript.net/form/Tags-Input-Autocomplete.html
  $('#stacked-drawing-tags').tagsInput({
    unique:true,
    'autocomplete': {
      source: tags
    },
    whitelist: tags,
    //https://stackoverflow.com/questions/19269545/how-to-get-a-number-of-random-elements-from-an-array
    onAddTag: function(input, value){
      console.log(input.value)
      let words = testWordPool[value];
      if (words && !wordsChosen) {
        let chosenWords =  words.sort(() => Math.random() - Math.random()).slice(0, 3);
        $("#drawing-word-1").val(chosenWords[0]);
        $("label[for='drawing-word-1']").text(chosenWords[0]);
        $("#drawing-word-2").val(chosenWords[1]);
        $("label[for='drawing-word-2']").text(chosenWords[1]);
        $("#drawing-word-3").val(chosenWords[2]);
        $("label[for='drawing-word-3']").text(chosenWords[2]);
        wordsChosen = 1;
        $("#drawing-selection").show();
      }

    },
    onRemoveTag: function(input, value) {
      if (!$(input).val()) {
        $("#drawing-word-1").val('');
        $("label[for='drawing-word-1']").text('');
        $("#drawing-word-2").val('');
        $("label[for='drawing-word-1']").text('');
        $("#drawing-word-3").val('');
        $("label[for='drawing-word-1']").text('');
        wordsChosen = 0;
        $("#drawing-selection").hide();
      }
    }
  });
}

function submitPost() {
  let confirmation = confirm('Are you sure you want to submit your drawing?');
  if (confirmation) {
    saveCanvastoDataURL();
  }
}

function saveCanvastoDataURL() {
  // https://stackoverflow.com/questions/22409667/how-to-combine-two-javascript-formdata-objects
  let formData = new FormData($('#drawing-title-form')[0]);
  let poData = $('#drawing-settings-form').serializeArray();
  for (var i=0; i<poData.length; i++){
    formData.append(poData[i].name, poData[i].value)
  }
  formData.append("drawing_tags", $('#stacked-drawing-tags').val())

  canvas.canvas.toBlob(blob => {
    formData.append('post_image', blob);

    $.ajax({
      type: 'POST',
      url: "upload_post",
      data: formData,
      processData: false,
      contentType: false,
      success: function(result){
        console.log(result)
        window.location.href ="/solver/"+result;
      } 
    })
  })
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
  image(pg, 0, 0, width, height);
}


function draw() {
  pg.strokeWeight(brushSize);
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

function mouseClicked(){
  pg.circle(mouseX,mouseY,1);
} 

function mouseDragged(){
  pg.line(mouseX, mouseY, pmouseX, pmouseY);
  if (drawing){
    return false;
  }
}

function mousePressed() {
  if (mouseX <= pg.width && mouseX >= 0 && mouseY <= pg.height && mouseY >= 0){
    drawing = 1;
  }
}

function mouseReleased() {
  drawing = 0;
}

function switchEraser() {
  mode = !mode;
}

function resetCanvas() {
  let confirmReset = confirm("Do you want to reset your drawing?");
  if (confirmReset) {
    pg.background('#ffffff');
    image(pg, 0,0);
  }
}