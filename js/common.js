$(function () {

    //initial update (in case there is no scrolling available)
    updateFooter();

    //add a scroll handler
    $(window).scroll(function () {
        updateFooter();
    });
    
    //update the footer when the window resizes
    $(window).resize(function() {
        updateFooter();
    });
});

//for pages that load content asynchronously
function hideFooter()
{
    $("#pageFooter").hide();
}

//show or hide the footer based on the scroll position
function updateFooter()
{
    if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight - 5) {
        $("#pageFooter").show();
    } else
        $("#pageFooter").hide();
}

//gets a URL parameter value
function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
}

//determines if a value looks like an email address
//regex comes from https://emailregex.com/
function isEmail(email) 
{
    var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    
    return regex.test(email);
}

//determines if the browser supports self signed video (the realtime streams)
function doesBrowserSupportSelfSignedVideo()
{
    var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    
    if(isFirefox)
        return false;
    
    return true;
}

//hours
const hours = ["12 AM - 1 AM", "1 AM - 2 AM", "2 AM - 3 AM", "3 AM - 4 AM", "4 AM - 5 AM",
    "5 AM - 6 AM", "6 AM - 7 AM", "7 AM - 8 AM", "8 AM - 9 AM", "9 AM - 10 AM", "10 AM - 11 AM",
    "11 AM - 12 PM", "12 PM - 1 PM", "1 PM - 2 PM", "2 PM - 3 PM", "3 PM - 4 PM", "4 PM - 5 PM",
    "5 PM - 6 PM", "6 PM - 7 PM", "7 PM - 8 PM", "8 PM - 9 PM", "9 PM - 10 PM", "10 PM - 11 PM",
    "11 PM - 12 AM"];

//day names
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

//month names
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

//gets an hour range (0 - 23)
function formatHour(hour)
{
    return hours[hour];
}

//format the date (input is Date object)
function formatDate(date)
{
    return monthNames[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
}

//formats a date (input is year, month and day as integers)
function formatYearMonthDay(year, month, day)
{
    //create a date object to determine the day of the week
    var date = new Date(year, month, day);

    return dayNames[date.getDay()] + ", " + monthNames[month] + " " + day + ", " + year;
}

//formats a number with commas
function formatNumber(x)
{
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}