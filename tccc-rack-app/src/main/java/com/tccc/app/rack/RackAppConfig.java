/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */
package com.tccc.app.rack;

import com.tccc.kos.commons.core.service.config.annotations.ConfigDesc;
import com.tccc.kos.core.service.app.BaseAppConfig;

import lombok.Getter;
import lombok.Setter;

/**
 * Config bean for rack app.
 *
 * @author David Vogt (david@kondra.com)
 * @version 2025-01-06
 */
@Getter
@Setter
public class RackAppConfig extends BaseAppConfig {
    /**
     * Enum for NS type
     */
    public static enum LogLevel {
        DEBUG,
        INFO,
        WARN,
        ERROR
    }

    @ConfigDesc("To enabled testing by ignoring end dates to allow all videos to be played")
    private boolean ignoreEndDates = false;

    @ConfigDesc("Display debug video overlay data")
    private boolean displayOverlay = false;

    @ConfigDesc("Display bundle overlay data")
    private boolean displayBundleOverlay = false;

    @ConfigDesc("Display reference test data")
    private boolean displayReferenceOverlay = false;

    @ConfigDesc("The maximum duration in seconds to play a video")
    private int maxVideoDurationSec = -1;

    @ConfigDesc("Set the UI app log level")
    private LogLevel logLevel = LogLevel.WARN;

    @ConfigDesc("Url to use when changing led color.")
    private String ledUrl = "http://localhost:17587/config/digitalLedStrip";
}
