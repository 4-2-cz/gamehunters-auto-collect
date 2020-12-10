// ==UserScript==
// @id           gamehunters-auto-collect@pida42
// @name         GameHunters.club - Auto collect free WSOP chips
// @version      1.0
// @namespace    http://github.com/pida42/gamehunters-auto-collect
// @updateURL    http://github.com/pida42/gamehunters-auto-collect/raw/master/gamehunters-auto-collect.js
// @downloadURL  http://github.com/pida42/gamehunters-auto-collect/raw/master/gamehunters-auto-collect.js
// @description  Auto collect free WSOP chips
// @license      MIT
// @match        *://gamehunters.club/*
// @match        *://www.gamehunters.club/*
// @require      https://code.jquery.com/jquery-2.1.4.min.js
// @grant        GM_openInTab
// @run-at       document-ready
// ==/UserScript==

// ~~~~~
// - auto login when the default open page is https://gamehunters.club/sign-up/
// - replaces gamehuters auto-collect feature with this script, which runs 24/7
// ~~~~~

(function(jQuery, open){

    console.debug(":: GameHunters.club - Auto collect free WSOP chips");

    // Handle Ajax requests
    XMLHttpRequest.prototype.open = function(){

        // Handle ready event
        this.addEventListener("readystatechange", function(){

            // Fetch bonus links only if script is started
            if(true === Main._scriptState) Main.handleBonusLinks(this);

        }, false);

        // Apply request (continue)
        open.apply(this, arguments);
    };

    var Main = {

        /** @var int Check new bonus interval in secons */
        _reloadInterval: 5,

        /** @var int Bonus popup window close timeout in secons */
        _closeTimeout: 60,

        /** @var bool Semafor fo script state */
        _scriptState: false,

        /** @var null|object Temp variable - store return from setTimeout() */
        _reloadTimeout: null,

        /**
         * Create start/stop button and remove original obsolete buttons for auto collecting
         *
         * @return void
         */
        makeButtons: function(){

            // Remove old obsolete buttons
            jQuery('.user_controls .start_auto_collect').parent('li:eq(0)').remove();
            jQuery('.user_controls .user_interval').parent('li:eq(0)').remove();

            // Create new start/stop button
            jQuery('.user_controls ul:eq(0)').append('<li><div class="btn btn-success btn-sm wsop-script-collect">START SCRIPT</div></li>');

            /** @var object Button selector object */
            var buttonDiv = jQuery('.user_controls .wsop-script-collect');

            // Handle start/stop button click event
            jQuery('.user_controls ul li:last').click(function(){

                switch(buttonDiv.hasClass('btn-success')){
                    // If start/stop button is disabled (ready to start)
                    case true:

                        // Enabled script semafor
                        Main._scriptState = true;

                        // Change button text
                        buttonDiv.removeClass('btn-success').addClass('btn-disabled').text('STOP SCRIPT');

                        // Reload bonus links
                        Main.reloadBonuses();

                        break;

                    // If start/stop button is enabled (running, ready to stop)
                    case false:

                        // Disable script semafor
                        Main._scriptState = false;

                        // Change button text
                        buttonDiv.removeClass('btn-disabled').addClass('btn-success').text('START SCRIPT');

                        break;
                }
            });

            // Trigger button click()
            window.setTimeout(function(){
                buttonDiv.click();
            },4200);
        },

        /**
         * Handle Ajax request.
         * Returns TRUE when request contains some bonus link.
         *
         * @return bool
         */
        handleBonusLinks: function(request){

            // If request is not for fetching bonus links
            if(false === request.responseURL.match(/https\:\/\/gamehunters\.club\/wsop\-texas\-holdem\-poker\/share\-links\/loader\/\?cache\=.+/g)) return false;

            /** @var object Parsed response to JSON object */
            var responseJson = JSON.parse(request.responseText);

            /** @var array Parsed bonus links into array */
            var bonusLinks = jQuery.parseHTML(responseJson.bonus_links);

            // Request does not contain bonus links
            if(null === bonusLinks || 0 === bonusLinks.length || typeof bonusLinks[1] === undefined){

                // Fetch new bonus links
                Main._reloadTimeout = setTimeout(function(){

                    // Fetch bonus links only if script is started
                    if(true === Main._scriptState) Main.reloadBonuses();

                }, Main._reloadInterval * 1000);

                return false;
            }

            // Open popup window and collect bonus
            this.collectBonus(bonusLinks);

            return true;
        },

        /**
         * Open popup window, collect bonus, close window and reload bonus links
         *
         * @var array Array of bonus links
         * @return bool TRUE = ok | FALSE = error
         */
        collectBonus: function(bonusLinks){

            // Can not find bonus link in loaded DOM
            if(typeof jQuery(bonusLinks[1]).find('a:first-child').data('item') === undefined) return false;

            /** @var string ID of bonus link */
            var bonusId = jQuery(bonusLinks[1]).find('a:first-child').data('item').toString();

            /** @var string URL for popup window */
            var collectUrl = 'https://gamehunters.club/wsop-texas-holdem-poker/share-links/click/' + bonusId + '?play_on=playwsop_com';

            /** @var object Popup window object instance */
            var newWindow = window.open(collectUrl, 'Auto collect bonus', 'scrollbars=yes, width=1, height=1, top=0, left=0');

            // Error while openning popup window - blocked popup windows?
            if(newWindow.length < 0) return false;

            // Move window to botton left window position
            newWindow.moveTo(0,window.screen.availHeight+10);

            // Close popup window and reload bonus links
            Main._reloadTimeout = setTimeout(function(){

                // Close pupup
                newWindow.location.replace(collectUrl);
                newWindow.close();

                // Reload bonus links only if script is enabled
                if(true === Main._scriptState) Main.reloadBonuses();

            }, Main._closeTimeout * 1000);

            return true;
        },

        /**
         * Reload bonus links (fake Reload button click)
         *
         * @return void
         */
        reloadBonuses: function(){

            // Remove timeout if some older exists
            clearTimeout(Main._reloadTimeout);
            Main._reloadTimeout = null;

            // Fake Reload button click - reload bonus links
            jQuery('.user_control_reload:eq(0)').click();
        },

        /**
         * Handle login form, automatic login and reload site to WSOP links
         *
         * @return void
         */
        handleLogin: function(){

            if(false === document.location.href.match(/https\:\/\/gamehunters\.club\/sign\-up/g)) return false;

            var loginForm = jQuery('form[action="/sign-up/login/"]');

            if(!loginForm.length){
                if(!document.location.href.match(/https\:\/\/gamehunters\.club\/wsop\-texas\-holdem\-poker\/share\-links/g)){
                    document.location.href = 'https://gamehunters.club/wsop-texas-holdem-poker/share-links';
                }
            }

            window.setTimeout(function(){loginForm.submit()},4200);
        }
    };

    // Create button for script start/stop switch
    Main.makeButtons();

    // Handle auto login
    Main.handleLogin();

})(jQuery, XMLHttpRequest.prototype.open);
