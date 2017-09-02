/// <reference path="socket.ts"/>

var arduinoIP = '10.0.0.118';


// ----------------------------------------------------
function $(name): HTMLElement {
  return document.querySelector(name);
}

function dd(s) { return s.length < 2 ? '0' + s : s; }

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
function setRGB(r: number, g: number, b: number) {
  (<HTMLInputElement>$('#r')).value = r.toString();
  (<HTMLInputElement>$('#g')).value = g.toString();
  (<HTMLInputElement>$('#b')).value = b.toString();
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
  socket.send(rgb);
}

// ----------------------------------------------------
function setState(isError) {
  var elem = $('#time');
  elem.classList.toggle('okstate', isError);
  elem.classList.toggle('errorstate', !isError);
}

// =====================================================================================
// Event Handlers
// =====================================================================================

var queryTimeHandle : number = -1;

function onOpenHandler(s: Socket): void {
  $("#time").innerHTML = "Connected";
  let d = new Date();
  s.send('!T' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + '@' + (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear());
  setState(true);
  setRGB(128, 128, 128);
  if (0) {
    console.log("Registring ?T Timer")
    queryTimeHandle = setInterval(function () {
      socket.send('?T');
    }, 1000);
  }
}

function onCloseHandler(): void {
  $("#time").innerHTML = "Disconnected";
  // if periodic query has been set - remove it
  if(queryTimeHandle != -1) {
    console.log("Clearing ?T Timer")
    clearInterval(queryTimeHandle);
    queryTimeHandle = -1;
  }
}

function onErrorHandler(error): void {
  $("#time").innerHTML = "Error";
  setState(false);
}

function onEvent(msg: string): void {
  console.log(msg);
  $("#time").innerHTML = msg;
}

// =====================================================================================
// Globals and stuff
// =====================================================================================
var socket = new Socket();

socket.onOpen = onOpenHandler;
socket.onClose = onCloseHandler;
socket.onError = onErrorHandler;
socket.onMessage = onEvent;

(function () {
  document.addEventListener("DOMContentLoaded", function () {
    socket.open(arduinoIP);
  });
})();

