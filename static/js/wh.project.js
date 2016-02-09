/**
 * Project holds all data of the current piece of music. 
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
     * @param {Object} data Project data.
     */
    function Project(data) {
        this.beatsPerMinute = 0;
        this.secondsPerBeat = 0;
        this.oldBPM = 0;
        this.isSongMode = false;
        this.patternDurationInTicks; // pattern length is 4 beats
        this.patternDurationInBeats = 4;
        this.patterns = [];
        this.patternIndex = 0;
    }
    
    Project.prototype = {

        /**
         * Set up a project from the provided data, or create a new empty project.
         * @param {Object} data Project data object.
         */
        setData: function(data) {
            
            var ppqn = WH.TimeBase.getPPQN();
            this.patternDurationInTicks = this.patternDurationInBeats * ppqn;

            var data = data || this.getEmptyProject();

            // set timing
            this.setBPM(data.bpm);
            WH.TimeBase.setBPM(data.bpm);

            // set patterns
            var patternCount = WH.Settings.getPatternCount();
            for(var i = 0; i < patternCount; i++) {
                this.patterns.push(WH.Pattern(data.patterns[i], ppqn));
            }

            // set studio
            WH.Studio.setProject(data.racks);
            // update view
            WH.View.setSelectedSteps(0);
        },

        /**
         * Create a new empty project.
         */
        createNew: function() {
            this.setData();
        },

        /**
         * Scan events within time range.
         * @param {Number} start Start of time range in ticks.
         * @param {Number} end End of time range in ticks.
         * @param {Array} playbackQueue Events that happen within the time range.
         */
        scanEvents: function (start, end, playbackQueue) {

            // convert transport time to song time
            var localStart = start % this.patternDurationInTicks;
            var localEnd = localStart + (end - start);
            
            // scan current pattern for events
            var events = this.patterns[this.patternIndex].scanEvents(start, localStart, localEnd, playbackQueue);
        },

        /**
         * Create data for a new empty project.
         * @return {Object}  Empty project setup data.
         */
        getEmptyProject: function() {

            var ppqn = WH.TimeBase.getPPQN(),
                patternCount = WH.Settings.getPatternCount(),
                trackCount = WH.Settings.getTrackCount(),
                stepCount = WH.Settings.getStepCount(),
                stepDuration = Math.floor( this.patternDurationInTicks / stepCount );

            var data = {
                bpm: 100,
                racks: [], 
                patterns: []
            };

            for (var j = 0; j < trackCount; j++) {
                var rack = {
                    instrument: {
                        name: 'simpleosc',
                        preset: {
                            oscType: WX.findValueByKey(WX.WAVEFORMS, 'Sine'),
                            oscFreq: WX.mtof(60),
                            lfoType: WX.findValueByKey(WX.WAVEFORMS, 'Sine'),
                            lfoRate: 1.0,
                            lfoDepth: 1.0
                        }
                    },
                    channel: {
                        mute: false,
                        solo: false,
                        pan: 0.0,
                        level: 1.0
                    }
                };
                data.racks.push(rack);
            }

            for (var i = 0; i < patternCount; i++) {
                var pattern = {
                    tracks: []
                };
                data.patterns.push(pattern);
                for(var j = 0; j < trackCount; j++) {
                    var track = {
                        steps: []
                    };
                    pattern.tracks.push(track);
                    for(var k = 0; k < stepCount; k++) {
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
         * Create data for a project with randomized patterns and data.
         * @return {Object}  Empty project setup data.
         */
        getRandomizedProject: function() {

            var ppqn = WH.TimeBase.getPPQN(),
                patternCount = WH.Settings.getPatternCount(),
                trackCount = WH.Settings.getTrackCount(),
                stepCount = WH.Settings.getStepCount(),
                stepDuration = Math.floor( (this.patternDurationInBeats * ppqn) / stepCount ),
                data = {
                    bpm: 100,
                    racks: [], 
                    patterns: []
                };

            for(var j = 0; j < trackCount; j++) {
                var oscType,
                    lfoRate = 1,
                    lfoDepth = 1,
                    lfoType = WX.findValueByKey(WX.WAVEFORMS, 'Sine');
                switch(j) {
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
                        name: 'simpleosc',
                        preset: {
                            oscType: oscType,
                            oscFreq: WX.mtof(60),
                            lfoType: lfoType,
                            lfoRate: lfoRate,
                            lfoDepth: lfoDepth
                        }
                    },
                    channel: {
                        mute: false,
                        solo: false,
                        pan: (j * 0.4) - 0.6,
                        level: 1.0
                    }
                };
                data.racks.push(rack);
            }

            for (var i = 0; i < patternCount; i++) {
                var pattern = {
                    tracks: []
                };
                data.patterns.push(pattern);
                for(var j = 0; j < trackCount; j++) {
                    var track = {
                        steps: []
                    };
                    pattern.tracks.push(track);
                    for(var k = 0; k < stepCount; k++) {
                        var pitch = 0,
                            velocity = 0,
                            duration = Math.floor( stepDuration / 2 );
                        switch(j) {
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
         * Getter for BPM.
         * @return {Number} Song tempo in Beats Per Minute.
         */
        getBPM: function() {
            return this.beatsPerMinute;
        },

        /**
         * Set BPM and update related variables.
         * @param {Number} Project tempo in Beats Per Minute.
         * @return {Number} Factor by which the playback speed has changed.
         */
        setBPM: function(beatsPerMinute) {
            var factor = this.beatsPerMinute / beatsPerMinute;
            this.beatsPerMinute = beatsPerMinute;
            return factor;
        },

        /**
         * Get steps of the track at index on the current pattern.
         * @param  {Number} index Track index.
         * @return {Array}       Array of Step objects.
         */
        getTrackSteps: function(index) {
            if (this.patterns[this.patternIndex]) {
                return this.patterns[this.patternIndex].getTrackSteps(index);
            }
            return null;
        }
    };
    
    /** 
     * Singleton
     */
    WH.Project = new Project();
})(WH);
