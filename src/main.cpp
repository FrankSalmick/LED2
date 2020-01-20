#include <Arduino.h>
#include <ESP8266WiFi.h>
#include "WebSocketClient.h"
#include <ArduinoJson.h>
#define LED 2 // blue onboard led
#define ON LOW
#define OFF HIGH
const char *ssid = "WSU ResNet Guest Aruba";
// WiFiServer server(80);
WebSocketClient ws(false);
StaticJsonDocument<8> message;

void blinkLED(int time) {
    digitalWrite(LED, OFF);
    delay(time);
    digitalWrite(LED, ON);
}

void setup() {
    pinMode(LED, OUTPUT);
    Serial.begin(9600);
    delay(10);
    WiFi.begin(ssid);

    Serial.println("Connecting to wifi.");
    digitalWrite(LED, ON);
    for (int i = 0; WiFi.status() != WL_CONNECTED; i++) {
        delay(1000);
        Serial.printf("\r    \r%d", i);
    }

    Serial.println("\nConnected. IP: ");
    Serial.println(WiFi.localIP());

    blinkLED(150);
    ws.connect("ws://files.salmick.com", "/", 8081);
    blinkLED(150);
    message.clear();
    message["action"] = "register";
    message["name"] = WiFi.macAddress();
    serializeJson(ws);
}

void loop() {
    if (WiFi.status() != WL_CONNECTED) {
        digitalWrite(LED, ON);
        WiFi.reconnect();
    }
    else if (!ws.isConnected()) {
        digitalWrite(LED, ON);
        ws.connect("ws://files.salmick.com", "/", 8081);
    }
    else {
        digitalWrite(LED, OFF);
        message.clear();
        message["
        ws.send(
    }
    delay(1000);
}