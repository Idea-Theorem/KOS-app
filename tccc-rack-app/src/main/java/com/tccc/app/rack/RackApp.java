/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */
package com.tccc.app.rack;

import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.io.InputStream;

import org.eclipse.jetty.client.HttpClient;
import org.eclipse.jetty.client.util.StringRequestContent;
import org.eclipse.jetty.http.HttpMethod;

import com.fasterxml.jackson.databind.JsonNode;
import com.tccc.kos.commons.core.context.annotations.Autowired;
import com.tccc.kos.commons.core.vfs.VFSSource;
import com.tccc.kos.commons.kab.KabFile;
import com.tccc.kos.commons.util.KosUtil;
import com.tccc.kos.core.manifest.ResolvedManifestSection;
import com.tccc.kos.core.service.app.SystemApplication;
import com.tccc.kos.core.service.browser.BrowserService;
import com.tccc.kos.core.service.device.DeviceService;
import com.tccc.kos.core.service.device.serialnum.criticaldata.CriticalDataSerialNumberProvider;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

/**
 * System application for Coke digital rack.
 *
 * @author 
 * @version 2025-01-06
 */
@Slf4j
public class RackApp extends SystemApplication<RackAppConfig> {

    // kab type for the ui
    private static final String UI_KAB_TYPE = "tccc.rack.ui";

    // section that contains mfg content
    private static final String SECTION_MFG_CONTENT = "mfg.content";

    // sections that contain OTA content
    private static final String OTA_CONTENT_PREFIX = "content.";

    @Autowired
    private BrowserService browserService;
    @Autowired
    private DeviceService deviceService;
    @Autowired
    private HttpClient httpClient;
    private VFSSource uiVfsSource;
    @Getter
    private List<Content> contentList;

    /**
     * Custom provider subclass to handle initialization once CriticalData is available
     */
    public static class RackSerialProvider extends CriticalDataSerialNumberProvider {
        @Override
        public void onCriticalDataAvailable(com.tccc.kos.core.service.criticaldata.CriticalDataService service) {
            super.onCriticalDataAvailable(service);
             log.warn("01");
            try {
                log.warn("02");
                String serial = getSerialNumber();
                log.info("Serial number found: {}", serial);
            } catch (Exception e) {
                log.warn("03");
                log.warn("No serial found, initializing...");
                try {
                    log.warn("04");
                    setSerialNumber("RACK-00001");
                    log.info("Serial number initialized.");
                } catch (Exception ex) {
                    log.error("Failed to set serial number", ex);
                }
            }
        }
    }

    @Override
    public void load() throws Exception {
        // use critical-data serial number provider
        RackSerialProvider provider = new RackSerialProvider();
        addToCtx(provider);
        deviceService.setSerialNumberProvider(provider);

        addToCtx(new RackController());
    }

    @Override
    public void start() throws Exception {
        KabFile uiKab;

        // find the ui kab and mount it
        if ((uiKab = getSection().getKabByType(UI_KAB_TYPE)) != null) {
            uiVfsSource = getVfs().mount("/ui", uiKab);
        } else {
            log.error("No ui kab found.");
        }

        // create the content list
        contentList = new LinkedList<>();

        // add mfg content
        addContent(getSection(SECTION_MFG_CONTENT), true);

        // add ota content
        for (ResolvedManifestSection section : getSectionsByNamePrefix(OTA_CONTENT_PREFIX)) {
            addContent(section, false);
        }
    }

    private void addContent(ResolvedManifestSection section, boolean mfg) {
        for (KabFile kab : section.getKabs()) {
            try {
                // build a content object for the kab
                Content content = new Content();
                content.id = kab.getIdentifier();
                content.mfg = mfg;

                // load ui.json from the kab
                content.json = KosUtil.getMapper().readTree(kab.getInputStream("spec-1/ui.json"));

                // mount the kab into vfs using the identifier of the kab as the base directory
                VFSSource source = getVfs().mount("/content/" + content.id, kab);
                content.basePath = source.getFullPath("spec-1");

                // add to the list
                contentList.add(content);
            } catch (Exception ex) {
                log.error("Failed to load content from kab: {}", kab);
            }
        }
    }

    @Override
    public void started() {
    try {
    // Locate descriptor.json inside this app section
    KabFile self = getSection().getKabs().get(0); // get the app's KAB itself
    InputStream descriptorStream = self.getInputStream("descriptor.json");
    
    if (descriptorStream != null) {
        JsonNode root = KosUtil.getMapper().readTree(descriptorStream);
        log.info("Loaded descriptor.json: {}", root.toPrettyString());
        
        JsonNode layoutNode = root.path("tccc").path("rack").path("device").path("layout");
        if (!layoutNode.isMissingNode()) {
            log.info("Loaded layout: {}", layoutNode.toPrettyString());
        } else {
            log.warn("Layout not found under tccc.rack.device.layout");
        }
    } else {
        log.error("Could not find descriptor.json in app KAB");
    }
} catch (Exception e) {
    log.error("Failed to load layout from descriptor.json", e);
}

        // nav to the ui
        if (uiVfsSource != null) {
            browserService.goToUrl(uiVfsSource.getFullPath("index.html"));
        }
    }

    /**
     * Set the color of the led strip.
     * @param color   the color in hex rgb format without the leading '#'
     */
    public void setLedColor(String color) {
        try {
            httpClient.newRequest(getConfig().getLedUrl())
                .method(HttpMethod.POST)
                .body(new StringRequestContent("application/json",
                        KosUtil.getMapper().writeValueAsString(Map.of("colorhex", "#" + color))))
                .send();
        } catch(Exception ex) {
            log.error("Failed to set rgb color to: {}", color, ex);
        }
   }

    @Getter @Setter
    public class Content {
        private String id;          // id of the kab
        private JsonNode json;      // ui.json file
        private String basePath;    // base path of content
        private boolean mfg;        // true if mfg conent
    }
}