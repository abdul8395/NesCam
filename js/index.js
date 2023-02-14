$(function () {

    //get and show statistics
    getStatistics(function (data) {
        $("#statistics").html(formatNumber(data.hours) + " videos in the archive").show();
    });
});

//****************************************************************************** AJAX
//gets statistics
function getStatistics(callback)
{
    $.ajax({
      type: "GET",
        url: "https://trafficcamarchive.com/ws/browse/getStatistics",
        dataType: "json",
        mode: 'no-cors',
        success: function (data) {
            callback(data);
        }
    });
}