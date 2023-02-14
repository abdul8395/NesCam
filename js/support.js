$(function () {
});

//toggles the visibility of an FAQ
function toggleFaq(element)
{
    if ($(element).siblings(".answer").is(":hidden"))
        $(element).siblings(".answer").show();
    else
        $(element).siblings(".answer").hide();
}

//****************************************************************************** AJAX
//gets a captcha key
function getCaptchaKey(callback)
{
    $.ajax({
      type: "GET",
          url: "ws/captcha/getCaptchaKey",
        dataType: "text",
        success: function (key) {
            callback(key);
        },
        error: function (xhr) {
            //take the user to the error page on failure (don't just ignore)
            window.location.href = "500.html";
        }
    });
}