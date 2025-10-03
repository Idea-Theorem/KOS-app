/**
 * (C) Copyright 2025, TCCC, All rights reserved.
 */
package com.tccc.app.rack;

import java.util.Collection;
import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;
import com.tccc.app.rack.RackApp.Content;
import com.tccc.kos.commons.core.context.annotations.Autowired;
import com.tccc.kos.commons.core.dispatcher.annotations.ApiController;
import com.tccc.kos.commons.core.dispatcher.annotations.ApiEndpoint;
import com.tccc.kos.commons.core.dispatcher.annotations.ApiEndpoint.Param;
import com.tccc.kos.commons.core.dispatcher.annotations.PathVariable;

import lombok.extern.slf4j.Slf4j;

/**
 * Controller for rack app.
 *
 * @author
 * @version 2025-01-06
 */
@Slf4j
@ApiController(
    base = "/",
    title = "Rack app controller",
    desc = "Access to rack endpoints."
)
public final class RackController {

    @Autowired
    private RackApp app;

    @ApiEndpoint(GET = "/content", desc = "Return all the content information.")
    public Collection<Content> getContentList() {
        return app.getContentList();
    }

    @ApiEndpoint(POST = "/leds/{color}", desc = "Set the led color to the specified rgb value.",
            params = @Param(name = "color", desc = "The hex rgb color without the leading '#' character."))
    public void setLedColor(@PathVariable("color") String color) {
        app.setLedColor(color);
    }

    // 🧩 NEW ENDPOINT — exposes descriptor.json layout from RackAppConfig
    @ApiEndpoint(GET = "/layout", desc = "Return the layout section from descriptor.json")
    public JsonNode getLayoutConfig() {
        try {
            JsonNode layout = app.getConfig().getLayout();
            if (layout != null) {
                log.info("Returning layout config: {}", layout.toPrettyString());
                return layout;
            } else {
                log.warn("Layout config not found in descriptor.json");
                return null;
            }
        } catch (Exception e) {
            log.error("Failed to load layout config", e);
            return null;
        }
    }
}