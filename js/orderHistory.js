$(function () {
});

//called when the submit button is clicked
function submitButtonClicked()
{
    //hide the invalid email message
    $("#invalidEmailMessage").hide();
    $("#email").removeClass("invalid");

    //get the entered email address
    var email = $("#email").val().trim();

    //validate the email address
    if (!isEmail(email))
    {
        $("#invalidEmailMessage").show();
        $("#email").addClass("invalid");
        return;
    }

    //send the order history
    sendOrderHistory(email);

    //show post submit content
    $("#instructions").hide();
    $("#emailInputWrapper").hide();
    $("#emailVerify").html(email);
    $("#postSubmitMessage").show();
}

//****************************************************************************** AJAX
//sends order history to a customer
function sendOrderHistory(email)
{
    $.ajax({
        type: "PUT",
        url: "ws/order/sendOrderHistory",
        data: {
            email: email
        },
        error: function (xhr) {
            //take the user to the error page on failure (don't just ignore)
            window.location.href = "500.html";
        }
    });
}