/*
 Transitive by TEMPLATED
 templated.co @templatedco
 Released for free under the Creative Commons Attribution 3.0 license (templated.co/license)
 */

(function ($) {

    skel.breakpoints({
        xlarge: '(max-width: 1680px)',
        large: '(max-width: 1280px)',
        medium: '(max-width: 980px)',
        small: '(max-width: 800px)',
        xsmall: '(max-width: 480px)'
    });

    $(function () {

        var $window = $(window);
        var $body = $('body');
        var $header = $('#header');
        var $banner = $('#banner');

        //remove the is-loading class after a moment
        window.setTimeout(function () {
            $body.removeClass('is-loading');
        }, 250);

        // Prioritize "important" elements on medium.
        skel.on('+medium -medium', function () {
            $.prioritize(
                    '.important\\28 medium\\29',
                    skel.breakpoint('medium').active
                    );
        });

        // Fix: Placeholder polyfill
        $('form').placeholder();

        // Header
        if (skel.vars.IEVersion < 9)
            $header.removeClass('alt');

        if ($banner.length > 0 && $header.hasClass('alt'))
        {
            $window.on('resize', function () {
                $window.trigger('scroll');
            });

            $banner.scrollex({
                bottom: $header.outerHeight(),
                terminate: function () {
                    $header.removeClass('alt');
                },
                enter: function () {
                    $header.addClass('alt');
                },
                leave: function () {
                    $header.removeClass('alt');
                    $header.addClass('reveal');
                }
            });
        }

        // Banner
        if ($banner.length > 0)
        {
            // IE fix
            if (skel.vars.IEVersion < 12)
            {
                $window.on('resize', function ()
                {
                    var wh = $window.height() * 0.60, bh = $banner.height();

                    $banner.css('height', 'auto');

                    window.setTimeout(function () {
                        if (bh < wh)
                            $banner.css('height', wh + 'px');
                    }, 0);
                });

                $window.on('load', function ()
                {
                    $window.triggerHandler('resize');
                });
            }

            //learn more button
            $banner.find('.more').addClass('scrolly');
        }

        // Scrolly
        if ($(".scrolly").length)
        {
            var $height = $('#header').height() * 0.95;

            $('.scrolly').scrolly({
                offset: $height
            });
        }

        // Menu
        $('#menu')
                .append('<a href="#menu" class="close"></a>')
                .appendTo($body)
                .panel({
                    delay: 500,
                    hideOnClick: true,
                    hideOnSwipe: true,
                    resetScroll: true,
                    resetForms: true,
                    side: 'right'
                });
    });

})(jQuery);