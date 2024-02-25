document.getElementById("loadAd").addEventListener("click", function () {
  const vastXML = document.getElementById("vastInput").value;
  console.log({ vastXML });
  const parsedData = parseVAST(vastXML);

  if (parsedData.length > 0) {
    const firstAd = parsedData[0];
    if (firstAd.creatives.length > 0) {
      const firstCreative = firstAd.creatives[0];
      if (firstCreative.mediaFiles.length > 0) {
        const mediaFileDetails = firstCreative.mediaFiles[0];
        loadVideoWithIMA(mediaFileDetails.url);
      } else {
        console.error(
          "No media files found in the first creative of the first ad."
        );
      }
    } else {
      console.error("No creatives found in the first ad.");
    }
  } else {
    console.error("No ads found in VAST XML.");
  }
});

const videoContent = document.getElementById("content_video");

function loadVideoWithIMA(adTagUrl) {
  const adDisplayContainer = new google.ima.AdDisplayContainer(
    document.getElementById("adContainer"),
    videoContent
  );
  const adsLoader = new google.ima.AdsLoader(adDisplayContainer);

  adsLoader.addEventListener(
    google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
    onAdsManagerLoaded,
    false
  );
  adsLoader.addEventListener(
    google.ima.AdErrorEvent.Type.AD_ERROR,
    onAdError,
    false
  );

  const adsRequest = new google.ima.AdsRequest();
  adsRequest.adTagUrl = adTagUrl;

  adsLoader.requestAds(adsRequest);
}

function onAdsManagerLoaded(adsManagerLoadedEvent) {
  const adsRenderingSettings = new google.ima.AdsRenderingSettings();
  adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
  const adsManager = adsManagerLoadedEvent.getAdsManager(
    videoContent,
    adsRenderingSettings
  );

  adsManager.init(640, 360, google.ima.ViewMode.NORMAL);
  adsManager.start();
}

function onAdError(adErrorEvent) {
  console.log(adErrorEvent.getError());
}

// Existing parseVAST function...

function parseVAST(xmlString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  const ads = xmlDoc.getElementsByTagName("Ad");
  const parsedAds = [];

  for (let ad of ads) {
    const inLine = ad.getElementsByTagName("InLine")[0];
    if (!inLine) continue; // Skip if not an InLine ad

    const adData = {
      id: ad.getAttribute("id"),
      adSystem: inLine.getElementsByTagName("AdSystem")[0].textContent,
      impressions: Array.from(inLine.getElementsByTagName("Impression")).map(
        (el) => el.textContent
      ),
      creatives: [],
      // Add other necessary fields here...
    };

    const creatives = inLine.getElementsByTagName("Creative");
    for (let creative of creatives) {
      const linear = creative.getElementsByTagName("Linear")[0];
      if (!linear) continue; // Skip if not a Linear creative

      const creativeData = {
        id: creative.getAttribute("id"),
        duration: linear.getElementsByTagName("Duration")[0].textContent,
        mediaFiles: Array.from(linear.getElementsByTagName("MediaFile")).map(
          (el) => ({
            url: el.textContent.trim(),
            type: el.getAttribute("type"),
            width: el.getAttribute("width"),
            height: el.getAttribute("height"),
            // Add other attributes as needed...
          })
        ),
        trackingEvents: Array.from(linear.getElementsByTagName("Tracking")).map(
          (el) => ({
            event: el.getAttribute("event"),
            url: el.textContent,
          })
        ),
        // Add other necessary fields...
      };

      adData.creatives.push(creativeData);
    }

    parsedAds.push(adData);
  }

  return parsedAds;
}
