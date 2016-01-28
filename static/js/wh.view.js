/**
 * View is a layer between the HTML and the rest of the application.
 * It updates the view to represent the app state and 
 * passes DOM events generated by the user to the app.
 * 
 * @namespace WH
 */
window.WH = window.WH || {};

(function (WH) {

    /**
     * @constructor
     */
    function View() {

        // private variables
        var settings = {
                activeClass: 'is-active',
                selectedClass: 'is-selected',
                channelBackgroundClass: '.channel__background',
                channelHighlightClass: '.channel__hilight',
                stepBackgroundClass: '.step__background',
                stepHighlightClass: '.step__hilight',
                channelColorClasses: ['channelBgCol1', 'channelBgCol2', 'channelBgCol3', 'channelBgCol4'],
                instrControlBackgroundClass: '.instr-control__background',
                instrControlNameClass: '.instr-control__name',
                instrControlValueClass: '.instr-control__value'
            },

            /**
             * HTML elements.
             * @type {Object}
             */
            elements = {
                playStopButton: $('#play-control'),
                steps: $('.pattern__step'),
                channels: $('.channel__item'),
                instrumentControlContainer: $('.instrument-control'),
                instrumentControlTemplate: $('#template-instrument-control')
            },

            /**
             * Channel currently selected to view and edit.
             * @type {Number}
             */
            channelIndex = 0,

            /**
             * Reference to this once function has closed.
             */
            self = this,

            /**
             * Initialise the view, add DOM event handlers.
             */
            init = function() {

                if (!validateDomElements()) {
                    console.error('DOM elements invalid.');
                    return;
                }

                // set colors on the channel buttons
                elements.channels.each(function(i, el) {
                    var $el = $(el);
                    $el.find(settings.channelBackgroundClass).addClass(settings.channelColorClasses[i]);
                    $el.find(settings.channelHighlightClass).addClass(settings.channelColorClasses[i]);
                });

                updateSelectedChannel();

                var isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints,
                    eventType = isTouchDevice ? 'touchend' : 'click';
                
                elements.playStopButton.on(eventType, onPlayStopClick);
                elements.channels.on(eventType, onChannelClick);
            },

            /**
             * Test is the correct DOM elements are present.
             * @return {Boolean} True if invalid.
             */
            validateDomElements = function() {

                var isValid = true;

                if (elements.channels.length != WH.Settings.getTrackCount()) {
                    isValid = true;
                    console.error('Wrong amount of channel DOM elements.');
                }

                if (elements.steps.length != WH.Settings.getStepCount()) {
                    isValid = true;
                    console.error('Wrong amount of step DOM elements.');
                }

                if (elements.playStopButton.length == 0) {
                    isValid = true;
                    console.error('No play button DOM element.');
                }

                return isValid;
            },

            /**
             * Play / Pause toggle button clicked.
             * @param  {Event} e Click event.
             */
            onPlayStopClick = function(e) {
                if (WH.TimeBase.isRunning()) {
                    WH.TimeBase.pause();
                    WH.TimeBase.rewind();
                    elements.playStopButton.removeClass(settings.activeClass);
                } else {
                    WH.TimeBase.start();
                    elements.playStopButton.addClass(settings.activeClass);
                }
            },

            /**
             * Channel button clicked.
             * @param  {Event} e Click event.
             */
            onChannelClick = function(e) {
                channelIndex = $(e.currentTarget).data('channel');
                updateSelectedChannel();
                self.updateSelectedSteps();
                self.updateInstrument();
            }, 

            /**
             * Set a channel button as selected.
             */
            updateSelectedChannel = function() {
                elements.channels
                    .removeClass(settings.selectedClass)
                    .filter(function() {
                        return $(this).data('channel') == channelIndex;
                    })
                    .addClass(settings.selectedClass);
            },

            /**
             * Delay screen update to keep it synchronised with the audio.
             * @param  {Number} start Time to wait before update in milliseconds.
             * @param  {Array} activeSteps Steps that play in the current timespan. 
             */
            delayUpdateActiveSteps = function(start, activeSteps) {
                if (start > 0) {
                    setTimeout(function() {
                        updateActiveSteps(activeSteps);
                    }, start);
                } else {
                    updateActiveSteps(activeSteps);
                }
            },

            /**
             * Update the active step, this creates the 'running light' animation.
             * Also display flashing activity on the channel selectors.
             * @param  {Array} stepArray Steps that play in the current timespan. 
             */
            updateActiveSteps = function(stepArray) {
                var i = 0,
                    n = stepArray.length,
                    step;

                for (i; i < n; i++) {
                    step = stepArray[i];
                    
                    // update the steps
                    if (step.channel == channelIndex) {
                        elements.steps.removeClass(settings.activeClass);
                        $(elements.steps[step.index]).addClass(settings.activeClass);
                        $(elements.steps[step.index])
                            .find(settings.stepHighlightClass)
                                .show()
                                .stop()
                                .fadeIn(0)
                                .fadeOut(300);
                    }

                    // update the channels
                    if (step.velocity > 0) {
                        $(elements.channels[step.channel])
                            .find(settings.channelHighlightClass)
                                .show()
                                .stop()
                                .fadeIn(0)
                                .fadeOut(300);
                    }
                }
            };

        /**
         * Receive Step objects during playback to update the view with.
         * @param  {Array} playbackQueue Array of Step objects.
         */
        this.onStepEvents = function(playbackQueue) {
            var i = 0,
                n = playbackQueue.length,
                step,
                start,
                stepArray = [],
                oldStart = -1;

            for (i; i < n; i++) {
                step = playbackQueue[i];
                start = Math.max(0, WX.now - step.absStart) * 1000;

                if (start != oldStart && stepArray.length > 0) {
                    delayUpdateActiveSteps(oldStart, stepArray);
                    stepArray = [];
                }

                stepArray.push(step);
                oldStart = start;
            }

            delayUpdateActiveSteps(oldStart, stepArray);
        };

        /**
         * Update the pattern to show selected steps.
         * Typically after switching patterns or tracks.
         */
        this.updateSelectedSteps = function() {
            var steps = WH.Project.getTrackSteps(channelIndex),
                id,
                i = 0,
                n = settings.channelColorClasses.length,
                channelColorClass = settings.channelColorClasses[channelIndex];

            // remove color classes
            for (i; i < n; i++) {
                elements.steps.find(settings.stepBackgroundClass).removeClass(settings.channelColorClasses[i]);
                elements.steps.find(settings.stepHighlightClass).removeClass(settings.channelColorClasses[i]);
            }

            // set selected state
            elements.steps.removeClass(settings.selectedClass);
            for (var id in steps) {
                var step = steps[id];
                if(step.velocity) {
                    var $step = $(elements.steps[step.index]);
                    $step.addClass(settings.selectedClass);
                    $step.find(settings.stepBackgroundClass).addClass(channelColorClass);
                    $step.find(settings.stepHighlightClass).addClass(channelColorClass);
                }
            }
        };

        /**
         * Update the instrument controls,
         * typically after project initialisation or channel switch.
         */
        this.updateInstrument = function() {

            var instrument = WH.Studio.getInstrument(channelIndex),
                paramKey,
                param,
                paramValue,
                controlEl;

            // remove the old instrument
            elements.instrumentControlContainer.empty();
            
            for (paramKey in instrument.params) {
                param = instrument.params[paramKey];
                paramValue = param.value;

                switch (param.type) {
                    case 'Generic':
                        paramValue = paramValue.toFixed(1);
                        break;
                    case 'Itemized':
                        paramValue = WX.findKeyByValue(param.getModel(), paramValue);
                        break;
                    case 'Boolean':
                        break;
                }

                controlEl = elements.instrumentControlTemplate.children().first().clone();
                controlEl.find(settings.instrControlNameClass).text(param.name);
                controlEl.find(settings.instrControlValueClass).text(paramValue);
                elements.instrumentControlContainer.append(controlEl);
                elements.instrumentControlContainer.find(settings.instrControlBackgroundClass).addClass(settings.channelColorClasses[channelIndex]);
            }
        }

        // Initialise.
        init();
    }
    
    /** 
     * Singleton
     */
    WH.View = new View();
})(WH);