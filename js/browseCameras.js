//the regions
var regions;
//the selected region object
var selectedRegion;
//the locations for the selected region
var locations;
//the selected location object
var selectedLocation;
//the cameras
var cameras;
//reference to the cameras map
var camerasMap;
//the map markers
var markers = [];
//the query marker
var queryMarker = null;
//custom map markers (pins)
var activeMarkerIcon, queryMarkerIcon;
//the current video player
var videoPlayer = null;
//query param update values
var queryRegionName, queryLocationId, queryCameraIndex, queryLatitude, queryLongitude, queryZoom, queryGeocodeTitle, queryGeocodeLatitude, queryGeocodeLongitude, queryGpsLatitude, queryGpsLongitude;
//flags to determine the users share intention
var shareCamera = false, shareGeocode = false, shareGps = false;
//control key down
var ctrlDown = false;
//default map values
var defaultZoom = 7;
var minZoom = 6;
var maxZoom = 20;

$(function () {

    //hide the footer since the page is built asynchronously
    hideFooter();

    //create the map
    camerasMap = L.map("camerasMap", {
        zoom: defaultZoom,
        minZoom: minZoom,
        maxZoom: maxZoom,
        maxBoundsViscosity: .75,
        attributionControl: false
    });


    //create the map tile
    var openstreet=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        //attribution: "&copy; <a href='https://openstreetmap.org/copyright'>OpenStreetMap contributors</a>",
        maxZoom: maxZoom
    })


    var googlestreet   = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{
        maxZoom: 20,
        subdomains:['mt0','mt1','mt2','mt3']
        }).addTo(camerasMap)
    var dark  = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{
        maxZoom: 18,
        });
    // var dark  = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png');
  
    var googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
                maxZoom: 20,
                subdomains:['mt0','mt1','mt2','mt3']
            });


    var baseLayers = {
        "OpenStreet": openstreet,
        "Google Street": googlestreet,
        "Google Satellite": googleSat,
        "Dark": dark,
          // "LGA Layer": lga
        };
        var overLays = {
        // "Land_Plots": Land_Plots,
        // "Trees & Graphics": trees_layer,
        // "Clouds": clouds_layer
        };
        
        var mylayercontrol= L.control.layers(baseLayers,overLays).addTo(camerasMap);

    //key down listener
    document.onkeydown = function (evt) {
        ctrlDown = evt.ctrlKey;
    };

    //key up listener
    document.onkeyup = function (evt) {
        ctrlDown = evt.ctrlKey;
    };

    //show lat/lon on ctrl+click
    camerasMap.on("click", function (e) {
        if (ctrlDown)
            L.popup().setLatLng(e.latlng).setContent("" + e.latlng.lat + ", " + e.latlng.lng).openOn(camerasMap);
    });

    //map zoom event
    camerasMap.on("zoom", function (event) {
        queryZoom = camerasMap.getZoom();
    });

    //move event
    camerasMap.on("move", function (event) {
        queryLatitude = camerasMap.getCenter().lat;
        queryLongitude = camerasMap.getCenter().lng;
    });

    



    

    //create the active map marker
    activeMarkerIcon = L.icon({
        iconUrl: 'images/activeMarker.png',
        // shadowUrl: 'images/markerShadow.png',
        iconSize: [30, 45],
        iconAnchor: [15, 45],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        // shadowSize: [40, 40]
    });

    //create the query map marker
    queryMarkerIcon = L.icon({
        iconUrl: 'images/queryMarker.png',
        shadowUrl: 'images/markerShadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize: [41, 41]
    });

    //hide the popup when the map is clicked
    camerasMap.on("click", function (e) {
        $("#geocodePopup").hide();
    });

    //hide the popup when the map is dragged
    camerasMap.on("drag", function (e) {
        $("#geocodePopup").hide();
    });

    //populate the region and location selects
    populateRegionSelect(function () {
        populateLocationSelect(function () {
            //handle the selected location
            locationSelected(true, function () {});
        });
    });

    //show the instructions dialog if there is no cookie to suppress it
    if (typeof Cookies.get("browseCamerasInstructions") === "undefined")
        $.magnificPopup.open({
            closeOnBgClick: false,
            items: {
                src: "#instructionsDialog",
                type: "inline"
            },
            callbacks: {
                close: function () {
                    //set a cookie to prevent the instructions dialog for appearing again for a long time
                    Cookies.set("browseCamerasInstructions", "true", {expires: 365});
                }
            }
        });
});

//closes the dialog
function closeDialog() {
    $.magnificPopup.instance.close();
}

//flag used to avoid events during population
var populatingRegions = false;

//populates the region select drop down
function populateRegionSelect(callback)
{
    //set the flag
    populatingRegions = true;

    //get the regions
    getActiveRegions(function (regionData) {

        //hang onto the regions for the select
        regions = regionData;

        //populate the select
        $.each(regionData, function (index, region) {
            $("#regionSelect").append("<option value='" + region.name + "'>" + region.name + "</option>");
        });

        //get the provided region name
        var providedRegionName = getUrlParameter("rn");

        //if the region name is available, select it
        if (typeof providedRegionName !== "undefined")
            $("#regionSelect option[value='" + providedRegionName + "']").prop("selected", true);

        //get the selected region
        var regionName = $("#regionSelect").find(":selected").val();

        //find the selected region object
        for (var j = 0; j < regions.length; j++)
            if (regions[j].name === regionName)
            {
                selectedRegion = regions[j];
                break;
            }

        //reset the flag
        populatingRegions = false;

        //call the callback
        callback();
    });
}

//called when a region is selected
function regionSelected()
{
    //ignore events during population
    if (populatingRegions)
        return;

    //if the geocode popup is showing, hide it
    $("#geocodePopup").hide();

    //get the selected region
    var regionName = $("#regionSelect").find(":selected").val();

    //find the correct region object
    for (var j = 0; j < regions.length; j++)
        if (regions[j].name === regionName)
        {
            selectedRegion = regions[j];
            break;
        }

    //populate the locations
    populateLocationSelect(function () {

        //handle the selected location
        locationSelected(false, function () {});
    });
}

//flag used to avoid events during population
var populatingLocations = false;

//populates the location select drop down
function populateLocationSelect(callback)
{
    //set the flag
    populatingLocations = true;

    //get the selected region
    var regionName = $("#regionSelect").find(":selected").val();

    //clear the select
    $('#locationSelect')
            .find('option')
            .remove()
            .end();

    //get the locations
    getLocations(regionName, function (locationData) {

        //hang onto the locations for the select
        locations = locationData;

        //populate the select
        $.each(locationData, function (index, location) {
            $("#locationSelect").append("<option value='" + location.id + "'>" + location.name + "</option>");
        });

        //get the provided location ID
        var providedLocationId = getUrlParameter("li");

        //if the location ID is available, select it
        if (typeof providedLocationId !== "undefined")
            $("#locationSelect option[value='" + providedLocationId + "']").prop("selected", true);

        //get the selected location ID
        var locationId = $("#locationSelect").find(":selected").val();

        //find the selected location object
        for (var j = 0; j < locations.length; j++)
            if (locations[j].name === locationId)
            {
                selectedLocation = locations[j];
                break;
            }

        //reset the flag
        populatingLocations = false;

        //call the callback
        callback();
    });
}

//called when a location is selected
function locationSelected(useQueryParams, callback)
{
    //ignore events during population
    if (populatingRegions)
        return;

    //if the geocode popup is showing, hide it
    $("#geocodePopup").hide();

    //get the selected region
    var regionName = $("#regionSelect").find(":selected").val();

    //get the selected location ID
    var locationId = $("#locationSelect").find(":selected").val();

    //find the correct location object
    for (var j = 0; j < locations.length; j++)
        if (locations[j].id === locationId)
        {
            selectedLocation = locations[j];
            break;
        }

    //get the location's active cameras
    getActiveCameras(locationId, function (cameraData) {

        //hang onto the cameras
        cameras = cameraData;

        //reset share flags
        shareCamera = false;
        shareGeocode = false;
        shareGps = false;

        //set the share region and location values
        queryRegionName = regionName;
        queryLocationId = locationId;

        //are the GPS marker parameters defined and numeric
        var gpsMarkerDefined = typeof getUrlParameter("mgla") !== "undefined" && getUrlParameter("mgla") !== "undefined" && !isNaN(parseFloat(getUrlParameter("mgla")))
                && typeof getUrlParameter("mglo") !== "undefined" && getUrlParameter("mglo") !== "undefined" && !isNaN(parseFloat(getUrlParameter("mglo")));

        //are all of the marker geocode parameters defined and lat and lon are numeric
        var geocodeMarkerDefined = typeof getUrlParameter("mt") !== "undefined" && getUrlParameter("mt") !== "undefined"
                && typeof getUrlParameter("mla") !== "undefined" && getUrlParameter("mla") !== "undefined" && !isNaN(parseFloat(getUrlParameter("mla")))
                && typeof getUrlParameter("mlo") !== "undefined" && getUrlParameter("mlo") !== "undefined" && !isNaN(parseFloat(getUrlParameter("mlo")));

        //add the map markers for the location
        addMapMarkers(useQueryParams && !gpsMarkerDefined && !geocodeMarkerDefined, selectedLocation);

        //should query params be used and is a GPS marker defined
        if (useQueryParams && gpsMarkerDefined)
        {
            //set the share flags
            shareCamera = false;
            shareGeocode = false;
            shareGps = true;

            //get the marker GPS
            var latitude = parseFloat(getUrlParameter("mgla"));
            var longitude = parseFloat(getUrlParameter("mglo"));

            //set the query param values
            queryGpsLatitude = latitude;
            queryGpsLongitude = longitude;

            //create the marker
            queryMarker = L.marker([latitude, longitude], {icon: queryMarkerIcon}).addTo(camerasMap)
                    .on('popupclose', function () {
                        //reset flags
                        shareCamera = false;
                        shareGeocode = false;
                        shareGps = false;
                    });

            //create a popup
            var popup = L.popup({closeOnClick: false}).setContent("<div class='searchHeader'>GPS Search Result</div>"
                    + "GPS: <span id='gps_query'>" + latitude + ", " + longitude + "</span><img class='clipboard' src='images/clipboard.png' onclick=\"toClipboard('gps_query')\">"
                    + "<br/><span class='clickable' onclick='removeQueryMarker()'>Remove Marker</span>");

            //add a popup to the marker
            queryMarker.bindPopup(popup);

            //show the popup immediately
            queryMarker.openPopup();

            //give the map time to move to the location center before moving it again
            setTimeout(function () {

                //if the query param zoom is available, use it otherwise use a static value
                if (typeof getUrlParameter("z") !== "undefined" && !isNaN(parseInt(getUrlParameter("z"))))
                    camerasMap.setView([latitude, longitude], parseInt(getUrlParameter("z")));
                else
                    camerasMap.setView([latitude, longitude], selectedLocation.zoom);
            }, 1000);
        }
        //should query params be used and is a geocode marker defined
        else if (useQueryParams && geocodeMarkerDefined)
        {
            //set the share flags
            shareCamera = false;
            shareGeocode = true;
            shareGps = false;

            //get the lat and lon from the parameters
            var latitude = parseFloat(getUrlParameter("mla"));
            var longitude = parseFloat(getUrlParameter("mlo"));

            //set the query geocode values
            queryGeocodeTitle = getUrlParameter("mt");
            queryGeocodeLatitude = latitude;
            queryGeocodeLongitude = longitude;

            //create the marker
            queryMarker = L.marker([latitude, longitude], {icon: queryMarkerIcon}).addTo(camerasMap)
                    .on('popupclose', function () {
                        //reset flags
                        shareCamera = false;
                        shareGeocode = false;
                        shareGps = false;
                    });

            //create a popup
            var popup = L.popup({closeOnClick: false}).setContent("<div class='searchHeader'>Address Search Result</div>"
                    + "<b>" + queryGeocodeTitle + "</b>"
                    + "<br/>GPS: <span id='geocode_gps'>" + latitude + ", " + longitude + "</span><img class='clipboard' src='images/clipboard.png' onclick=\"toClipboard('geocode_gps')\">"
                    + "<br/><span class='clickable' onclick='removeQueryMarker()'>Remove Marker</span>");

            //add a popup to the marker
            queryMarker.bindPopup(popup);

            //show the popup immediately
            queryMarker.openPopup();

            //give the map time to move to the location center before moving it again
            setTimeout(function () {

                //if the query param zoom is available, use it otherwise use a static value
                if (typeof getUrlParameter("z") !== "undefined" && !isNaN(parseInt(getUrlParameter("z"))))
                    camerasMap.setView([latitude, longitude], parseInt(getUrlParameter("z")));
                else
                    camerasMap.setView([latitude, longitude], selectedLocation.zoom);
            }, 1000);
        }

        //call the callback
        callback();
    });
}

//removes existing map markers and adds new markers based on the selected location
function addMapMarkers(useQueryParams, location)
{
    //get the location lat and lon
    var latitude = location.latitude;
    var longitude = location.longitude;

    //remove existing markers
    $.each(markers, function (index, marker) {
        camerasMap.removeLayer(marker);
    });

    //empty the array of markers by creating a new one
    markers = [];

    //flag to determine if the define camera ID is valid for the location
    var queryParamCameraFound = false;

    //iterate through each camera
    $.each(cameras, function (index, camera) {

        //ignore if not the correct location
        if (camera.locationId !== location.id)
            return;

        var marker;

        //create the marker
        marker = L.marker([camera.latitude, camera.longitude], {icon: activeMarkerIcon}).addTo(camerasMap)
                .on('popupopen', function () {

                    //clean up and start new video if supported
                    if (doesBrowserSupportSelfSignedVideo())
                    {
                        //make sure the current video player is disposed
                        disposeVideoPlayer();
                        //create a videoPlayer
                        videoPlayer = videojs('videoPlayer' + camera.id, {});
                    }

                    //set the query camera index
                    queryCameraIndex = camera.id;

                    //set the share flags
                    shareCamera = true;
                    shareGeocode = false;
                    shareGps = false;

					//when not zoom all the way in, delay the showing of the marker so the user can see other cameras in the area
                    if (camerasMap.getZoom() !== maxZoom)
                        $(".leaflet-popup").css("opacity", 0).hide().delay(500).fadeTo(250, 1);

                    //zoom all the way in to expose additional cameras
                    camerasMap.setView([camera.latitude, camera.longitude], maxZoom);
                })
                .on('popupclose', function () {
                    //make sure the current video player is disposed
                    if (doesBrowserSupportSelfSignedVideo())
                        disposeVideoPlayer();

                    //reset the flag
                    shareCamera = false;
                });

        //associate the camera ID with the marker
        marker.cameraId = camera.id;

        //add the marker to the array of markers
        markers.push(marker);

        //the video HTML for browsers that support it
        // console.log(camera.videoStreamUrl)
        var videoHtml = "<video id='videoPlayer" + camera.id + "' class='video-js' poster='" + camera.previewImageUrl + "' width='300' height='150' controls disablePictureInPicture muted>";
        videoHtml += "<source src='" + camera.videoStreamUrl + "' type='application/x-mpegURL'/>";
        videoHtml += "</video>";

        //when playing video is not supported by the browser, the preview image is shown instead
        var previewImageHtml = "<img src='" + camera.previewImageUrl + "' style='width:250px'>";
        var vidsuport
        var imglocal 
        if(camera.videoStreamUrl==""){
            imglocal = "<img src='images/unnamed.png' style='width:250px'>";
            vidsuport = ""
        }else{
             imglocal = "";
             vidsuport = (doesBrowserSupportSelfSignedVideo() ? videoHtml : previewImageHtml)

        }
        

        //create a popup
        var popup = L.popup({closeOnClick: false}).setContent("<div class='cameraTitle'>" + camera.name + "</div>"
                + "<div class='cameraGps'>GPS: <span id='camera_gps_" + camera.id + "'>" + camera.latitude + ", " + camera.longitude + "</span>"
                + "<img class='clipboard' src='images/clipboard.png' onclick=\"toClipboard('camera_gps_" + camera.id + "')\"></div>"
                + imglocal
                + vidsuport
                + "<button class='button special fit small selectCameraButton' onclick='selectCamera(" + camera.id + ")'>Select Camera</button>");

        //bind the popup to the marker
        marker.bindPopup(popup);

        //should query params be used and is the camera ID parameter defined, if so show the popup
        if (useQueryParams && typeof getUrlParameter("c") !== "undefined" && !isNaN(parseInt(getUrlParameter("c"))) && parseInt(getUrlParameter("c")) === camera.id)
        {
            //set the flag
            queryParamCameraFound = true;

            //when the camera ID is defined, it's lat and lon are used
            latitude = camera.latitude;
            longitude = camera.longitude;

            //a timeout is required to give the map time to initialize
            setTimeout(function () {
                marker.openPopup();
            }, 250);
        }
    });

    //should query params be used and are the lat and lon parameters defined and numeric
    //notice that when the camera ID is specified, its lat and lon are used if it was found
    if (useQueryParams && (typeof getUrlParameter("c") === "undefined" || !queryParamCameraFound) && typeof getUrlParameter("la") !== "undefined" && typeof getUrlParameter("lo") !== "undefined"
            && !isNaN(parseFloat(getUrlParameter("la"))) && !isNaN(parseFloat(getUrlParameter("lo"))))
    {
        latitude = parseFloat(getUrlParameter("la"));
        longitude = parseFloat(getUrlParameter("lo"));
    }

    //get the location zoom
    var zoom = location.zoom;

    //should query params be used and is zoom parameter defined
    if (useQueryParams && typeof getUrlParameter("z") !== "undefined" && !isNaN(parseInt(getUrlParameter("z"))))
        zoom = parseInt(getUrlParameter("z"));

    //remove the max bounds to allow the view to move
    camerasMap.setMaxBounds(null);

    //center the view and set the zoom to the default for the location
    camerasMap.setView([latitude, longitude], zoom);

    //max bounds padding
    var latPadding = (location.northLatitude - location.southLatitude);
    var lonPadding = (location.eastLongitude - location.westLongitude);

    //set minimums
    if (latPadding < .5)
        latPadding = .5;
    if (lonPadding < 1)
        lonPadding = 1;

    //set the max bounds after giving the view time to move
    setTimeout(function () {

        //set the map bounds with some padding
        camerasMap.setMaxBounds(L.latLngBounds([location.northLatitude + latPadding, location.westLongitude - lonPadding], [location.southLatitude - latPadding, location.eastLongitude + lonPadding]));
    }, 750);
}

//copies the contents of the element to the clipboard
function toClipboard(elementId)
{
    //get the node
    node = document.getElementById(elementId);

    //select the text in the node based on browser capabilities
    if (document.body.createTextRange)
    {
        const range = document.body.createTextRange();
        range.moveToElementText(node);
        range.select();
    } else if (window.getSelection) {

        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(node);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    //copy to clipboard
    document.execCommand("copy");

    //deselect the text
    if (window.getSelection)
        window.getSelection().removeAllRanges();
    else if (document.selection)
        document.selection.empty();
}

//if a video player exists, this call disposes it and set the video player to null
function disposeVideoPlayer()
{
    if (videoPlayer !== null)
    {
        videoPlayer.dispose();
        videoPlayer = null;
    }
}

//selects a camera
function selectCamera(cameraId)
{
    //set the share flags
    shareCamera = true;
    shareGeocode = false;
    shareGps = false;

    //update the URL so the user can come back
    // updateUrl();

    //find the camera (for its name)
    $.each(cameras, function (index, camera) {
        // if (camera.id === cameraId)
            window.location.href = "browseDate.html?cameraId=" + camera.id + "&name=" + camera.name;
    });
}

//the geocode query data for handling popup selections
var geocodeQueryData = null;

//called when a key is released in the query text field
function queryKeyUp(event)
{
    //enter key
    if (event.keyCode === 13)
        performGeocodeQuery();
    //escape key
    else if (event.keyCode === 27)
    {
        //clear and hide the popup
        $("#geocodePopup").html("");
        $("#geocodePopup").hide();
    }
}

//called when the clear map search image is clicked
function clearSearchClicked()
{
    //clear the text and get focus
    $("#camerasQueryText").val("").focus();

    //clear the popup
    $("#geocodePopup").html("");

    //hide the popup
    $("#geocodePopup").hide();

    //if a query maker currently exists, remove it
    removeQueryMarker();
}

//performs a geocode query
function performGeocodeQuery()
{
    //clear the popup
    $("#geocodePopup").html("");

    //hide the popup
    $("#geocodePopup").hide();

    //split in parts at white space(s), comma(s) or tab(s) to see if latitude and longitude were entered
    var parts = $("#camerasQueryText").val().split(/[ ,\t]+/);

    //if there are two parts then maybe this is a GPS entry
    if (parts.length === 2)
    {
        var lat = parts[0].trim();
        var lon = parts[1].trim();

        if (isNumeric(lat) && isNumeric(lon))
        {
            gpsSelected(lat, lon);
            return;
        }
    }

    //perform the query
    geocodeQuery($("#camerasQueryText").val(), function (geocodeData) {

        //do nothing if no data
        if (typeof geocodeData === "undefined" || geocodeData === null || typeof geocodeData.items === "undefined" || geocodeData.items === null)
            return;

        //hang onto the results for popup selection
        geocodeQueryData = geocodeData.items;

        //the number of added entries
        var numAddedEntries = 0;

        //the last added geocode index
        var lastAddedGeocodeIndex;

        $.each(geocodeData.items, function (index, geocode) {

            //ignore if not in the selected region
            if (geocode.address.stateCode !== selectedRegion.abbreviation)
                return;

            //ignore if no title or GPS defined
            if (typeof geocode.title === "undefined" || typeof geocode.position.lat === "undefined" || typeof geocode.position.lng === "undefined")
                return;

            lastAddedGeocodeIndex = index;

            //create the entry
            $("#geocodePopup").append("<div class='geocodeEntry' id='geocode_" + index + "'"
                    + (geocode.isCamera ? " onclick='geocodeCameraSelected(" + index + ")'>" : " onclick='geocodeSelected(" + index + ")'>")
                    + (geocode.isCamera ? "<img class='geocodeCameraImage' src='images/activeMarkerSmall.png'/>" : "<img class='geocodeCameraImage' src='images/queryMarkerSmall.png'/>")
                    + "<span class='clickable'>" + geocode.title + "</span>"
                    + "</div>");

            numAddedEntries++;
        });

        //when entries were added, calling blur will cause the keyboard on mobile to close
        if (numAddedEntries !== 0)
            $("#camerasQueryText").blur();

        //if only one entry was added, select it
        if (numAddedEntries === 1)
        {
            //select camera vs geocode
            if (geocodeData.items[lastAddedGeocodeIndex].isCamera)
                geocodeCameraSelected(lastAddedGeocodeIndex);
            else
                geocodeSelected(lastAddedGeocodeIndex);
        }
        //show the popup if two or more entries were added
        else if (numAddedEntries >= 2)
        {
            //size, position and show the popup relative to the text field
            $("#geocodePopup").css("width", $("#camerasQueryWrapper").width());
            $("#geocodePopup").css("left", $("#camerasQueryText").offset().left - 4);
            $("#geocodePopup").css("top", $("#camerasQueryText").offset().top + 40);
            $("#geocodePopup").show();
        }

        //if there were no results, animate the search area from white to red and back
        if (numAddedEntries === 0)
        {
            $("#camerasQueryText").animate({
                backgroundColor: "red"
            }).animate({
                backgroundColor: "white"
            });

            $("#camerasQueryWrapper").animate({
                backgroundColor: "red"
            }).animate({
                backgroundColor: "white"
            });
        }
    });
}

//determines if a string represents a number
function isNumeric(str)
{
    if (typeof str !== "string")
        return false;

    return !isNaN(str) && !isNaN(parseFloat(str));
}

//called when a lat and lon is selected from the popup
function gpsSelected(latitude, longitude)
{
    //hide the popup
    $("#geocodePopup").hide();

    //if a query maker currently exists, remove it
    removeQueryMarker();

    //set the query param values
    queryGpsLatitude = latitude;
    queryGpsLongitude = longitude;

    //create the maker
    queryMarker = L.marker([latitude, longitude], {icon: queryMarkerIcon}).addTo(camerasMap)
            .on('popupopen', function () {
                //set flags
                shareCamera = false;
                shareGeocode = false;
                shareGps = true;
            })
            .on('popupclose', function () {
                //reset flags
                shareCamera = false;
                shareGeocode = false;
                shareGps = false;
            });

    //set a high z-index offset to ensure the marker is above the camera markers
    queryMarker.setZIndexOffset(10000);

    //create a popup
    var popup = L.popup({closeOnClick: false}).setContent("<div class='searchHeader'>GPS Search Result</div>"
            + "GPS: <span id='gps_query'>" + latitude + ", " + longitude + "</span><img class='clipboard' src='images/clipboard.png' onclick=\"toClipboard('gps_query')\">"
            + "<br/><span class='clickable' onclick='removeQueryMarker()'>Remove Marker</span>");

    //add a popup to the marker
    queryMarker.bindPopup(popup);

    //show the popup immediately
    queryMarker.openPopup();

    //set the view and zoom in if zoomed out too far but otherwise leave zoom alone
    //note that the time out is needed to deal with the map already moving and zooming (2 steps)
    setTimeout(function () {
        if (camerasMap.getZoom() < 14)
            camerasMap.setView([latitude, longitude], 14);
        else
            camerasMap.setView([latitude, longitude]);
    }, 500);

    //remove the camera bounds because the GPS may not be in a location but the user should still see it on the map
    camerasMap.setMaxBounds(null);

    //look for a region that contains the GPS coordinates
    for (var j = 0; j < regions.length; j++)
    {
        if (latitude <= regions[j].northLatitude && latitude >= regions[j].southLatitude && longitude >= regions[j].westLongitude && longitude <= regions[j].eastLongitude)
        {
            //callback for selecting the location
            var callback = function () {

                //look for the first location that contains the GPS coordinates (they are ordered by priority)
                for (var j = 0; j < locations.length; j++)
                {
                    if (latitude <= locations[j].northLatitude && latitude >= locations[j].southLatitude
                            && longitude >= locations[j].westLongitude && longitude <= locations[j].eastLongitude)
                    {
                        //if the location isn't already selected, select it
                        if (selectedLocation.id !== locations[j].id)
                        {
                            //select the option
                            $("#locationSelect option[value='" + locations[j].id + "']").prop("selected", true);

                            //handle the selected location
                            locationSelected(false, function () {
                                //set the flags
                                shareCamera = false;
                                shareGeocode = false;
                                shareGps = true;
                            });
                        }

                        break;
                    }
                }
            };

            //if the region isn't already selected, select it and load the locations
            if (selectedRegion.name !== regions[j].name)
            {
                //select the region
                $("#regionSelect option[value='" + regions[j].name + "']").prop("selected", true);

                //set the selected region
                selectedRegion = regions[j];

                //load the locations and select the correct location
                populateLocationSelect(function () {
                    callback();
                });

                break;
            } else
            {
                //if the correct region is already selected make sure the correct location is selected
                callback();
            }

            break;
        }
    }
}

//called when a geocode is selected from the popup
function geocodeSelected(index)
{
    //hide the popup (if there is one)
    $("#geocodePopup").hide();

    //if a query maker currently exists, remove it
    removeQueryMarker();

    //set the share flags
    shareCamera = false;
    shareGeocode = true;
    shareGps = false;

    //get the data
    var title = geocodeQueryData[index].title;
    var latitude = geocodeQueryData[index].position.lat;
    var longitude = geocodeQueryData[index].position.lng;

    //hang onto the data
    queryGeocodeTitle = title;
    queryGeocodeLatitude = latitude;
    queryGeocodeLongitude = longitude;

    //set the share flags
    shareCamera = false;
    shareGeocode = true;
    shareGps = false;

    //create the marker
    queryMarker = L.marker([latitude, longitude], {icon: queryMarkerIcon}).addTo(camerasMap).on('popupopen', function () {
        //set flags
        shareCamera = false;
        shareGeocode = true;
        shareGps = false;
    });

    //set a high z-index offset to ensure the marker is above the camera markers
    queryMarker.setZIndexOffset(10000);

    //create a popup
    var popup = L.popup({closeOnClick: false}).setContent("<div class='searchHeader'>Address Search Result</div>"
            + "<b>" + title + "</b>"
            + "<br/>GPS: <span id='geocode_gps'>" + latitude + ", " + longitude + "</span><img class='clipboard' src='images/clipboard.png' onclick=\"toClipboard('geocode_gps')\">"
            + "<br/><span class='clickable' onclick='removeQueryMarker()'>Remove Marker</span>");

    //add a popup to the marker
    queryMarker.bindPopup(popup);

    //show the popup immediately
    queryMarker.openPopup();

    //set the view and zoom in if zoomed out too far but otherwise leave zoom alone
    //note that the time out is needed to deal with the map already moving and zooming (2 steps)
    setTimeout(function () {
        if (camerasMap.getZoom() < 14)
            camerasMap.setView([latitude, longitude], 14);
        else
            camerasMap.setView([latitude, longitude]);
    }, 500);

    //remove the camera bounds because the geocode may not be in a location but the user should still see it on the map
    camerasMap.setMaxBounds(null);

    //look for the first location that contains the GPS coordinates (they are ordered by priority)
    for (var j = 0; j < locations.length; j++)
    {
        if (latitude <= locations[j].northLatitude && latitude >= locations[j].southLatitude
                && longitude >= locations[j].westLongitude && longitude <= locations[j].eastLongitude)
        {
            //if the location isn't already selected, select it
            if (selectedLocation.id !== locations[j].id)
            {
                //select the option
                $("#locationSelect option[value='" + locations[j].id + "']").prop("selected", true);

                //handle the selected location
                locationSelected(false, function () {
                    //set the flags
                    shareCamera = false;
                    shareGeocode = true;
                    shareGps = false;
                });
            }

            break;
        }
    }
}

//called when a camera entry is selected in the geocode search
function geocodeCameraSelected(index, cameraId)
{
    //get the lat and lon
    var latitude = geocodeQueryData[index].position.lat;
    var longitude = geocodeQueryData[index].position.lng;
    var cameraId = geocodeQueryData[index].cameraId;

    //set the view and zoom in if zoomed out too far but otherwise leave zoom alone
    setTimeout(function () {
        if (camerasMap.getZoom() < 14)
            camerasMap.setView([latitude, longitude], 14);
        else
            camerasMap.setView([latitude, longitude]);
    }, 500);

    //hide the popup (if there is one)
    $("#geocodePopup").hide();

    //if a query maker currently exists, remove it
    removeQueryMarker();

    //function to open the camera marker
    var openCameraMarker = function () {

        //iterate through the markers
        $.each(markers, function (index, marker) {

            //is this marker the camera's marker
            if (cameraId === marker.cameraId) {
                //note that opening the popup calls the 'popupopen' of addMapMarkers()
                marker.openPopup();
                return false;
            }
        });
    };

    //flag to determine if a new location was selected
    var newLocationSelected = false;

    //look for the first location that contains the GPS coordinates (they are ordered by priority)
    for (var j = 0; j < locations.length; j++)
    {
        if (latitude <= locations[j].northLatitude && latitude >= locations[j].southLatitude
                && longitude >= locations[j].westLongitude && longitude <= locations[j].eastLongitude)
        {
            //if the location isn't already selected, select it
            if (selectedLocation.id !== locations[j].id)
            {
                newLocationSelected = true;

                //select the option
                $("#locationSelect option[value='" + locations[j].id + "']").prop("selected", true);

                //handle the selected location
                locationSelected(false, function () {

                    //select the marker
                    openCameraMarker();

                    //set the flags
                    shareCamera = false;
                    shareGeocode = true;
                    shareGps = false;
                });
            }

            break;
        }
    }

    //if a new location wasn't selected, open the camera marker from the current location
    if (!newLocationSelected)
        openCameraMarker();
}

//removes the query marker if it exists
function removeQueryMarker()
{
    //set the share flags
    shareGeocode = false;
    shareGps = false;

    //remove the marker
    if (queryMarker !== null)
    {
        camerasMap.removeLayer(queryMarker);
        queryMarker = null;
    }
}

//shows the share dialog
function share()
{
    //set the URL
    $("#shareUrl").html(generateUrl());

    //show the share dialog
    $.magnificPopup.open({
        items: {
            src: "#shareDialog",
            type: "inline"
        }
    });
}

//generates a URL that points to the current state
function generateUrl()
{
    return location.protocol + '//' + location.host + location.pathname
            + "?"
            //region name
            + (typeof queryRegionName !== "undefined" && queryRegionName !== null && queryRegionName !== "undefined" ? "&rn=" + queryRegionName : "")
            //location ID
            + (typeof queryLocationId !== "undefined" && queryLocationId !== null && queryLocationId !== "undefined" ? "&li=" + queryLocationId : "")
            //map zoom
            + (typeof queryZoom !== "undefined" && queryZoom !== null && queryZoom !== "undefined" && !isNaN(parseInt(queryZoom)) ? "&z=" + queryZoom : "")
            //map latitude
            + (typeof queryLatitude !== "undefined" && queryLatitude !== null && queryLatitude !== "undefined" && !isNaN(parseFloat(queryLatitude)) ? "&la=" + queryLatitude : "")
            //map longitude
            + (typeof queryLongitude !== "undefined" && queryLongitude !== null && queryLongitude !== "undefined" && !isNaN(parseFloat(queryLongitude)) ? "&lo=" + queryLongitude : "")
            //camera ID
            + (shareCamera && typeof queryCameraIndex !== "undefined" && queryCameraIndex !== null && queryCameraIndex !== "undefined" && !isNaN(parseInt(queryCameraIndex)) ? "&c=" + queryCameraIndex : "")
            //geocode marker title
            + (shareGeocode && typeof queryGeocodeTitle !== "undefined" && queryGeocodeTitle !== null && queryGeocodeTitle !== "undefined" && queryGeocodeTitle !== "" ? "&mt=" + queryGeocodeTitle : "")
            //geocode marker latitude
            + (shareGeocode && typeof queryGeocodeLatitude !== "undefined" && queryGeocodeLatitude !== null && queryGeocodeLatitude !== "undefined" && !isNaN(parseFloat(queryGeocodeLatitude)) ? "&mla=" + queryGeocodeLatitude : "")
            //geocode marker longitude
            + (shareGeocode && typeof queryGeocodeLongitude !== "undefined" && queryGeocodeLongitude !== null && queryGeocodeLongitude !== "undefined" && !isNaN(parseFloat(queryGeocodeLongitude)) ? "&mlo=" + queryGeocodeLongitude : "")
            //GPS marker latitude
            + (shareGps && typeof queryGpsLatitude !== "undefined" && queryGpsLatitude !== null && queryGpsLatitude !== "undefined" && !isNaN(parseFloat(queryGpsLatitude)) ? "&mgla=" + queryGpsLatitude : "")
            //GPS marker longitude
            + (shareGps && typeof queryGpsLongitude !== "undefined" && queryGpsLongitude !== null && queryGpsLongitude !== "undefined" && !isNaN(parseFloat(queryGpsLongitude)) ? "&mglo=" + queryGpsLongitude : "");
}

//updates the URL with the query params
function updateUrl()
{
    //get the URL
    var newUrl = generateUrl();

    //remember the URL for coming back to the same map from various pages
    Cookies.set("browseCamerasRestoreUrl", newUrl, {expires: 1});

    //update the current URL
    history.replaceState(null, null, newUrl);
}

//****************************************************************************** AJAX
//gets the active regions
function getActiveRegions(callback)
{
    $.ajax({
      type: "GET",
          url: "ws/browse/getActiveRegions.json",
        dataType: "json",
        success: function (data) {
            callback(data);
        },
        error: function (xhr) {
            window.location.replace("500.html");
        }
    });
}

//gets locations
function getLocations(regionName, callback)
{
    $.ajax({
      type: "GET",
          url: "ws/browse/getLocations.json",
        dataType: "json",
        data: {
            regionName: regionName
        },
        success: function (data) {
            callback(data);
        },
        error: function (xhr) {
            window.location.replace("500.html");
        }
    });
}

//gets a location's active cameras
function getActiveCameras(locationId, callback)
{
    $.ajax({
      type: "GET",
          url: "ws/browse/getActiveCameras.json",
        dataType: "json",
        data: {
            locationId: locationId
        },
        success: function (data) {
            callback(data);
        },
        error: function (xhr) {
            window.location.replace("500.html");
        }
    });
}

//performs a geocode query
function geocodeQuery(query, callback)
{
    $.ajax({
      type: "GET",
          url: "https://trafficcamarchive.com/ws/browse/geocodeQuery",
        dataType: "json",
        data: {
            locationId: selectedLocation.id,
            query: query
        },
        success: function (data) {
            callback(data);
        },
        error: function (xhr) {
            callback(null);
        }
    });
}