//the users region
var userRegionAbbreviation;

$(function () {

    //show the instructions dialog if there is no cookie to suppress it
    if (typeof Cookies.get("selectStateInstructions") === "undefined")
        $.magnificPopup.open({
            closeOnBgClick: false,
            items: {
                src: "#instructionsDialog",
                type: "inline"
            },
            callbacks: {
                close: function () {
                    //set a cookie to prevent the instructions dialog for appearing again for a long time
                    Cookies.set("selectStateInstructions", "true", {expires: 365});

                    //scroll the the region if possible
                    if (typeof userRegionAbbreviation !== "undefined" && $("#" + userRegionAbbreviation).length)
                        $([document.documentElement, document.body]).animate({
                            scrollTop: $("#" + userRegionAbbreviation).offset().top - window.innerHeight / 2
                        }, 1000);
                }
            }
        });

    //attempt to get the IP location data
    getIpLocation(function (ipLocation) {

        //was the IP successfully resolved
        if (ipLocation.success) {

            //look for the button
            $(".regionButton").each(function (index, regionButton) {

                //is this the button
                if (ipLocation.regionName === $(regionButton).html())
                {
                    //only pulse if active
                    if (!$(regionButton).hasClass("inactive"))
                        $(regionButton).addClass("pulse");

                    //hang onto the region abbreviation
                    userRegionAbbreviation = ipLocation.regionAbbreviation;

                    //if the instructions are not being shown, scroll to the element such that it is in the middle of the screen
                    if (typeof Cookies.get("selectStateInstructions") !== "undefined" && $("#" + userRegionAbbreviation).length)
                        $([document.documentElement, document.body]).animate({
                            scrollTop: $("#" + userRegionAbbreviation).offset().top - window.innerHeight / 2
                        }, 1000);

                    return false;
                }
            });
        }
    });
});

//closes the dialog
function closeDialog() {
    $.magnificPopup.instance.close();
}

//****************************************************************************** AJAX
//resolve IP to location
function getIpLocation(callback)
{
    //if the cookie exists, use it
    if (typeof Cookies.get("userLocation") !== "undefined") {
        callback(JSON.parse(Cookies.get("userLocation")));
    } else {
        $.ajax({
            type: "GET",
            url: "https://trafficcamarchive.com/ws/browse/getIpLocation",
            dataType: "json",
            success: function (data) {

                //save the data as JSON in a cookie
                Cookies.set("userLocation", JSON.stringify(data), {expires: 180});

                //call the callback
                callback(data);
            },
            error: function (xhr) {
                //ignore on failure
            }
        });
    }
}