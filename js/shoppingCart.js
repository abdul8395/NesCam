$(function () {

    //if the cart is not empty, show the instructions dialog if there is no cookie to suppress it
    if (cartSize() !== 0 && typeof Cookies.get("shoppingCartInstructions") === "undefined")
            $.magnificPopup.open({
                closeOnBgClick: false,
                items: {
                    src: "#instructionsDialog",
                    type: "inline"
                },
                callbacks: {
                    close: function () {
                        //set a cookie to prevent the instructions dialog for appearing again for a long time
                        Cookies.set("shoppingCartInstructions", "true", {expires: 365});
                    }
                }
            });

    //hide the footer since the page is built asynchronously
    hideFooter();

    //show the empty cart message if the cart is empty
    if (cartSize() === 0)
    {
        $("#emptyCartWrapper").show();
        updateFooter();
        return;
    }

    //show the order
    $("#orderWrapper").show();

    //populate the order table
    populateOrderTable();
});

//initialize when the page is shown and persisted (this is needed for back on mobile or the page won't update)
window.addEventListener("pageshow", function (evt) {

    //when the cached page is shown (i.e. back on mobile), reload the page otherwise things (i.e. Ajax) are broken
    if (evt.persisted)
        window.location.reload();
}, false);

//goes back to browse cameras while restoring the map
function backToBrowseCameras()
{
    if (typeof Cookies.get("browseCamerasRestoreUrl") !== "undefined")
        window.location.replace(Cookies.get("browseCamerasRestoreUrl"));
    else
        window.location.replace(Cookies.get("browseCameras.html"));
}

//the number of vidoes checked for availability
var numVideosChecked = 0;
//flag to show the warning on availability check only once
var unavailableDialogShown = false;

//populates the order table
function populateOrderTable()
{
    //empty the table
    $("#tableBody").html("");
    $("#tableFooter").html("");

    //reset the number of vidoes checked for availability
    numVideosChecked = 0;

    //the total price without taxes
    var totalPrice = 0;

    //add the videos
    for (var videoIndex = 0; videoIndex < cartSize(); videoIndex++)
    {
        //add to the total price
        totalPrice += cart[videoIndex].pricePerHour;

        $("#tableBody").append("<tr>"
                + "<td>" + cart[videoIndex].cameraName + "<br/><span class='locationData' id='location_" + videoIndex + "'></span></td>"
                + "<td nowrap>" + formatYearMonthDay(cart[videoIndex].year, cart[videoIndex].month, cart[videoIndex].day) + "<br/>" + formatHour(cart[videoIndex].hour) + "</td>"
                + "<td id='status_" + videoIndex + "'></td>"
                + "<td>$" + cart[videoIndex].pricePerHour + "</td>"
                + "<td class='centerText'><img src='images/trash.png?tcaGen=2' alt='' class='deleteVideo' title='Delete From Cart' onclick='deleteVideo(" + videoIndex + ")'></td>"
                + "</tr>");

        //get the camera location
        getCameraLocation(videoIndex, cart[videoIndex].cameraId, function (index, locationData) {

            //update the span with the location data
            $("#location_" + index).html(locationData.locationName + ", " + locationData.regionName);
        });

        //determine the availability of the video
        getVideoAvailability(videoIndex, cart[videoIndex].uid, function (index, result) {

            //increment
            numVideosChecked++;

            //set the status
            $("#status_" + index).html(result.available ? "Available" : "Unavailable");

            //set the parent color
            if (!result.available)
                $("#status_" + index).parent().addClass("unavailable");

            //if all video has been checked and some are unavailable, show the dialog unless it shouldn't be shown
            if (numVideosChecked === cartSize() && $(".unavailable").length !== 0 && !unavailableDialogShown && getUrlParameter("suppress") !== "true")
            {
                unavailableDialogShown = true;
                showUnavailableDialog();
            }
        });
    }

    //add the total price
    $("#tableFooter").append("<tr>"
            + "<td></td><td></td>"
            + "<td style='text-align:right;font-weight:bold'>Total</td>"
            + "<td style='font-weight:bold'>$" + formatNumber(totalPrice) + "</td>"
            + "<td style='text-align:center'><img src='images/trash.png?tcaGen=2' alt='' class='deleteVideo' title='Delete All From Cart' onclick='showConfirmClearCartDialog()'></td>"
            + "</tr>");

    //update the footer now that loading is finished
    updateFooter();
}

//removes a video from the cart
function deleteVideo(videoIndex) {

    //remove the video from the cart
    removeFromCart(cart[videoIndex].cameraId, cart[videoIndex].uid, cart[videoIndex].year, cart[videoIndex].month, cart[videoIndex].day, cart[videoIndex].hour);

    //hide the order and show the empty cart message if the cart is now empty
    if (cartSize() === 0)
    {
        $("#orderWrapper").hide();
        $("#emptyCartWrapper").show();
        return;
    }

    //repopulate the table
    populateOrderTable();
}

//called when the checkout button is clicked
function checkoutButtonClicked()
{
    //if any video is unavailable, show the dialog and abort
    if ($(".unavailable").length !== 0)
    {
        showUnavailableDialog();
        return;
    }

    window.location.href = "checkout.html";
}

//shows the video is unavailable dialog
function showUnavailableDialog()
{
    //show the dialog
    $.magnificPopup.open({
        items: {
            src: "#unavailableDialog",
            type: "inline"
        },
        callbacks: {
            open: function () {
                //for unknown reasons, the focus cannot be set immediately
                setTimeout(function () {
                    $("#okButton").focus();
                }, 250);
            }
        }
    });
}

//shows the confirm clear cart dialog
function showConfirmClearCartDialog()
{
    //show the dialog
    $.magnificPopup.open({
        items: {
            src: "#confirmClearCartDialog",
            type: "inline"
        },
        callbacks: {
            open: function () {
                //for unknown reasons, the focus cannot be set immediately
                setTimeout(function () {
                    $("#yesButton").focus();
                }, 250);
            }
        }
    });
}

//clears the cart
function clearCart()
{
    //delete the cart
    deleteCart();

    //hide the order and show the empty cart message
    $("#orderWrapper").hide();
    $("#emptyCartWrapper").show();

    //hide the dialog
    closeDialog();
}

//closes the dialog
function closeDialog() {
    $.magnificPopup.instance.close();
}

//****************************************************************************** AJAX
//determines if a video is available and its size
function getVideoAvailability(videoIndex, videoUid, callback)
{
    $.ajax({
      type: "GET",
          url: "https://trafficcamarchive.com/ws/browse/getVideoAvailability",
        dataType: "json",
        data: {
            videoUid: videoUid
        },
        success: function (data) {
            callback(videoIndex, data);
        },
        error: function (xhr) {
            window.location.replace("500.html");
        }
    });
}

//gets camera location data for a camera
function getCameraLocation(videoIndex, cameraId, callback)
{
    $.ajax({
      type: "GET",
          url: "https://trafficcamarchive.com/ws/browse/getCameraLocation",
        dataType: "json",
        data: {
            cameraId: cameraId
        },
        success: function (data) {
            callback(videoIndex, data);
        },
        error: function (xhr) {
            window.location.replace("500.html");
        }
    });
}