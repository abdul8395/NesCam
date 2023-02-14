//get parameters (used globably)
var cameraId;
var cameraName;
var year;
var month;
var day;

//flag to scroll to checkout only once
var scrolledToCheckout = false;

$(function () {

    //hide the footer since the page is built asynchronously
    hideFooter();

    //if parameters are missing, start over
    if (typeof getUrlParameter("cameraId") === "undefined"
            || typeof getUrlParameter("name") === "undefined"
            || typeof getUrlParameter("year") === "undefined"
            || typeof getUrlParameter("month") === "undefined"
            || typeof getUrlParameter("day") === "undefined")
    {
        window.location.replace("selectState.jsp");
    }

    //get the parameters (as ints for numeric values)
    cameraId = parseInt(getUrlParameter("cameraId"));
    cameraName = getUrlParameter("name");
    year = parseInt(getUrlParameter("year"));
    month = parseInt(getUrlParameter("month"));
    day = parseInt(getUrlParameter("day"));

    //if parameters failed to parse, start over instead (user tampered with parameters in URL)
    if (isNaN(cameraId) || isNaN(year) || isNaN(month) || isNaN(day))
        window.location.replace("selectState.jsp");

    //set the camera name
    $("#cameraInfo").html("<div id='cameraName'>" + cameraName + "</div>");

    //get the price per hour of video for the location
    getPricePerHour(cameraId, function (pricePerHour) {

        //get video information
        getVideoInfo(cameraId, year, month, day, function (videoData)
        {
            //clear the table body
            $("#tableBody").html("");

            //the number of videos available for the day
            var numAvailableVideos = 0;

            //create the hour entries
            $.each(videoData, function (index, videoInfo) {
                if (videoInfo.available)
                {
                    numAvailableVideos++;

                    //is the hour already in the cart
                    var alreadyInCart = inCart(cameraId, videoInfo.uid, year, month, day, videoInfo.hour);

                    $("#tableBody").append("<tr>"
                            + "<td>"
                            + (!alreadyInCart ? "<button class='addToCartButton' onclick='addToCartStep1(this, \"" + videoInfo.uid + "\", " + videoInfo.hour + ", " + videoInfo.duration + ", " + pricePerHour + ")'>Add to Cart</button>" :
                                    "<button class='addToCartButton inCart' onclick='addToCartStep1(this, \"" + videoInfo.uid + "\", " + videoInfo.hour + ", " + videoInfo.duration + ", " + pricePerHour + ")'>In Cart</button>")
                            + "</td>"
                            + "<td>" + formatHour(videoInfo.hour) + (videoInfo.dst ? "<div class='dstInfo'>Day Light Savings</div>" : "") + "</td>"
                            + "<td><span class='previewLink' onclick='previewVideo(\"" + videoInfo.uid + "\", " + videoInfo.duration + ")'>View Preview</span></td>"
                            + "<td>$" + pricePerHour + "</td>"
                            + "</tr>");
                } else
                {
                    $("#tableBody").append("<tr class='notAvailable'>"
                            + "<td><button disabled class='addToCartButton notAvailableButton'>Not Available</button></td>"
                            + "<td>" + formatHour(videoInfo.hour) + (videoInfo.dst ? "<div class='dstInfo'>Day Light Savings</div>" : "") + "</td>"
                            + "<td></td>"
                            + "<td></td>"
                            + "</tr>");
                }
            });

            //add the number of hours to the camera info
            $("#cameraInfo").append("<div id='numVideos'>" + numAvailableVideos + (numAvailableVideos === 1 ? " hour" : " hours")
                    + " of video available on " + formatYearMonthDay(year, month, day) + "</div>");

            //show the checkout button if the cart is not empty
            if (cartSize() > 0)
                $("#checkoutButton").css("display", "block");

            //update the footer now that loading is finished
            updateFooter();
        });
    });

    //show the instructinos dialog if there is no cookie to suppress it
    if (typeof Cookies.get("browseVideoInstructions") === "undefined")
        $.magnificPopup.open({
            closeOnBgClick: false,
            items: {
                src: "#instructionsDialog",
                type: "inline"
            },
            callbacks: {
                close: function () {
                    //set a cookie to prevent the instructions dialog for appearing again for a long time
                    Cookies.set("browseVideoInstructions", "true", {expires: 365});
                }
            }
        });
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

//video info for videos that need to be confirmed
var confirmElement;
var confirmCameraId;
var confirmVideoUid;
var confirmYear;
var confirmMonth;
var confirmDay;
var confirmHour;
var confirmPricePerHour;

//called when the add to cart button is clicked
function addToCartStep1(element, videoUid, hour, duration, pricePerHour)
{
    //set the confirm variables
    confirmElement = element;
    confirmCameraId = cameraId;
    confirmVideoUid = videoUid;
    confirmYear = year;
    confirmMonth = month;
    confirmDay = day;
    confirmHour = hour;
    confirmPricePerHour = pricePerHour;

    //is the hour already in the cart
    var alreadyInCart = inCart(cameraId, videoUid, year, month, day, hour);

    //confirm if duration is less than 57 minutes or greater than 63 minutes
    if (!alreadyInCart && (duration < 57 * 60 || duration > 63 * 60))
        showConfirmDialog(duration, duration < 57 * 60);
    else
        addToCartStep2(pricePerHour);
}

//the second step of adding or removing an item to/from the cart
function addToCartStep2(pricePerHour) {

    //is the hour already in the cart
    var alreadyInCart = inCart(confirmCameraId, confirmVideoUid, confirmYear, confirmMonth, confirmDay, confirmHour);

    //add to cart vs remove from cart
    if (!alreadyInCart)
    {
        addToCart(cameraName, confirmCameraId, confirmVideoUid, confirmYear, confirmMonth, confirmDay, confirmHour, pricePerHour);
        $(confirmElement).addClass("inCart").html("In Cart");
    } else
    {
        removeFromCart(confirmCameraId, confirmVideoUid, confirmYear, confirmMonth, confirmDay, confirmHour);
        $(confirmElement).removeClass("inCart").html("Add to Cart");
    }

    //show/hide the checkout button based on the cart contents
    if (cartSize() !== 0)
        $("#checkoutButton").css("display", "block");
    else
        $("#checkoutButton").hide();

    //scroll to the checkout button if that hasn't already happened
    if (!alreadyInCart && !scrolledToCheckout)
    {
        scrolledToCheckout = true;

        //scroll to the checkout button
        $("html, body").delay(500).animate({
            scrollTop: ($('#checkoutButton').offset().top)
        }, 1000);
    }

    //close the dialog if it is open
    closeDialog();
}

//shows a confirm dialog for sub-optimal videos
function showConfirmDialog(duration, tooShort) {

    //the duration in minutes (-1 means unknown)
    var durationMinutes = duration === -1 ? -1 : Math.round(duration / 60);

    //set the duration explanation
    if (tooShort)
    {
        //less than an hour
        $("#durationExplanation").html("The duration of this video may be less than an hour. ");

        //the reported duration
        if (durationMinutes === -1)
            $("#durationExplanation").append("The actual duration is reported as unknown.");
        else if (durationMinutes === 0)
            $("#durationExplanation").append("The actual duration is reported as one minute or less.");
        else if (durationMinutes === 1)
            $("#durationExplanation").append("The actual duration is reported as one minute.");
        else
            $("#durationExplanation").append("The actual duration is reported as " + formatNumber(durationMinutes) + " minutes.");
    } else
    {
        //when too long, the real duration is unknown
        $("#durationExplanation").html("The duration of this video is unknown.");
    }

    //show the dialog
    $.magnificPopup.open({
        items: {
            src: "#confirmDialog",
            type: "inline"
        },
        callbacks: {
            open: function () {
                //for unknown reasons, the focus cannot be set immediately
                setTimeout(function () {
                    $("#addToCartButton").focus();
                }, 250);
            }
        }
    });
}

//closes the dialog
function closeDialog() {
    $.magnificPopup.instance.close();
}

//called when a view preview link is clicked
function previewVideo(videoUid, duration)
{
    //show the dialog
    $.magnificPopup.open({
        closeOnBgClick: false,
        enableEscapeKey: false,
        showCloseBtn: false,
        items: {
            src: "#loadingDialog",
            type: "inline"
        }
    });

    //make sure the images are prepared before loading them
    preparePreviewImages(videoUid, function (numFrames) {

        //close the loading dialog
        closeDialog();

        var items;

        //when no frames are available, include one frame that will end up loading a frame not available image
        //otherwise create the items array with the frames
        if (numFrames === 0) {
            items = [{
                    src: "https://trafficcamarchive.com/ws/browse/getPreviewImage?videoUid=" + videoUid + "&index=0",
                    type: "image"
                }];
        } else {
            items = [numFrames];

            for (var j = 0; j < numFrames; j++)
            {
                //the minute of the frame
                var minute = Math.round(duration / 60 * (j / numFrames));

                //minute zero doesn't make much sense so make it minute one
                if (minute === 0)
                    minute = 1;

                items[j] = {
                    src: "https://trafficcamarchive.com/ws/browse/getPreviewImage?videoUid=" + videoUid + "&index=" + j,
                    type: "image",
                    title: (duration <= 63 * 60 ? "A frame from minute " + minute : "")
                };
            }
        }

        //load the images after they have been prepared, on failure a not available image will appear
        $.magnificPopup.open({
            gallery: {enabled: true},
            items: items
        });
    });
}

//called when the checkout button is clicked
function checkoutButtonClicked()
{
    window.location.href = "shoppingCart.html";
}

//****************************************************************************** AJAX
//gets the price per hour of video
function getPricePerHour(cameraId, callback)
{
    $.ajax({
      type: "GET",
          url: "https://trafficcamarchive.com/ws/browse/getPricePerHour",
        dataType: "text",
        data: {
            cameraId: cameraId
        },
        success: function (data) {
            callback(data);
        },
        error: function (xhr) {
            window.location.replace("500.html");
        }
    });
}

//gets video information for a camera for a single day
function getVideoInfo(cameraId, year, month, day, callback)
{
    $.ajax({
      type: "GET",
          url: "https://trafficcamarchive.com/ws/browse/getVideoInfo",
        dataType: "json",
        data: {
            cameraId: cameraId,
            year: year,
            month: month,
            day: day
        },
        success: function (data) {
            callback(data);
        },
        error: function (xhr) {
            window.location.replace("500.html");
        }
    });
}

//prepares preview images
function preparePreviewImages(videoUid, callback)
{
    $.ajax({
      type: "GET",
          url: "https://trafficcamarchive.com/ws/browse/preparePreviewImages",
        dataType: "text",
        data: {
            videoUid: videoUid
        },
        success: function (numFrames) {
            callback(parseInt(numFrames));
        },
        error: function (xhr) {
            window.location.replace("500.html");
        }
    });
}