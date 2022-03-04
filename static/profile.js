$(window).on('load', () => setUp())

// <!-- Treat as form validation problem, use ajax to send update onchange,
// maybe lodash-debounce or javascript debounce to only send after a 100 ms without change,
// allow submit after we know it's good -->

//https://www.freecodecamp.org/news/javascript-debounce-example/
//https://codepen.io/ondrabus/pen/WNGaVZN
function debounce(func, timeout = 100){
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}
const processChange = debounce(() => validateUsername())

function validateUsername(){
    let newUsername = $('#username').val();
    $.get(window.location.origin+'/user/'+newUsername)
        .done(() => {
            alert("Username in use already")
        })
        .fail(() => {
            //You're all good, display green
        });
}

function setUp(){
    // $('#username').click(editUsername);
    $('#editUsernameBtn').click(editUsername);
}

function editUsername(){
    let oldUser = $('#username').text();
    $('#username').replaceWith($(`<input type='text' id='username' 
      value='${$('#username').text()}'>`));
    $('#username').change(processChange).keypress(function (e) {
        if (e.which == 13){ //Submit when pressing enter
            saveUsername(oldUser);
            return false;
        }
    })
    $('#editUsernameBtn').text("Save username").off('click').click(() => saveUsername(oldUser));
}

function saveUsername(oldUser){
    let newUsername = $('#username').val();
    $.post(window.location.pathname, {"username": newUsername})
        .done( (msg) => window.location.href = "/user/"+newUsername)
        .fail( (xhr, status, error) => {
            $('#username').replaceWith(`<span id="username">${oldUser}</span>`)
            $('#editUsernameBtn').text("Edit username").off('click').click(editUsername);
    });
}