$(function () {

    //hide the footer since the page is built asynchronously
    hideFooter();

    //if the purchase ID is specified, prepopulate the text field and check the status
    if (typeof getUrlParameter("purchaseId") !== "undefined")
    {
        $("#purchaseId").val(getUrlParameter("purchaseId"));
        $(".checkAnotherOrBrowseLinkWrapper").show();
        checkStatus(false);
    } else
    {
        $(".browseLinkWrapper").show();
        $("#purchaseIdInputWrapper").show();

        //update the footer now that loading is finished
        updateFooter();
    }

    //enter key on the purchase ID
    $("#purchaseId").keypress(function (event) {
        if (event.which === 13)
            checkStatus();
    });
});

//initialize when the page is shown and persisted (this is needed for back on mobile or the page won't update)
window.addEventListener("pageshow", function (evt) {

    //when the cached page is shown (i.e. back on mobile), reload the page otherwise things (i.e. Ajax) are broken
    if (evt.persisted)
        window.location.reload();
}, false);

//flag used to prevent setting multiple timers for auto status checking
var autoChecking = false;
//flag used to stop auto checking status once the order is fulfilled
var fulfilled = false;

//checks the order status
//manual being true means that the user entered the purchase ID, false means it was URL provided
function checkStatus(manual)
{
    //reset
    $("#orderStatusHeader").html("Order Status");
    $("#purchaseId").removeClass("invalid");
    $("#invalidPurchaseId").hide();
    $("#tableBody").html("");
    $("#fulfillmentFailed").hide();
    $("#orderStatusWrapper").hide();
    $("#processingMessage").hide();
    $("#fulfilledMessage").hide();
    $("#purgedMessage").hide();

    //get the purchase ID
    var purchaseId = $("#purchaseId").val().trim();

    //is the purchase ID invalid
    if (purchaseId.length !== 8)
    {
        //highlight the invalid purchase ID and show a message
        $("#purchaseId").addClass("invalid");
        $("#invalidPurchaseId").show();
        $("#purchaseIdInputWrapper").show();
        $(".checkAnotherOrBrowseLinkWrapper").hide();
        $(".browseLinkWrapper").show();

        //update the footer now that loading is finished
        updateFooter();

        return;
    }

    //get the order
    getOrder(purchaseId, function (data) {

        //make sure the purchase exists
        if (!data.purchaseExists) {

            //highlight the invalid purchase ID and show a message
            $("#purchaseId").addClass("invalid");
            $("#invalidPurchaseId").show();
            $("#purchaseIdInputWrapper").show();
            $(".checkAnotherOrBrowseLinkWrapper").hide();
            $(".browseLinkWrapper").show();

            //update the footer now that loading is finished
            updateFooter();

            return;
        }

        //update the header to display the purchase ID
        $("#orderStatusHeader").html("Order Status - " + purchaseId);

        //set the flag (to prevent auto checking once fulfilled)
        fulfilled = data.purchase.fulfilled;

        //purchase details
        $("#purchasedOn").html(data.purchase.dateTimeCreated);
        $("#email").html(data.purchase.emailAddress);
        $("#totalPrice").html(data.purchase.totalPricePlusTax + " (" + data.purchase.totalPrice + " + " + data.purchase.taxAmount + " sales tax)");

        //if fulfillment failed, inform the user and abort
        if (data.purchase.fulfillmentFailed) {
            $("#fulfillmentFailed").show();

            //update the footer now that loading is finished
            updateFooter();

            return;
        }

        //populate the table with the purchased videos
        $.each(data.purchaseVideos, function (index, purchaseVideo) {

            var availability;

            if (data.purchase.fulfillmentFailed)
                availability = "Fulfillment Failed";
            else if (data.purchase.purged)
                availability = "Unavailable<br/>Expired on " + data.purchase.expirationDateTime;
            else if (!data.purchase.fulfilled)
            {
                availability = "Processing";

                //show the processing image unless the status check was manual (user entered)
                if (!manual)
                {
                    availability += "<br/>";
                    availability += "<img src='images/loading.gif' class='processingImage'>";
                }
            } else if (purchaseVideo.downloadUrl !== null)
            {
                availability = "<a href='" + purchaseVideo.downloadUrl + "' target='_blank'" +
                        " onclick='incrementDownloadCount(\"" + purchaseId + "\"," + purchaseVideo.cameraId + "," + purchaseVideo.dateTime + ")'>Download Video</a><br/>Expires " + data.purchase.expirationDateTime;
            } else
                availability = "Unavailable";

            $("#tableBody").append("<tr>"
                    + "<td>" + purchaseVideo.cameraName + "<br/><span class='locationData'>" + purchaseVideo.locationName + ", " + purchaseVideo.regionName + "</span></td>"
                    + "<td nowrap>" + formatYearMonthDay(purchaseVideo.year, purchaseVideo.month, purchaseVideo.day) + "<br/>" + formatHour(purchaseVideo.hour) + "</td>"
                    + "<td>$" + formatNumber(purchaseVideo.price) + "</td>"
                    + "<td>" + availability + "</td>"
                    + "</tr>");
        });

        //show the order status
        $("#orderStatusWrapper").show();

        //show a message when purged and when fulfilled
        if (data.purchase.purged)
            $("#purgedMessage").show();
        else if (data.purchase.fulfilled)
            $("#fulfilledMessage").show();

        //inform the user when still processing
        if (!data.purchase.fulfillmentFailed && !data.purchase.purged && !data.purchase.fulfilled)
        {
            $("#processingMessage").show();

            //if not already auto checking and the purchase ID was supplied in the URL, set a timer to auto check status
            if (!autoChecking && typeof getUrlParameter("purchaseId") !== "undefined")
            {
                $("#autoCheckMessage").show();

                //set the flag
                autoChecking = true;

                //set a timer to check the status
                setInterval(function () {

                    //do nothing if the order is fulfilled
                    if (fulfilled)
                        return;

                    //check the status
                    checkStatus();
                }, 30000);
            }
        }

        //update the footer now that loading is finished
        updateFooter();
    });
}

//****************************************************************************** AJAX
//gets order information
function getOrder(purchaseId, callback)
{
    $.ajax({
      type: "GET",
          url: "ws/order/getOrder",
        dataType: "json",
        data: {
            purchaseId: purchaseId
        },
        success: function (data) {
            callback(data);
        },
        error: function (xhr) {
            window.location.replace("500.html");
        }
    });
}

//increments the download count for a purchased video
function incrementDownloadCount(purchaseId, cameraId, dateTime)
{
    $.ajax({
        type: "PUT",
        url: "ws/order/incrementDownloadCount",
        data: {
            purchaseId: purchaseId,
            cameraId: cameraId,
            dateTime: dateTime
        }
    });
}