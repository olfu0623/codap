// ==========================================================================
//                          DG.GameView
//
//  Copyright (c) 2014 by The Concord Consortium, Inc. All rights reserved.
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
// ==========================================================================

/* globals iframePhone */
sc_require('components/game/game_controller');
sc_require('controllers/game_selection');
sc_require('libraries/iframe-phone');

/** @class

    (Document Your View Here)

 @extends SC.WebView
 */
DG.GameView = SC.View.extend(
    /** @scope DG.GameView.prototype */ {
      childViews: ['loadingView', 'webView'],

      value: '', isLoading: true,

      /**
       * Handles the old-style 'game' API using asynch iframePhone post-messaging
       * @property {DG.GamePhoneHandler}
       */
      gamePhoneHandler: null,

      /**
       * Handles the new-style 'data interactive' API using asynch iframePhone post-messaging
       * Brought into existence in March, 2016
       * @property {DG.DataInteractivePhoneHandler}
       */
      dataInteractivePhoneHandler: null,

      loadingView: SC.LabelView.extend({
        urlBinding: '*parentView.value',
        isLoadingBinding: '*parentView.isLoading',
        didConnectBinding: '*parentView.didConnect',
        classNames: ['dg-web-view'],
        classNameBindings: ['isLoading:dg-loading'],
        value: function () {
          if (this.getPath('isLoading')) {
            return 'DG.GameView.loading'.loc(this.get('url'));
          } else if (!this.get('didConnect')) {
            return 'DG.GameView.loadError'.loc(this.get('url'));
          } else {
            return '';
          }
        }.property('url', 'isLoading', 'didConnect')
      }),

      init: function () {
        sc_super();
        this.gamePhoneHandler = DG.GamePhoneHandler.create(
            {controller: this.get('controller')});
      },

      destroy: function () {
        if (this.gamePhoneHandler) {
          this.gamePhoneHandler.destroy();
          this.gamePhoneHandler = null;
        }
        if (this.dataInteractivePhoneHandler) {
          this.dataInteractivePhoneHandler.destroy();
          this.dataInteractivePhoneHandler = null;
        }
        sc_super();
      },

      webView: SC.WebView.extend({
        classNames: ['dg-web-view-frame'],
        valueBinding: '*parentView.value',
        controllerBinding: '*parentView.controller', // Setup iframePhone communication with the child iframe before it loads, so that connection
        // (iframe src will change when 'value' changes, but observers fire before bindings are synced)
        valueDidChange: function () {
          var tValue = this.get('value'), tGPHandler = this.get(
              'gamePhoneHandler');

          if (tValue !== this._previousValue) {

            // First discontinue listening to old game.
            if (tGPHandler.gamePhone) {
              tGPHandler.gamePhone.disconnect();
            }

            // Global flag used to indicate whether calls to application should be made via gamePhone, or not.
            tGPHandler.set('isGamePhoneInUse', false);

            tGPHandler.gamePhone = new iframePhone.IframePhoneRpcEndpoint(// TODO put this handler function somewhere appropriate rather than inlining it in (what is
                // at notionally) view code?

                function (command, callback) {
                  tGPHandler.set('isGamePhoneInUse', true);
                  tGPHandler.doCommand(command, function (ret) {
                    // Analysis shows that the object returned by DG.doCommand may contain Error values, which
                    // are not serializable and thus will cause DataCloneErrors when we call 'callback' (which
                    // sends the 'ret' to the game window via postMessage). The 'requestFormulaValue' and
                    // 'requestAttributeValues' API commands are the guilty parties. The following is an
                    // ad-hoc attempt to clean up the object for successful serialization.

                    if (ret && ret.error && ret.error instanceof Error) {
                      ret.error = ret.error.message;
                    }

                    if (ret && ret.values && ret.values.length) {
                      ret.values = ret.values.map(function (value) {
                        return value instanceof Error ? null : value;
                      });
                    }

                    // If there's a DataCloneError anyway, at least let the client know something is wrong:
                    try {
                      callback(ret);
                    } catch (e) {
                      if (e instanceof window.DOMException && e.name === 'DataCloneError') {
                        callback({success: false});
                      }
                    }
                  });
                }.bind(this), 'codap-game', this.$(
                    'iframe')[0], this.extractOrigin(tValue));

            // Let games/interactives know that they are talking to CODAP, specifically (rather than any
            // old iframePhone supporting page) and can use its API.
            tGPHandler.gamePhone.call({message: "codap-present"});
          }

          this._previousValue = tValue;

        }.observes('value'),

        destroy: function () {
          this.controller.gameViewWillClose();
          sc_super();
        },

        /**
         * If the URL is a web URL return the origin.
         *
         * The origin is scheme://domain_name.port
         */
        extractOrigin: function (url) {
          var re = /([^:]*:\/\/[^\/]*)/;
          if (/^http.*/i.test(url)) {
            return re.exec(url)[1];
          }
        },

        /**
         * @override SC.WebView.iframeDidLoad
         */
        iframeDidLoad: function () {
          if (!SC.none(this.value)) {
            this.setPath('parentView.isLoading', false);
          }
          var iframe = this.$('iframe')[0];
          if (this.value) {
            this.valueDidChange();
          }
          if (iframe && iframe.contentWindow) {
            var contentWindow = iframe.contentWindow, target = this.controller;

            // Allow the iframe to take over the entire screen (requested by InquirySpace)
            $(iframe).attr('allowfullscreen', true)
                .attr('webkitallowfullscreen', true)
                .attr('mozallowfullscreen', true);

            // Assign the callback functions as properties of the iframe's contentWindow.
            //
            // Note that the callbacks use SC.run() to make sure that SproutCore's runloop
            // has a chance to propagate bindings and data changes. See "Why Does SproutCore
            // Have a Run Loop and When Does It Execute?" at
            // http://frozencanuck.wordpress.com/2010/12/21/why-does-sproutcore-have-a-run-loop-and-when-does-it-execute/
            // for details of why this is necessary. In its concluding paragraph, it states
            // "Therefore the run loop is also used to drive data propagation via binding whenever
            // an asynchronous event is fired in order to drive the application." These callbacks
            // from the game are just such an asynchronous event, and so must invoke the runloop
            // to operate properly.
            //
            // Furthermore, note that these callbacks cannot be added, and an exception will be thrown, if
            // the game is hosted on another domain. Ignore that because we use HTML5 Web Messaging
            // ("postMessage") via IframePhone to talk to these games, which do not require the callbacks
            // below.

            try {

              // DoCommand
              contentWindow.DoCommand = function (iCmd) {
                var result;
                SC.run(function () {
                  result = target.doCommand(iCmd);
                });
                return SC.json.encode(result);
              };
            } catch (e) {
              // Supress warning.
              //DG.logWarn(e);
            }
          } else {
            DG.logWarn("DG.GameView:iframeDidLoad no contentWindow\n");
          }
          sc_super();
        }

      })
    });
