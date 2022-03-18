let canvas, pg, colorPicker, eraser, reset;
let mode = 0;
let drawing = 0;
let currentTag = '';
let div = document.getElementById("canvas-p5-container");
let brushSize = $("input[name='brush-size']:checked").val();

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

  function importTags() {
    $('#stacked-drawing-tags').inputTags({
      max: 3,
        autocomplete: {
          values: Object.keys(wordPool),
          only: true
        },
        destroy: function($elem) {
          if ($elem.tags.length < 1) {
            $("#drawing-selection").hide();
            currentTag = '';
          }
        },
        change: function($elem) {
          if ($elem.tags.length > 0 && $elem.tags[0] != currentTag) {
            $elem.next().removeClass("alert-error"); //Remove error from div
            currentTag = $elem.tags[0];
            // wordPool is shared in wordPool.js
            let words = wordPool[currentTag];
            //https://stackoverflow.com/questions/19269545/how-to-get-a-number-of-random-elements-from-an-array
            let chosenWords =  words.sort(() => Math.random() - Math.random()).slice(0, 3);
            $("#drawing-word-1").val(chosenWords[0]);
            $("label[for='drawing-word-1']").text(chosenWords[0]);
            $("#drawing-word-2").val(chosenWords[1]);
            $("label[for='drawing-word-2']").text(chosenWords[1]);
            $("#drawing-word-3").val(chosenWords[2]);
            $("label[for='drawing-word-3']").text(chosenWords[2]);
            $("#drawing-selection").show();
          }
        },
        errors: { 
          empty: 'Input field is empty.',
          exists:'This tag already exists.',
          autocomplete_only: 'Please enter one of the suggested tags.',
          minLength: 'Your tag should have at least %s characters.',
          maxLength: 'Your tag should have at most %s characters.',
          max: 'The number of tags cannot exceed %s.'      
        }
    });
    
  }

function submitPost() {
  let valid = $('#drawing-title-form')[0].reportValidity();
  if ($("#drawing-selection").is(":hidden")){
    $(".drawing-settings-box .inputTags-list").addClass("alert-error")
    valid = false;
  }
  
  if (valid){
    let confirmation = confirm('Are you sure you want to submit your drawing?');
    if (confirmation) {
      saveCanvastoDataURL();
    }
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

    // prevent sending if drawing doesn't have tags/word selected and title?
    $.ajax({
      type: 'POST',
      url: "drawing",
      data: formData,
      processData: false,
      contentType: false,
      success: function(result){
        console.log(result)
        window.location.href ="/post/"+result;
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
  var newPg = createGraphics(width, height);
  newPg.image(pg, 0, 0, width, height);
  pg = newPg;
}


function draw() {
  pg.strokeWeight(brushSize);
  if (mode == 0) {
    eraser.style('background-color', '#c0c0c0');
    pg.stroke(colorPicker.color());
    pg.fill(colorPicker.color());
  }
  else if (mode == 1) {
    eraser.style('background-color', 'orangered');
    pg.stroke('#ffffff');
    pg.fill('#ffffff');
  }
  image(pg, 0,0);
}

function mouseClicked(){
  pg.circle(mouseX,mouseY,1);
} 

function mouseDragged(){
  if (drawing){
    pg.line(mouseX, mouseY, pmouseX, pmouseY);
    return false;
  }
}

function mousePressed() {
  if (mouseX <= pg.width+30 && mouseX >= -30 && mouseY <= pg.height+30 && mouseY >= -30){
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