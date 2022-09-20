#include <ESP8266WiFi.h>

// Set these to run example.
#define WIFI_SSID "Lab"
#define WIFI_PASSWORD "carlitos01"
#define Led D4

void setup() {
  Serial.begin(9600);

  // connect to wifi.
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("connecting");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();
  Serial.print("connected: ");
  Serial.println(WiFi.localIP());

  pinMode(Led, OUTPUT);

}


void loop() {
  leer_rfid();

}
void leer_rfid()
{
}
