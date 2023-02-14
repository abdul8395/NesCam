//the dates video is available
var videoDates;
//the selected date
var selectedDate;

//flag to scroll to select date only once
var scrolledToSelectDate = false;

$(function () {

    //hide the footer since the page is built asynchronously
    hideFooter();

    //if no camera defined, start over
    if (typeof getUrlParameter("cameraId") === "undefined")
        window.location.replace("selectState.jsp");

    //set the camera name
    $("#cameraInfo").html("<div id='cameraName'>" + getUrlParameter("name") + "</div>");

    //get the number of videos
    getNumVideos(getUrlParameter("cameraId"), function (numVideos) {

        $("#cameraInfo").append("<div id='numVideos'>" + formatNumber(numVideos) + (numVideos === "1" ? " hour" : " hours") + " of video available</div>");

        //show the link to select a different camera if no hours are available
        if (numVideos === "0")
            $(".browseLinkWrapper").show();
    });

    //get the dates that video is available and then build the calendar
    getVideoDates(getUrlParameter("cameraId"), function (videoDateData) {

        videoDates = videoDateData;

        //create the calendar
        var calendar = jsCalendar.new(document.getElementById("calendar"), null,
                {
                    language: "en",
                    monthFormat: "month YYYY",
                    dayFormat: "DDD",
                    //1 = Sunday, 2 = Monday
                    firstDayOfTheWeek: 1,
                    //month navigation buttons
                    navigator: true,
                    //both | left | right
                    navigatorPosition: "both",
                    //min date (these do not appear to work)
                    min: false,
                    //max date
                    max: false
                }, videoDates);

        //restore the previous date (i.e. month) if possible
        if (typeof Cookies.get("selectedDate") !== "undefined")
            calendar.set(new Date(Cookies.get("selectedDate")));

        //the date selected event
        var dateSelected = function (event, date) {

            //the link is initially hidden to reduce confusion
            $(".browseLinkWrapper").show();

            //is video available for the selected day
            if (isAvailable(date))
            {
                //set the selected date
                selectedDate = date;

                //save the selected date as a cookie to restore the selection if the user comes back within eight hours
                Cookies.set("selectedDate", selectedDate.toJSON(), {expires: 8});

                $("#noVideoAvailable").hide();
                $("#nextButton").html("Select Date");
                $("#nextButton").css("display", "block");

                //scroll to the next button
                if (!scrolledToSelectDate)
                {
                    scrolledToSelectDate = true;

                    $("html, body").delay(500).animate({
                        scrollTop: ($('#nextButton').offset().top)
                    }, 1000);
                }
            } else
            {
                $("#nextButton").hide();
                $("#noVideoAvailable").html("No video available on " + formatDate(date));
                $("#noVideoAvailable").show();
            }
        };

        //add a date click handler
        calendar.onDateClick(dateSelected);

        //detect swipe events and switch months
        detectSwipe("calendar", function (element, direction) {
            if (direction === "r")
                calendar.previous();
            else if (direction === "l")
                calendar.next();
        });

        //update the footer now that loading is finished
        updateFooter();
    });

    //show the instructinos dialog if there is no cookie to suppress it
    if (typeof Cookies.get("browseDatesInstructions") === "undefined")
        $.magnificPopup.open({
            closeOnBgClick: false,
            items: {
                src: "#instructionsDialog",
                type: "inline"
            },
            callbacks: {
                close: function () {
                    //set a cookie to prevent the instructions dialog for appearing again for a long time
                    Cookies.set("browseDatesInstructions", "true", {expires: 365});
                }
            }
        });
});

//goes back to browse cameras while restoring the map
function backToBrowseCameras()
{
    if (typeof Cookies.get("browseCamerasRestoreUrl") !== "undefined")
        window.location.replace(Cookies.get("browseCamerasRestoreUrl"));
    else
        window.location.replace(Cookies.get("browseCameras.html"));
}

//closes the dialog
function closeDialog() {
    $.magnificPopup.instance.close();
}

//returns true if video is available for the date
function isAvailable(date)
{
    var available = false;

    $.each(videoDates, function (index, videoDate) {
        if (date.getFullYear() === videoDate.year && date.getMonth() === videoDate.month && date.getDate() === videoDate.day)
        {
            available = true;
            //break the loop
            return false;
        }
    });

    return available;
}

//called when the next (select date) button is clicked
function nextButtonClicked()
{
    var year = selectedDate.getFullYear();
    var month = selectedDate.getMonth();
    var day = selectedDate.getDate();

    window.location.href = "browseVideo.html?cameraId=" + getUrlParameter("cameraId") + "&name=" + getUrlParameter("name")
            + "&year=" + year + "&month=" + month + "&day=" + day;
}

//used to detect a swipe event on an element (https://stackoverflow.com/questions/15084675/how-to-implement-swipe-gestures-for-mobile-devices)
function detectSwipe(el, func) {
    swipe_det = new Object();
    swipe_det.sX = 0;
    swipe_det.sY = 0;
    swipe_det.eX = 0;
    swipe_det.eY = 0;
    var min_x = 30;  //min x swipe for horizontal swipe
    var max_x = 30;  //max x difference for vertical swipe
    var min_y = 50;  //min y swipe for vertical swipe
    var max_y = 60;  //max y difference for horizontal swipe
    var direc = "";
    ele = document.getElementById(el);
    ele.addEventListener('touchstart', function (e) {
        var t = e.touches[0];
        swipe_det.sX = t.screenX;
        swipe_det.sY = t.screenY;
    }, false);
    ele.addEventListener('touchmove', function (e) {
        e.preventDefault();
        var t = e.touches[0];
        swipe_det.eX = t.screenX;
        swipe_det.eY = t.screenY;
    }, false);
    ele.addEventListener('touchend', function (e) {
        //horizontal detection
        if ((((swipe_det.eX - min_x > swipe_det.sX) || (swipe_det.eX + min_x < swipe_det.sX)) && ((swipe_det.eY < swipe_det.sY + max_y) && (swipe_det.sY > swipe_det.eY - max_y) && (swipe_det.eX > 0)))) {
            if (swipe_det.eX > swipe_det.sX)
                direc = "r";
            else
                direc = "l";
        }
        //vertical detection
        else if ((((swipe_det.eY - min_y > swipe_det.sY) || (swipe_det.eY + min_y < swipe_det.sY)) && ((swipe_det.eX < swipe_det.sX + max_x) && (swipe_det.sX > swipe_det.eX - max_x) && (swipe_det.eY > 0)))) {
            if (swipe_det.eY > swipe_det.sY)
                direc = "r";
            else
                direc = "l";
        }

        if (direc !== "") {
            if (typeof func === 'function')
                func(el, direc);
        }
        direc = "";
        swipe_det.sX = 0;
        swipe_det.sY = 0;
        swipe_det.eX = 0;
        swipe_det.eY = 0;
    }, false);
}

//****************************************************************************** AJAX
//gets the number of videos available for a camera
function getNumVideos(cameraId, callback)
{
    $.ajax({
      type: "GET",
          url: "https://trafficcamarchive.com/ws/browse/getNumVideos",
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

//gets the dates that video is available for a camera
function getVideoDates(cameraId, callback)
{
    $.ajax({
      type: "GET",
          url: "https://trafficcamarchive.com/ws/browse/getVideoDates",
        dataType: "json",
        mode: 'no-cors',
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
