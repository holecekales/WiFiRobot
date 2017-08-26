var arduinoIP = '10.0.0.118';
var connection = null;

// ----------------------------------------------------
function $(name): HTMLElement {
  // return document.getElementById(id);
  return document.querySelector(name);
}

function dd(s) { return s.length < 2 ? '0' + s : s; }

// ----------------------------------------------------
// messages from server get handled here
// ----------------------------------------------------
function handleMessage(msg) {
  $("#time").innerHTML = msg;
}

// ----------------------------------------------------
function LED_onoff() {
  var state = $("#onoff").innerText;
  if (state == "On") {
    setRGB(255, 255, 255);
    $("#onoff").innerText = "Off"
  }
  else {
    setRGB(0, 0, 0);
    $("#onoff").innerText = "On"
  }
}


// ----------------------------------------------------
function connectSocket() {
  if (connection === null) {
    connection = new WebSocket('ws://' + arduinoIP + ':81/', ['arduino']);
    connection.onopen = function () {

      // initalize the applications
      // set time on the arduino
      var d = new Date();
      connection.send('!T' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + '@' + (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear());

      // turn on the LED
      sendRGB();
      setState(true);

      // set up the timer that will query the server
      console.log("Registring new timer")
      var timerHandle = setInterval(function () {
        connection.send('?T');
      }, 1000);
    }
  };
  connection.onerror = function (error) {
    console.log('WebSocket Error ', error);
    $("#time").innerHTML = 'WebSocket Error';
    setState(false);
  };
  connection.onmessage = function (e) {
    console.log('Server: ', e.data);

    handleMessage(e.data);
  };
}

// ----------------------------------------------------

function setRGB(r, g, b) {
  (<HTMLInputElement>$('#r')).value = r;
  (<HTMLInputElement>$('#g')).value = g;
  (<HTMLInputElement>$('#b')).value = b;
  sendRGB();
}

// ----------------------------------------------------
function sendRGB() {
  var r = parseInt((<HTMLInputElement>$('#r')).value);
  var g = parseInt((<HTMLInputElement>$('#g')).value);
  var b = parseInt((<HTMLInputElement>$('#b')).value);

  if (r == 0 && g == 0 && b == 0)
    $('#onoff').innerText = "On";
  else
    $('#onoff').innerText = "Off";

  // make it command and hash
  var rgb = '!#' + dd(r.toString(16)) + dd(g.toString(16)) + dd(b.toString(16));
  console.log('RGB: ' + rgb);
  connection.send(rgb);
}

// ----------------------------------------------------
function setState(isError) {
  var elem = $('#time');
  elem.classList.toggle('okstate', isError);
  elem.classList.toggle('errorstate', !isError);
}

(function () {
  document.addEventListener("DOMContentLoaded", function () {
    connectSocket();
  });
})();

// ----------------------------------------------------
function testFunction() {
}