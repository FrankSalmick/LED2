#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ArduinoWebsockets.h>
#define LED 2 // blue onboard led
#define ON LOW
#define OFF HIGH
const char *ssid = "WSU ResNet Guest Aruba";
const char* websockets_server_host = "files.salmick.com"; //Enter server adress
const uint16_t websockets_server_port = 8081; // Enter server port
using namespace websockets;
WebsocketsClient ws;

void registerWithSocket();
void onEventsCallback(WebsocketsEvent event, String data) {
    if(event == WebsocketsEvent::ConnectionOpened) {
        Serial.println("Connnection Opened");
    } else if(event == WebsocketsEvent::ConnectionClosed) {
        digitalWrite(LED, ON);
        ws.end();
        registerWithSocket();
        digitalWrite(LED, OFF);
    }
}

void connectToWifi() {
    wifiStart:
    Serial.print("Connecting to wifi as ");
    Serial.println(WiFi.macAddress());
    digitalWrite(LED, ON);
    WiFi.begin(ssid);
    for (int i = 0; WiFi.status() != WL_CONNECTED; i++) {
        Serial.printf("\r    \r%d", i);
        if (i >= 30) {
            Serial.println(" Could not connect to wifi. Retrying.");
            WiFi.disconnect();
            // There's too little ram to do a recursive call here so we're just going to use a goto instead.
            goto wifiStart;
        }
        delay(1000);
    }
    Serial.println();
    Serial.println("Connected. IP: ");
    Serial.println(WiFi.localIP());
}

void onMessageCallback(WebsocketsMessage message) {
    Serial.print("Got Message: ");
    Serial.println(message.data());
}

void registerWithSocket() {
    digitalWrite(LED, ON);
    registerStart:
    if (WiFi.status() != WL_CONNECTED) {
        connectToWifi();
    }
    Serial.println("Connecting to websocket");
    ws.connect(websockets_server_host, websockets_server_port, "/");
    for (int count = 0; !ws.available(); count++) {
        Serial.printf("\r     \r%d", count);
        delay(1000);
        if (count >= 30) { // Give up after 30 seconds, and try connecting again
            Serial.println(" - Failed to connect to the ws. Retrying.");
            // There's too little ram to do a recursive call here so we're just going to use a goto instead.
            goto registerStart;
        }
    }
    digitalWrite(LED, OFF);

    // run callback when messages are received
    ws.onMessage(onMessageCallback);
    
    // run callback when events are occuring
    ws.onEvent(onEventsCallback);
    ws.send("register," + WiFi.macAddress());
    Serial.println("Registered with server.");
}

void setup() {
    pinMode(LED, OUTPUT);
    Serial.begin(9600);
    delay(10);
    connectToWifi();

    // Connect to server

    registerWithSocket();
    digitalWrite(LED, OFF);
}

void loop() {
    ws.poll();
    delay(1000);
}