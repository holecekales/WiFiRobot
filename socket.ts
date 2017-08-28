// =====================================================================================
// Socket Class
// wraps Websocket with simple reconnect/autoconnect logic
// usage: 
//  socket = new Socket();
//  socket.onOpen = handler1;
//  socket.onClose = handler2;
//  socket.onError = handler3;
//  socket.onMessage = handler3;
//  socket.open("ip.ip.ip.ip") <- or something that resolves to it
// =====================================================================================
class Socket {
  private socket: WebSocket = null;
  private address: string = "";

  // event handler callbacks
  public onOpen: (s: Socket) => void;
  public onClose: () => void;
  public onError: (error) => void;
  public onMessage: (event) => void;

  // constructor
  constructor() { console.log("Socket constructed"); }

  // open - also register all the callbacks
  open(address: string): void {
    console.log("open: ", address);
    if (this.socket === null) {
      this.address = address;
      this.socket = new WebSocket('ws://' + address + ':81/', ['arduino']);
      this.socket.onopen = () => {
        console.log('connection open');
        if (this.onOpen) this.onOpen(this);
      }

      this.socket.onclose = () => {
        console.log('connection close');
        if (this.onClose) this.onClose();
      }

      this.socket.onerror = (error) => {
        console.log('conection error ', error);
        if (this.onError) this.onError(error);
        this.close(true); // are we too aggresive ?
      }

      this.socket.onmessage = (e) => {
        console.log('RCV: ', e.data);
        if (this.onMessage) this.onMessage(e.data);
      }
    }
  }

  // close
  close(reconnect: boolean): void {
    console.log("close: ", this.address);
    if (this.socket != null) {
      this.socket.close();
      this.socket = null;
      if (reconnect) {
        // setup the reconnect
        setTimeout(() => this.open(this.address), 3000);
      }
    }
  }

  // send
  send(msg: string): void {
    console.log('SND: ', msg);
    if (this.socket)
      this.socket.send(msg);
  }
} // class Socket
