/**
 * (C) Copyright 2025, TCCC, All rights reserved.
 */
package com.tccc.app.rack;

import java.util.Collection;

import com.tccc.app.rack.RackApp.Content;
import com.tccc.kos.commons.core.context.annotations.Autowired;
import com.tccc.kos.commons.core.dispatcher.annotations.ApiController;
import com.tccc.kos.commons.core.dispatcher.annotations.ApiEndpoint;
import com.tccc.kos.commons.core.dispatcher.annotations.ApiEndpoint.Param;
import com.tccc.kos.commons.core.dispatcher.annotations.PathVariable;

/**
 * Controller for rack app.
 *
 * @author David Vogt (david@kondra.com)
 * @version 2025-01-06
 */
@ApiController(base = "/",
        title = "Rack app controller",
        desc = "Access to rack endpoints.")
public final class RackController {
    @Autowired
    private RackApp app;

    @ApiEndpoint(GET="/content", desc="Return all the content information.")
    public Collection<Content> getContentList() {
        return app.getContentList();
    }

    @ApiEndpoint(POST="/leds/{color}", desc="Set the led color to the specified rgb value.",
            params = @Param(name="color", desc="The hex rgb color without the leading '#' character."))
    public void setLedColor(@PathVariable("color") String color) {
        app.setLedColor(color);
    }
}
