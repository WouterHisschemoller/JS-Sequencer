/**
 * Arrangement holds all data of the current piece of music. 
 * In that way it's sort of a model for the app.
 * It can also provide the musical events that happen within a given timespan.
 * It will probably also keep state of song or pattern mode.
 * 
 * @namespace WH
 */
window.WH = window.WH || {};

(function (WH) {

    /**
     * @constructor
     * @param {Object} data Arrangement data.
     */
    function Arrangement(data) {

        var beatsPerMinute = 0,
            secondsPerBeat = 0,
            oldBPM = 0,
            isSongMode = false,
            patternDurationInTicks, // pattern length is 4 beats
            patternDurationInBeats = 4,
            patterns = [],
            patternIndex = 0,


            /**
             * Set up an arrangement from the provided data, or create a new empty arrangement.
             * @param {Object} data Arrangement data object.
             */
            setData = function(data) {
                
                var ppqn = WH.TimeBase.getPPQN();
                patternDurationInTicks = patternDurationInBeats * ppqn;

                var data = data || this.getEmptyArrangement();

                // set timing
                setBPM(data.bpm);
                WH.TimeBase.setBPM(data.bpm);

                // set patterns
                var i = 0,
                    patternCount = WH.Conf.getPatternCount();
                for (i; i < patternCount; i++) {
                    patterns.push(WH.Pattern(data.patterns[i], ppqn));
                }

                // set studio
                WH.Studio.setData(data.racks);
                // update view
                WH.View.setSelectedSteps(0);
            },

            /**
             * Create data for a new empty arrangement.
             * @return {Object}  Empty arrangement setup data.
             */
            getEmptyArrangement = function() {

                var ppqn = WH.TimeBase.getPPQN(),
                    patternCount = WH.Conf.getPatternCount(),
                    trackCount = WH.Conf.getTrackCount(),
                    stepCount = WH.Conf.getStepCount(),
                    stepDuration = Math.floor( patternDurationInTicks / stepCount );

                var data = {
                    bpm: 100,
                    racks: [], 
                    patterns: []
                };

                for (var j = 0; j < trackCount; j++) {
                    var rack = {
                        instrument: {
                            name: 'SimpleOsc',
                            preset: {
                                oscType: WX.findValueByKey(WX.WAVEFORMS, 'Sine'),
                                oscFreq: WX.mtof(60),
                                lfoType: WX.findValueByKey(WX.WAVEFORMS, 'Sine'),
                                lfoRate: 1.0,
                                lfoDepth: 1.0
                            }
                        },
                        channel: {
                            preset: {
                                mute: false,
                                solo: false,
                                pan: 0.0,
                                level: 1.0
                            }
                        }
                    };
                    data.racks.push(rack);
                }

                for (var i = 0; i < patternCount; i++) {
                    var pattern = {
                        tracks: []
                    };
                    data.patterns.push(pattern);
                    for (var j = 0; j < trackCount; j++) {
                        var track = {
                            steps: []
                        };
                        pattern.tracks.push(track);
                        for (var k = 0; k < stepCount; k++) {
                            var step = {
                                channel: j,
                                pitch: 60,
                                velocity: 0,
                                start: stepDuration * k,
                                duration: Math.floor( stepDuration / 2 )
                            };
                            track.steps.push(step);
                        }
                    }
                }
                return data;
            },

            /**
             * Create data for an arrangement with randomized patterns and data.
             * @return {Object}  Empty arrangement setup data.
             */
            getRandomizedArrangement = function() {

                var ppqn = WH.TimeBase.getPPQN(),
                    patternCount = WH.Conf.getPatternCount(),
                    trackCount = WH.Conf.getTrackCount(),
                    stepCount = WH.Conf.getStepCount(),
                    stepDuration = Math.floor( (patternDurationInBeats * ppqn) / stepCount ),
                    data = {
                        bpm: 100,
                        racks: [], 
                        patterns: []
                    };

                for (var j = 0; j < trackCount; j++) {
                    var oscType,
                        lfoRate = 1,
                        lfoDepth = 1,
                        lfoType = WX.findValueByKey(WX.WAVEFORMS, 'Sine');
                    switch (j) {
                        case 0:
                            oscType = WX.findValueByKey(WX.WAVEFORMS, 'Sine');
                            lfoRate = 5;
                            lfoDepth = 100;
                            break;
                        case 1:
                            oscType = WX.findValueByKey(WX.WAVEFORMS, 'Sawtooth');
                            break;
                        case 2:
                            oscType = WX.findValueByKey(WX.WAVEFORMS, 'Square');
                            lfoType = WX.findValueByKey(WX.WAVEFORMS, 'Square');
                            lfoRate = 10;
                            lfoDepth = 500;
                            break;
                        case 3:
                            oscType = WX.findValueByKey(WX.WAVEFORMS, 'Triangle');
                            break;
                    }
                    var rack = {
                        instrument: {
                            name: 'WXS1',
                            preset: {
                                oscType: oscType,
                                oscFreq: WX.mtof(60),
                                lfoType: lfoType,
                                lfoRate: lfoRate,
                                lfoDepth: lfoDepth
                            }
                        },
                        channel: {
                            preset: {
                                mute: false,
                                solo: false,
                                pan: (j * 0.4) - 0.6,
                                level: 1.0
                            }
                        }
                    };
                    data.racks.push(rack);
                }

                for (var i = 0; i < patternCount; i++) {
                    var pattern = {
                        tracks: []
                    };
                    data.patterns.push(pattern);
                    for (var j = 0; j < trackCount; j++) {
                        var track = {
                            steps: []
                        };
                        pattern.tracks.push(track);
                        for(var k = 0; k < stepCount; k++) {
                            var pitch = 0,
                                velocity = 0,
                                duration = Math.floor( stepDuration / 2 );
                            switch (j) {
                                case 0:
                                    pitch = 60 + k;
                                    velocity = (Math.random() > 0.90 ? 120 : 0);
                                    duration = stepDuration * 5;
                                    break;
                                case 1:
                                    pitch = 24 + k;
                                    velocity = (Math.random() > 0.85 ? 50 : 0);
                                    break;
                                case 2:
                                    pitch = 48 + k;
                                    velocity = (Math.random() > 0.85 ? 20 : 0);
                                    duration = stepDuration;
                                    break;
                                case 3:
                                    pitch = 76 - k;
                                    velocity = (Math.random() > 0.80 ? 120 : 0);
                                    duration = Math.floor( stepDuration / 8 );
                                    break;
                            }
                            var step = {
                                channel: j,
                                pitch: pitch,
                                velocity: velocity,
                                start: stepDuration * k,
                                duration: duration
                            };
                            track.steps.push(step);
                        }
                    }
                }
                return data;
            },

            /**
             * Set BPM and update related variables.
             * @param {Number} bpm Tempo in Beats Per Minute.
             * @return {Number} Factor by which the playback speed has changed.
             */
            setBPM = function(bpm) {
                var factor = beatsPerMinute / bpm;
                beatsPerMinute = bpm;
                return factor;
            };

        /**
         * Create a new empty arrangement.
         */
        this.createNew = function() {
            setData();
        };

        /**
         * Create a new random generated arrangement.
         */
        this.createRandom = function() {
            setData(getRandomizedArrangement());
        };

        /**
         * Get all settings that should be saved with a project.
         * @return {Array} Array of objects with all data per channel and rack.
         */
        this.getData = function() {
            var data = [],
                i = 0,
                n = WH.Conf.getPatternCount();

            for (i; i < n; i++) {
                data.push(patterns[i].getData());
            }

            return data;
        };

        /**
         * Scan events within time range.
         * @param {Number} start Start of time range in ticks.
         * @param {Number} end End of time range in ticks.
         * @param {Array} playbackQueue Events that happen within the time range.
         */
        this.scanEvents = function (start, end, playbackQueue) {

            // convert transport time to song time
            var localStart = start % patternDurationInTicks;
            var localEnd = localStart + (end - start);
            
            // scan current pattern for events
            var events = patterns[patternIndex].scanEvents(start, localStart, localEnd, playbackQueue);
        };

        /**
         * Get steps of the track at index on the current pattern.
         * @param  {Number} index Track index.
         * @return {Array}       Array of Step objects.
         */
        this.getTrackSteps = function(index) {
            if (patterns[patternIndex]) {
                return patterns[patternIndex].getTrackSteps(index);
            }
            return null;
        };
    }
    
    /** 
     * Singleton
     */
    WH.Arrangement = new Arrangement();
})(WH);