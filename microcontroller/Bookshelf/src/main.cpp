#include <Arduino.h>
#include <FastLED.h>
#include <ESP8266WiFi.h>
#include <ESP8266mDNS.h>
#include <WiFiUdp.h>
#include <ArduinoOTA.h>
#include <asyncHTTPrequest.h>
#include <Ticker.h>

#ifndef STASSID
#define STASSID "Anyamei Studios"
#define STAPSK "RavenZoeyWombat"
#endif

#define CONTROL_IP "Riley-MacBook-Pro.local:10000"

#define DATA_PIN_1 14
#define DATA_PIN_2 12
#define DATA_PIN_3 13

#define STRIP_1_SIZE 64
#define STRIP_2_SIZE 54
#define STRIP_3_SIZE 87

const int sizes[] = {STRIP_1_SIZE, STRIP_2_SIZE, STRIP_3_SIZE};

CRGB strip1[STRIP_1_SIZE * 5];
CRGB strip2[STRIP_2_SIZE * 5];
CRGB strip3[STRIP_3_SIZE];

const char *ssid = STASSID;
const char *password = STAPSK;

uint64_t counter = 0;

asyncHTTPrequest request;
Ticker ticker;
bool hasDisconnected = false;

enum modes {
  MODE_DEFAULT       = 0,
  MODE_STATIC        = 1,
  MODE_SAVE_LAST     = 2,
  MODE_LIVE_UPDATE   = 3,
  MODE_RANDOM        = 4,
  MODE_PONG          = 5,
  MODE_MATRIX        = 6,
  MODE_RAINBOW       = 7,
  MODE_RANDOM_MODE   = 8
};

CRGB gColor = CRGB::White;
modes gMode = MODE_RAINBOW;
uint8_t gBrightness = 128;
uint16_t gDuration = 25;
uint8_t gDelay = 30;

struct RequestHeader {
    uint8_t mode;
    uint8_t brightness;
    uint8_t green;
    uint8_t red;
    uint8_t blue;
    uint16_t duration;
    uint16_t size;
    uint8_t delay;
    uint8_t res2;
    uint8_t res3;
    uint8_t res4;
    uint8_t res5;
    uint8_t res6;
    uint8_t res7;
};

void initOTAUpdates()
{
  // Port defaults to 8266
  // ArduinoOTA.setPort(8266);

  // Hostname defaults to esp8266-[ChipID]
  ArduinoOTA.setHostname("bookshelf-esp8266");

  // No authentication by default
  // ArduinoOTA.setPassword("admin");

  // Password can be set with it"s md5 value as well
  // MD5(admin) = 21232f297a57a5a743894a0e4a801fc3
  ArduinoOTA.setPasswordHash("482c811da5d5b4bc6d497ffa98491e38");

  ArduinoOTA.onStart([]()
                     {
                       String type;
                       if (ArduinoOTA.getCommand() == U_FLASH)
                       {
                         type = "sketch";
                       }
                       else
                       { // U_FS
                         type = "filesystem";
                       }

                       // NOTE: if updating FS this would be the place to unmount FS using FS.end()
                       Serial.println("OTA Start updating " + type);
                     });

  ArduinoOTA.onEnd([]()
                   {
                     Serial.println("\nOTA End");
                     for (int flashes = 0; flashes < 10; flashes++)
                     {
                       digitalWrite(LED_BUILTIN, LOW);
                       delay(50);
                       digitalWrite(LED_BUILTIN, HIGH);
                       delay(50);
                     }
                   });

  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total)
                        { Serial.printf("OTA Progress: %u%%\r", (progress / (total / 100))); });

  ArduinoOTA.onError([](ota_error_t error)
                     {
                       Serial.printf("Error[%u]: ", error);
                       if (error == OTA_AUTH_ERROR)
                       {
                         Serial.println("OTA Auth Failed");
                       }
                       else if (error == OTA_BEGIN_ERROR)
                       {
                         Serial.println("OTA Begin Failed");
                       }
                       else if (error == OTA_CONNECT_ERROR)
                       {
                         Serial.println("OTA Connect Failed");
                       }
                       else if (error == OTA_RECEIVE_ERROR)
                       {
                         Serial.println("OTA Receive Failed");
                       }
                       else if (error == OTA_END_ERROR)
                       {
                         Serial.println("OTA End Failed");
                       }
                     });

  ArduinoOTA.begin();
}


int lerp(int val, int fromMin, int fromMax, int toMin, int toMax) {
  return ((float)(val - fromMin) / (float)(fromMax - fromMin))
          * (toMax - toMin) + toMin;
}

void pingPong() {
  
  int dot = abs((int)(((counter) + gDuration) % (gDuration * 2) - gDuration));


  fill_solid(strip1, STRIP_1_SIZE * 5, CRGB::Black);
  fill_solid(strip2, STRIP_2_SIZE * 5, CRGB::Black);
  fill_solid(strip3, STRIP_3_SIZE,     CRGB::Black);

  for(int s = 0; s < 2; s++) {
    for (int row = 0; row < 5; row++) {
      if(row % 2 == 0) {
        int idx = lerp(dot, 0, gDuration, sizes[s], 0);
        FastLED[s][(row * sizes[s]) + idx] = gColor;
      } else {
        int idx = lerp(dot, 0, gDuration, 0, sizes[s]);
        FastLED[s][(row * sizes[s]) + idx] = gColor;
      }
    }
  }

  int idx1 = lerp(dot, 0, gDuration, STRIP_3_SIZE, 0);
  FastLED[2][idx1] = gColor;
  int idx2 = lerp(dot, 0, gDuration, 0, STRIP_3_SIZE);
  FastLED[2][idx2] = gColor;

  FastLED[0].showLeds(gBrightness);
  FastLED[1].showLeds(gBrightness);
  FastLED[2].showLeds(gBrightness);
}

void rainbow() {
  
  fill_rainbow(strip1, STRIP_1_SIZE * 5, (int)(counter / gDuration) % 255, 0);
  fill_rainbow(strip2, STRIP_2_SIZE * 5, (int)(counter / gDuration) % 255, 0);
  fill_rainbow(strip3, STRIP_3_SIZE,     (int)(counter / gDuration) % 255, 0);

  FastLED[0].showLeds(gBrightness);
  FastLED[1].showLeds(gBrightness);
  FastLED[2].showLeds(gBrightness);
}

void sendRequest()
{
  if (request.readyState() == 0 || request.readyState() == 4)
  {
    Serial.println("send request called");
    request.open("GET", CONTROL_IP);
    request.setReqHeader("x-stream", "polling");
    request.setReqHeader("x-device-id", "bookshelf-esp8266");
    request.send();
  }
}

void setFromPayload(uint8_t *buf, size_t size)
{
  size_t current = 0;

  Serial.println("size " + size );

  while(current < size) {

    RequestHeader h;
    h.mode       = buf[0];
    h.brightness = buf[1];
    h.green      = buf[2];
    h.red        = buf[3];
    h.blue       = buf[4];
    h.duration   = (buf[5] << 8) | buf[6];
    h.size       = (buf[7] << 8) | buf[8];
    h.delay      = buf[9];
    h.res2       = buf[10];
    h.res3       = buf[11];
    h.res4       = buf[12];
    h.res5       = buf[13];
    h.res6       = buf[14];
    h.res7       = buf[15];
    
    Serial.println("header recieved " + h.size);
    char str[300];
  
    sprintf(str, "mode %d\nbrightness %d\ngreen %d\nred %d\nblue %d\nduration %d\nsize %d\ndelay %d \n", h.mode, h.brightness, h.green, h.red, h.blue, h.duration, h.size, h.delay);
    Serial.println(str);

    gBrightness  = h.brightness;
    gMode        = (modes)h.mode;
    gDelay       = (modes)h.delay;

    gColor.red   = h.red;
    gColor.green = h.green;
    gColor.blue  = h.blue;

    gDuration = h.duration;

    current += 16;
  
    if(h.size != current) { // Allow for header only payloads
      int s1Bytes = sizeof(uint8_t) * STRIP_1_SIZE * 5 * 3;
      int s2Bytes = sizeof(uint8_t) * STRIP_2_SIZE * 5 * 3;
      int s3Bytes = sizeof(uint8_t) * STRIP_3_SIZE * 3;

      memcpy(&strip1, &buf[16],                     s1Bytes);
      memcpy(&strip2, &buf[16 + s1Bytes],           s2Bytes);
      memcpy(&strip3, &buf[16 + s1Bytes + s2Bytes], s3Bytes);

      current += s1Bytes + s2Bytes + s3Bytes;
      char str[80];
      sprintf(str, "Current is %u, expected %u, total %u", current, h.size, size);
      Serial.println(str);

      Serial.println("Showing leds");
      FastLED.show();
    }

  }
}

void dataCB(void *optParm, asyncHTTPrequest *request, int size)
{
  if (request->readyState() == asyncHTTPrequest::readyStateDone)
  {
    Serial.println("reading buffer");
    // Serial.println(request->responseText());

    uint8_t buf[size];
    request->responseRead(buf, size);
    setFromPayload(buf, size);

    sendRequest();
  }
}

void disconnectCB(void *optParm, asyncHTTPrequest *request)
{
  Serial.print("Disconnected: ");

  switch (request->responseHTTPcode())
  {
    case HTTPCODE_CONNECTION_REFUSED:
      Serial.println("HTTPCODE_CONNECTION_REFUSED");
      break;
    case HTTPCODE_SEND_HEADER_FAILED:
      Serial.println("HTTPCODE_SEND_HEADER_FAILED");
      break;
    case HTTPCODE_SEND_PAYLOAD_FAILED:
      Serial.println("HTTPCODE_SEND_PAYLOAD_FAILED");
      break;
    case HTTPCODE_NOT_CONNECTED:
      Serial.println("HTTPCODE_NOT_CONNECTED");
      break;
    case HTTPCODE_CONNECTION_LOST:
      Serial.println("HTTPCODE_CONNECTION_LOST");
      break;
    case HTTPCODE_NO_STREAM:
      Serial.println("HTTPCODE_NO_STREAM");
      break;
    case HTTPCODE_NO_HTTP_SERVER:
      Serial.println("HTTPCODE_NO_HTTP_SERVER");
      break;
    case HTTPCODE_TOO_LESS_RAM:
      Serial.println("HTTPCODE_TOO_LESS_RAM");
      break;
    case HTTPCODE_ENCODING:
      Serial.println("HTTPCODE_ENCODING");
      break;
    case HTTPCODE_STREAM_WRITE:
      Serial.println("HTTPCODE_STREAM_WRITE");
      break;
    case HTTPCODE_TIMEOUT:
      Serial.println("HTTPCODE_TIMEOUT");
      break;

    default:
      break;
  }
  
  hasDisconnected = true;
}

void setupServer()
{
  // request.setDebug(true);
  // request.onReadyStateChange(requestCB);
  request.onDisconnect(disconnectCB);
  request.onData(dataCB);
  sendRequest();
}

void checkRequest() {
  if(hasDisconnected && request.readyState() == asyncHTTPrequest::readyStateDone) {
    Serial.println("Disconnected, starting new request cycle");
    hasDisconnected = false;
    sendRequest();
  }
}

void setup()
{
  Serial.begin(115200);

  Serial.println("Booting");

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.waitForConnectResult() != WL_CONNECTED)
  {
    Serial.println("Connection Failed! Rebooting...");
    delay(5000);
    ESP.restart();
  }

  initOTAUpdates();

  FastLED.addLeds<WS2812B, DATA_PIN_1, GRB>(strip1, STRIP_1_SIZE * 5); // GRB ordering
  FastLED.addLeds<WS2812B, DATA_PIN_2, GRB>(strip2, STRIP_2_SIZE * 5); // GRB ordering
  FastLED.addLeds<WS2812B, DATA_PIN_3, GRB>(strip3, STRIP_3_SIZE);     // GRB ordering

  pinMode(LED_BUILTIN, OUTPUT);

  Serial.println("Ready");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  setupServer();
  ticker.attach(5, checkRequest);

}

void loop()
{
  ArduinoOTA.handle();

  switch (gMode)
  {
    case MODE_PONG:
      pingPong();
    break;
    case MODE_RAINBOW:
      rainbow();
    break;
    case MODE_STATIC:
      fill_solid(strip1, STRIP_1_SIZE * 5, gColor);
      fill_solid(strip2, STRIP_2_SIZE * 5, gColor);
      fill_solid(strip3, STRIP_3_SIZE,     gColor);
          
      FastLED[0].showLeds(gBrightness);
      FastLED[1].showLeds(gBrightness);
      FastLED[2].showLeds(gBrightness);
    break;

    default:
    break;
  }

  delay(gDelay);
  counter++;
}

