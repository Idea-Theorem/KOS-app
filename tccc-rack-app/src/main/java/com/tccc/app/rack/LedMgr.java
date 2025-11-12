/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */
package com.tccc.app.rack;

import com.tccc.kos.core.service.spawn.Adapter;
import com.tccc.kos.core.service.udev.UdevDevice;
import com.tccc.kos.core.service.udev.UdevDeviceOwner;
import com.tccc.kos.core.service.udev.serial.SerialAdapterFactory;
import com.tccc.kos.core.service.udev.serial.SerialDevice;
import java.nio.charset.StandardCharsets;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class LedMgr extends SerialAdapterFactory implements UdevDeviceOwner {
    private SerialDevice serial;   // esp32 serial connection
    private String color;             // the current color for the leds

    /**
     * Set the led color
     */
    public void setLedColor(String color) {
        log.warn("We are inside manager");
        log.warn("LED color hex: {}", color);
        // remember the new color
        this.color = color;

        // if we're connected to the esp32, send the color
        if (serial != null) {
            // send the color information to the esp32
            log.warn("Setting leds to color : {}", color);
            try {
            // Example protocol: send “COLOR RRGGBB\n”
            // String hex = String.format("%06X", color & 0xFFFFFF);
            String cmd =  color + "\n";
            byte[] buf = cmd.getBytes(StandardCharsets.UTF_8);
            serial.write(buf);
            log.warn("If we got here, that should be fine : {}", buf);
            } catch(Exception ex) {
                log.warn("Failed to set led color: {}", color);
            }
        } else {
            log.warn("Not connected to esp32, but cannot set led color");
        }
    }

    @Override
    public Adapter matchDevice(SerialDevice device) {
      log.warn("LedMgr.matchDevice called: VID={} PID={} path={}", 
        device.getVendorId(), device.getProductId(), device.getDevicePath());
        // check for the vid/pid of the esp32
        if ((device.getVendorId() == 6790) && (device.getProductId() == 21971)) {
            // claim the serial device so we own it and get notified when it's disconnected
            log.warn("Connecting to esp32");
            device.claimDevice(this);

            try {
                // open the serial port so it's ready for use
                device.open(115200);

                // this is now the active serial device
                serial = device;

                // send the current led color so the led's reflect what is supposed to be showing
                setLedColor(color);
            } catch(Exception ex) {
                log.error("Failed to open serial port");
            }
        }
        return null;
    }

    @Override
    public void onOwnedDeviceRemove(UdevDevice device) {
        // called when the serial device is unplugged
        log.info("Disconnected from esp32");
        serial = null;
    }
}