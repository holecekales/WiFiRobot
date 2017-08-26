#include <Arduino.h>
#include <TimeLib.h>

#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>

#include <WebSocketsServer.h>

// #include <Hash.h>

#define LED_RED 14      // D5
#define LED_GREEN 12    // D6
#define LED_BLUE 13     // D7

ESP8266WiFiMulti WiFiMulti;

const char *ssid = "Holecek_home";
const char *password = "blue1234";

WebSocketsServer webSocket = WebSocketsServer(81);

#define USE_SERIAL Serial

#define BUFF_SIZE 20
char msgBuffer[BUFF_SIZE];

int msgCount = 0;

// =====================================================================
//  string utils
// =====================================================================
inline boolean isspacechar(char c)
{
    return ((c == ' ') || (c == '\r') || (c == '\n') || (c == '\t') || (c == 0));
}

// ----------------------------------------------
char *skipspace(char *str, int *idx = NULL)
{
    int i = 0;
    while (isspacechar(*str) && *str)
    {
        str++;
        i++;
    }
    if (idx)
        *idx = i;
    return str;
}

// ----------------------------------------------
boolean atoi(char *str, int *value, char **endstr)
{
    str = skipspace(str);
    int curval = 0;
    boolean retval = false;
    int mulval = 1;
    while (*str && (!isspacechar(*str)))
    {
        if ((*str >= '0') && (*str <= '9'))
        {
            curval *= 10;
            curval += *str - '0';
            retval = true;
        }
        else if (*str == '-' && retval == false)
        {
            mulval = -1;
        }
        else if (*str == '+' && retval == false)
        {
            //nothing
        }
        else
        {
            if (endstr == NULL)
                retval = false;
            break;
        }
        str++;
    }

    if (value)
        *value = curval * mulval;
    if (endstr)
        *endstr = str;
    return retval;
}

// ----------------------------------------------
void processCommand(uint8_t *payload, size_t length)
{

    switch (payload[0])
    {
    case '#':
    {
        // decode rgb data
        uint32_t rgb = (uint32_t)strtol((const char *)&payload[1], NULL, 16);
        analogWrite(LED_RED, ((rgb >> 16) & 0xFF));
        analogWrite(LED_GREEN, ((rgb >> 8) & 0xFF));
        USE_SERIAL.println((rgb >> 8) & 0xFF);
        analogWrite(LED_BLUE, ((rgb >> 0) & 0xFF));
    }
    break;

    case 'T': // Set Time
    {
        // not very defensive - assumes null temination
        // assumes format 00:00:00@mm/dd/yyyy
        int h = 0, m = 0, s = 0, dd = 0, mm = 0, yy = 0;
        atoi((char *)payload + 1, &h, (char **)&payload);
        atoi((char *)payload + 1, &m, (char **)&payload);
        atoi((char *)payload + 1, &s, (char **)&payload);
        atoi((char *)payload + 1, &mm, (char **)&payload);
        atoi((char *)payload + 1, &dd, (char **)&payload);
        atoi((char *)payload + 1, &yy, (char **)&payload);
        USE_SERIAL.printf("%02d:%02d:%02d\n", h, m, s);
        USE_SERIAL.printf("%02d/%02d/%02d\n", mm, dd, yy);
        setTime(h, m, s, dd, mm, yy);
    }
    break;

    default:
    {
        USE_SERIAL.print("!Error: ");
        USE_SERIAL.println((char *)payload);
    }
    }
    // command to set some color/intensity
}

// ----------------------------------------------
void processQuery(uint8_t *payload, size_t length)
{
    switch (payload[0])
    {
    case 'T': // query for time
    {
        time_t t = now(); // probably cheaper way to do this :)
        snprintf(msgBuffer, BUFF_SIZE, "%02d:%02d:%02d", hour(t), minute(t), second(t));
    }
    break;
    case 'C': // query for some counter
    {
        ::snprintf(msgBuffer, BUFF_SIZE, "!%d", msgCount++);
    }
    break;
    default:
        ::snprintf(msgBuffer, BUFF_SIZE, "?Error");
    }
}

// ----------------------------------------------
void webSocketEvent(uint8_t num, WStype_t type, uint8_t *payload, size_t length)
{

    switch (type)
    {
    case WStype_DISCONNECTED:
        USE_SERIAL.printf("[%u] Disconnected!\n", num);
        break;
    case WStype_CONNECTED:
    {
        IPAddress ip = webSocket.remoteIP(num);
        USE_SERIAL.printf("[%u] Connected from %d.%d.%d.%d url: %s\n", num, ip[0], ip[1], ip[2], ip[3], payload);
        // send message to client
        webSocket.sendTXT(num, "Connected");
    }
    break;
    case WStype_TEXT:
        // echo to serial (if enabled)
        USE_SERIAL.printf("[%u] get Text: %s\n", num, payload);
        if (length > 1)
        {
            if (payload[0] == '!')
            { // it is a command
                processCommand(payload + 1, length - 1);
            }
            else if (payload[0] == '?')
            { // it is a query
                processQuery(payload + 1, length - 1);
                // send answer back to the client
                webSocket.sendTXT(num, msgBuffer);
            }
        }
        break;

    case WStype_BIN:
        USE_SERIAL.printf("[%u] get binary length: %u\n", num, length);
        hexdump(payload, length);

        // send message to client
        // webSocket.sendBIN(num, payload, length);
        break;
    }
}

// ----------------------------------------------
void setup()
{
    // USE_SERIAL.begin(921600);
    USE_SERIAL.begin(115200);
    USE_SERIAL.setDebugOutput(false);

    pinMode(LED_RED, OUTPUT);
    pinMode(LED_GREEN, OUTPUT);
    pinMode(LED_BLUE, OUTPUT);

    digitalWrite(LED_RED, 1);
    digitalWrite(LED_GREEN, 1);
    digitalWrite(LED_BLUE, 1);

    WiFiMulti.addAP(ssid, password);

    while (WiFiMulti.run() != WL_CONNECTED)
    {
        delay(100);
    }

    webSocket.begin();
    webSocket.onEvent(webSocketEvent);
}

// ----------------------------------------------
void loop()
{
    webSocket.loop();
}
