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
    function File() {

        var settings = {
                projectName: 'project'
            },

            autoSaveEnabled = true,

            /**
             * Create data for a new empty arrangement.
             * @return {Object}  Empty arrangement setup data.
             */
            getEmptyProject = function() {

                var patternCount = WH.Conf.getPatternCount(),
                    trackCount = WH.Conf.getTrackCount(),
                    stepCount = WH.Conf.getStepCount(),
                    stepDuration = Math.floor( WH.Conf.getPPQN() / WH.Conf.getStepsPerBeat() ),
                    data = {
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
            getRandomizedProject = function() {

                var patternCount = WH.Conf.getPatternCount(),
                    trackCount = WH.Conf.getTrackCount(),
                    stepCount = WH.Conf.getStepCount(),
                    stepDuration = Math.floor( WH.Conf.getPPQN() / WH.Conf.getStepsPerBeat() ),
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
            };

        /**
         * Create a new arrangement.
         * @param {Boolean} isRandom If true create a randomized project.
         */
        this.createNew = function(isRandom) {
            var data = isRandom ? getRandomizedProject() : getEmptyProject();
            WH.TimeBase.setBPM(data.bpm);
            WH.Arrangement.setData(data.patterns);
            WH.Studio.setData(data.racks);
        };

        /**
         * Load project from localStorage.
         */
        this.loadFromStorage = function() {
            var data = localStorage.getItem(settings.projectName);
            if (data) {
                data = JSON.parse(data);
                WH.TimeBase.setBPM(data.bpm);
                WH.Arrangement.setData(data.patterns);
                WH.Studio.setData(data.racks);
            }
        };

        /**
         * Save project if autoSave is enabled.
         */
        this.autoSave = function() {
            if (autoSaveEnabled) {
                this.save();
            }
        }

        /**
         * Collect all project data and save it in localStorage.
         */
        this.save = function() {

            var data = {
                bpm: WH.TimeBase.getBPM(),
                patterns: WH.Arrangement.getData(),
                racks: WH.Studio.getData()
            }

            localStorage.setItem(settings.projectName, JSON.stringify(data));
        };
    }
    
    /** 
     * Singleton
     */
    WH.File = new File();
})(WH);
