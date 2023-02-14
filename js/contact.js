//the captcha key (for submitting the form)
var captchaKey;

$(function () {

    //get a captcha key
    getCaptchaKey(function (key) {

        //remember the key
        captchaKey = key;

        //get the image
        $("#captchaImage").attr("src", "/ws/captcha/getCaptchaImage?key=" + key);
    });
});

//initialize when the page is shown and persisted (this is needed for back on mobile or the page won't update)
window.addEventListener("pageshow", function (evt) {

    //when the cached page is shown (i.e. back on mobile), reload the page otherwise things (i.e. Ajax) are broken
    if (evt.persisted)
        window.location.reload();
}, false);

//called when the submit button is clicked
function submitButtonClicked()
{
    //hide the invalid  message
    $("#invalidMessage").html("").hide();
    $("#email").removeClass("invalid");
    $("#reason").removeClass("invalid");
    $("#message").removeClass("invalid");
    $("#captcha").removeClass("invalid");

    //get the entered email address
    var email = $("#email").val().trim();

    //validate the email address
    if (!isEmail(email))
    {
        $("#invalidMessage").append("Invalid email address.");
        $("#email").addClass("invalid");
    }

    //get the reason
    var reason = $("#reason").children("option:selected").val();

    //validate the reason
    if (reason === "")
    {
        if ($("#invalidMessage").html().length !== 0)
            $("#invalidMessage").append("<br/>");

        $("#invalidMessage").append("Select a reason.");
        $("#reason").addClass("invalid");
    }

    //get the message
    var message = $("#message").val().trim();

    //validate the message
    if (message === "")
    {
        if ($("#invalidMessage").html().length !== 0)
            $("#invalidMessage").append("<br/>");

        $("#invalidMessage").append("Enter a message.");
        $("#message").addClass("invalid");
    }

    //get the captcha
    var captchaValue = $("#captcha").val().trim();

    //validate the captcha
    if (captchaValue.length !== 4)
    {
        if ($("#invalidMessage").html().length !== 0)
            $("#invalidMessage").append("<br/>");

        $("#invalidMessage").append("Enter the CAPTCHA.");
        $("#captcha").addClass("invalid");
    }

    //show the invalid message if it has contents
    if ($("#invalidMessage").html().length !== 0)
    {
        $("#invalidMessage").show();
        updateFooter();
        return;
    }

    //disable the submit button
    $("#submitButton").prop("disabled", true);

    //validate the captcha
    isCaptchaCorrect(captchaKey, captchaValue, function (result) {
        //if the captcha is incorrect, inform the user, enable the submit button and abort
        if (result === "false")
        {
            $("#captcha").addClass("invalid");
            $("#invalidMessage").html("Incorrect CAPTCHA").show();
            $("#submitButton").prop("disabled", false);

            return;
        }

        //submit the contact
        submitContact(captchaKey, captchaValue, email, reason, message, function () {
            $("#instructions").hide();
            $("#formWrapper").hide();
            $("#successMessage").show();
        });
    });
}

//****************************************************************************** AJAX
//gets a captcha key
function getCaptchaKey(callback)
{
    $.ajax({
      type: "GET",
          url: "ws/captcha/getCaptchaKey.js",
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

//determines if a captcha is correct
function isCaptchaCorrect(key, value, callback)
{
    $.ajax({
      type: "GET",
          url: "ws/captcha/isCaptchaCorrect",
        dataType: "text",
        data: {
            key: key,
            value: value
        },
        success: function (key) {
            callback(key);
        },
        error: function (xhr) {
            //take the user to the error page on failure (don't just ignore)
            window.location.href = "500.html";
        }
    });
}

//submits the contact
function submitContact(captchaKey, captchaValue, email, reason, message, callback)
{
    $.ajax({
        type: "post",
        url: "ws/contact/submitContact",
        data: {
            captchaKey: captchaKey,
            captchaValue: captchaValue,
            email: email,
            reason: reason,
            message: message
        },
        success: function () {
            callback();
        },
        error: function (xhr) {
            //take the user to the error page on failure (don't just ignore)
            window.location.href = "500.html";
        }
    });
}