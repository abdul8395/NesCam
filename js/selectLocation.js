$(function () {

    //show the instructions dialog if there is no cookie to suppress it
    if (typeof Cookies.get("selectLocationInstructions") === "undefined")
        $.magnificPopup.open({
            closeOnBgClick: false,
            items: {
                src: "#instructionsDialog",
                type: "inline"
            },
            callbacks: {
                close: function () {
                    //set a cookie to prevent the instructions dialog for appearing again for a long time
                    Cookies.set("selectLocationInstructions", "true", {expires: 365});
                }
            }
        });
    
    //attempt to get the IP location data
    getIpLocation(function (ipLocation) {

        //was the IP successfully resolved
        if (ipLocation.success) {

            //look for the button
            $(".locationButton").each(function (index, locationButton) {

                //is this the button
                if (ipLocation.city === $(locationButton).html())
                {
                    $(locationButton).addClass("pulse");
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
            url: "ws/browse/getIpLocation",
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