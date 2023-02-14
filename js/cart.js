var cart = [];

$(function () {

    //initialize the page
    initialize_cart();
});

//load and update the cart image when the page is shown and persisted (this is needed for back on mobile or the cart won't update)
window.addEventListener("pageshow", function (evt) {

    //initialize the page even when cached
    if (evt.persisted)
        initialize_cart();
}, false);

//initializes the page
function initialize_cart()
{
    loadCart();
    updateCartImage();
}

//updates the cart image based on the number of videos in the cart
function updateCartImage()
{
    if (cartSize() < 10)
        $("#shoppingCart").attr("src", "images/cart" + cartSize() + ".png?tcaGen=2");
    else
        $("#shoppingCart").attr("src", "images/cartPlus.png?tcaGen=2");
}

//called when the cart is clicked
function cartClicked()
{
    //ignore if the the ignoreClick class is present
    if ($("#shoppingCart").hasClass("ignoreClick"))
        return;

    window.location.href = "/trafficcamarchive/shoppingCart.html";
    // window.location.href = "/shoppingCart.html";
    
}

//adds a video to the cart unless it is already in the cart
function addToCart(cameraName, cameraId, uid, year, month, day, hour, pricePerHour)
{
    //do not add if already in the cart
    if (inCart(cameraId, uid, year, month, day, hour))
        return;

    //add to the array
    cart.push({
        cameraName: cameraName,
        cameraId: cameraId,
        uid: uid,
        year: year,
        month: month,
        day: day,
        hour: hour,
        pricePerHour: pricePerHour
    });

    //sort the cart
    cart.sort(compareVideos);

    //save the cart
    saveCart();

    //update the cart image
    updateCartImage();

    //if a stripe client secret exists, get rid of it
    Cookies.remove("stripeClientSecret");
}

//removes a video from the cart
function removeFromCart(cameraId, uid, year, month, day, hour)
{
    //get the index of the video
    var index = getVideoIndex(cameraId, uid, year, month, day, hour);

    //not in cart
    if (index === -1)
        return;

    //remove the element
    cart.splice(index, 1);

    //save the cart
    saveCart();

    //update the cart image
    updateCartImage();

    //if a stripe client secret exists, get rid of it
    Cookies.remove("stripeClientSecret");
}

//saves the cart as JSON to a cookie
function saveCart()
{
    Cookies.set("cart", JSON.stringify(cart), {expires: 7});
}

//loads the cart from a JSON cookie
function loadCart()
{
    var savedCart = Cookies.get("cart");

    if (typeof savedCart !== "undefined")
        cart = JSON.parse(savedCart);
}

//empties the cart (resets the cart array and deletes the cookie)
function deleteCart()
{
    //reset the cart array
    cart = [];

    //delete the cookie
    Cookies.remove("cart");

    //update the cart image
    updateCartImage();

    //if a stripe client secret exists, get rid of it
    Cookies.remove("stripeClientSecret");
}

//gets the index of the video in the cart array or -1 if the video is not in the cart
function getVideoIndex(cameraId, uid, year, month, day, hour)
{
    for (var j = 0; j < cart.length; j++)
        if (cart[j].cameraId === cameraId && cart[j].uid === uid && cart[j].year === year && cart[j].month === month && cart[j].day === day && cart[j].hour === hour)
            return j;

    return -1;
}

//determines if a video is in the cart
function inCart(cameraId, uid, year, month, day, hour)
{
    return getVideoIndex(cameraId, uid, year, month, day, hour) !== -1;
}

//gets the number of videos in the cart
function cartSize()
{
    return cart.length;
}

//compares two videos (for sorting)
function compareVideos(v1, v2)
{
    //camera ID
    if (v1.cameraId < v2.cameraId)
        return -1;
    else if (v1.cameraId > v2.cameraId)
        return 1;

    //year
    if (v1.year < v2.year)
        return -1;
    else if (v1.year > v2.year)
        return 1;

    //month
    if (v1.month < v2.month)
        return -1;
    else if (v1.month > v2.month)
        return 1;

    //day
    if (v1.day < v2.day)
        return -1;
    else if (v1.day > v2.day)
        return 1;

    //hour
    if (v1.hour < v2.hour)
        return -1;
    else if (v1.hour > v2.hour)
        return 1;

    //v1 and v2 are the same
    return 0;
}

//gets the cart as JSON
function getCartJson()
{
    return JSON.stringify(cart);
}