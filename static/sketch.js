let canvas, pg, colorPicker, eraser, reset;
let mode = 0;
let drawing = 0;
let div = document.getElementById("canvas-p5-container");
let brushSize = $("input[name='brush-size']:checked").val();

let testWordPool = {
  "firearm":['pistol', 'shotgun', 'rifle', 'sniper', 'revolver', 'RPG', 'submachine gun', 'machine gun', 'light machine gun', 'grenade launcher', 'bazooka'],
  "food":['pizza', 'burger', 'hotdog', 'fries', 'sandwich', 'taco', 'donut', 'pancakes', 'fried chicken', 'muffins', 'noodles', 'ice cream', 'bread', 'kebab', 'ramen', 'pasta'],
  "star-wars":['k-2so', 'darth vader', 'chewbacca', 'bb-8', 'boba fett', 'r2-d2', 'baby yoda', 'yoda', 'storm trooper', 'scout trooper', 'light saber', 'c-3po'],
  "anime":['naruto', 'bleach', 'one piece', 'attack on titan', 'demon slayer', 'black clover', 'one punch man', 'haikyu', 'my hero academia', 'pokemon', 'fullmetal alchemist'],
  "building":['hospital', 'church', 'mosque', 'pagoda', 'police station', 'skyscraper', 'factory', 'temple', 'house', 'condo', 'school', 'mall', 'store', 'grocery store'],
  "clothing":['hat', 'gloves', 'scarf', 'glasses', 'earmuffs', 'watch', 'ring', 'bracelet', 'necklace', 'purse', 'earrings', 'headband', 'sunglasses', 'tie', 'beanie', 'umbrella'],
  "accessory":['socks', 'sweater', 'shirt', 't-shirt', 'jacket', 'jeans', 'pants', 'skirt', 'dress', 'coat', 'tracksuit', 'hoodie', 'shorts', 'high heels', 'sneakers', 'swimsuit', 'suit'],
  "job":['fireman', 'policeman', 'scientist', 'engineer', 'nurse', 'doctor', 'musician', 'artist', 'athlete', 'teacher', 'farmer', 'weatherman', 'cashier', 'developer', 'designer', 'lawyer'],
  "board-game":['monopoly', 'jenga', 'connect four', 'risk', 'sorry', 'clue', 'mancala', 'chess', 'checkers', 'operation', 'scrabble', 'battleship', 'uno', 'phase 10'],
  "bird": ['sparrow','hawk','robin','green heron','duck','eagle','egret','crow','owl','finch','goose','swan', 'parakeet', 'parrot', 'raven', 'pigeon', 'penguin', 'hummingbird', 'falcon', 'vulture', 'seagull', 'pelican'],
  "starter-pokemon": 
    ['bulbasaur','ivysaur', 'venusaur', 'charmander', 'charmeleon', 'charizard', 'squirtle', 'wartortle', 'blastoise',
    'chikorita','bayleef', 'meganium', 'cyndaquil', 'quilava', 'typhlosion', 'totodile', 'croconaw', 'feraligatr',
    'treecko','grovyle', 'sceptile', 'torchic', 'combusken', 'blaziken', 'mudkip', 'marshtomp', 'swampert',
    'turtwig','grotle', 'torterra', 'chimchar', 'monferno', 'infernape', 'piplup', 'prinplup', 'empoleon',
    'snivy','servine', 'serperior', 'tepig', 'pignite', 'emboar', 'oshawott', 'dewott', 'samurott',
    'chespin','quilladin', 'chesnaught', 'fennekin', 'braixen', 'delphox', 'froakie', 'frogadier', 'greninja',
    'rowlet','dartrix', 'decidueye', 'litten', 'torracat', 'incineroar', 'popplio', 'brionne', 'primarina',
    'grookey','thwackey', 'rillaboom', 'scorbunny', 'raboot', 'cinderace', 'sobble', 'drizzile', 'inteleon',
    'sprigatito', 'fuecoco', 'quaxly']
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