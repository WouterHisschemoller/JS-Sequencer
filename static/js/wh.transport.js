/**
 * WH.transport provides timing for the app.
 * 
 * TIMEBASE INFO
 * WX.now               Time since audio context stream started. Current audio context time in seconds, see waax.extension.js.
 * this._now            Transport playhead position in seconds.
 * this._absOrigin      Transport start time since WX.now in seconds.
 * this._absLastNow     Time  since audio context stream started
 * Step.start           Step start time within its track in ticks.
 * Step.dur             Step duration in ticks.
 * Step.absStart        Step start time since audio stream start in seconds.
 *
 *  stream                             playback
 *  started                            started           now
 *   |                                  |                 |
 *   |----------------------------------|-------//--------|
 *
 *   |-------------------- WX.now --------------//--------|
 *   
 *                                      |--- this._now ---|
 *
 *   |--------- this._absOrigin --------|
 *                                    
 *
 * @namespace WH
 */

window.WH = window.WH || {};

(function (WH) {
    
    /**
     * @description Creates a transport object.
     */
    function createTransport() {
        var that,
            isRunning = false,
            isLoop = false,
            now = 0,
            absLastNow = now,
            absOrigin = 0,
            loopStart = 0,
            loopEnd = 0,
            bpm = 120,
            ppqn = 480,
            lastBpm = bpm,
            tickInSeconds = 0,
            playbackQueue = [],
            needsScan = true,
            lookAhead = 0,
            scanStart = 0,
            scanEnd = lookAhead,
            
            /**
             * Converts tick to second based on transport tempo.
             * @param  {Number} tick Tick (atomic musical time unit)
             * @return {Number} Time in seconds.
             */
            tick2sec = function (tick) {
                return tick * tickInSeconds;
            }

            /**
             * Converts second to tick based on transport tempo.
             * @param  {Number} sec Time in seconds.
             * @return {Number} Time in ticks.
             */
            sec2tick = function (sec) {
                return sec / tickInSeconds;
            },
            
            /**
             * 
             */
            flushPlaybackQueue = function() {
                playbackQueue.length = 0;
            },
            
            /**
             * Sets current playhead position by seconds (audioContext).
             * @param {number} position Position in seconds 
             */
            setPlayheadPosition = function(position) {
                now = position;
                absOrigin = WH.core.getNow() - now;
            },

            /**
             * Scan events in time range and advance playhead in each pattern.
             */
            scheduleNotesInScanRange = function () {
                if (needsScan) {
                    needsScan = false;

                    // fill playbackQueue with arrangement events 
                    WH.arrangement.scanEvents(sec2tick(scanStart), sec2tick(scanEnd), playbackQueue);

                    if (playbackQueue.length) {
                        // adjust event timing
                        var start, 
                            step,
                            i = 0;
                        for (i; i < playbackQueue.length; i++) {
                            step = playbackQueue[i];
                            start = absOrigin + tick2sec(step.getStart());
                            step.setAbsStart( start );
                            step.setAbsEnd( start + tick2sec(step.getDuration()));
                        }

                        // play the events with sound generating plugin instruments
                        WH.studio.playEvents(playbackQueue);
                        WH.View.onSequencerEvents(playbackQueue);
                    }
                }
            },

            /**
             * Move the scan range of scan forward by runner.
             */
            advanceScanRange = function () {
                // Advances the scan range to the next block, if the scan end point is
                // close enough (< 16.7ms) to playhead.
                if (scanEnd - now < 0.0167) {
                    scanStart = scanEnd;
                    scanEnd = scanStart + lookAhead;
                    needsScan = true;
                }
            },
            
            /**
             * Reset the scan range based on current playhead position.
             */
            resetScanRange = function () {
                scanStart = now;
                scanEnd =  scanStart + lookAhead;
                needsScan = true;
            },
            
            /**
             * Runs the transport (update every 16.7ms).
             */
            run = function () {
                if (isRunning) {
                    // add time elapsed to now_t by checking now_ac
                    var absNow = WH.core.getNow();
                    now += (absNow - absLastNow);
                    absLastNow = absNow;
                    // scan notes in range
                    scheduleNotesInScanRange();
                    // advance when transport is running
                    advanceScanRange();
                    // flush played notes
                    flushPlaybackQueue();
                    // check loop flag
                    if (isLoop) {
                        if (loopEnd - (now + lookAhead) < 0) {
                            setPlayheadPosition(loopStart - (loopEnd - now));
                        }
                    }
                }
                // schedule next step
                requestAnimationFrame(run.bind(this));
            },

            /**
             * Starts playback.
             */
            start = function () {
                // Arrange time references.
                var absNow = WH.core.getNow();
                absOrigin = absNow - now;
                absLastNow = absNow;
                // Reset scan range.
                resetScanRange();
                // Transport is running.
                isRunning = true;
                WH.View.updateTransportState(isRunning);
            },

            /**
             * Pauses current playback.
             */
            pause = function () {
                isRunning = false;
                flushPlaybackQueue();
                WH.View.updateTransportState(isRunning);
            },

            /**
             * Toggle between stop and play.
             */
            toggleStartStop = function() {
                if (isRunning) {
                    pause();
                    rewind();
                } else {
                    start();
                }
            },

            /**
             * Sets playhead position by tick.
             * @param {Number} tick Playhead position in ticks.
             */
            setNow = function (tick) {
                setPlayheadPosition(tick2sec(tick));
                resetScanRange();
            },

            /**
             * Returns playhead position by tick.
             * @return {Number}
             */
            getNow = function () {
                return sec2tick(now);
            },

            /**
             * Rewinds playhead to the beginning.
             */
            rewind = function () {
                setPlayheadPosition(0.0);
            },

            /**
             * Sets loop start position by tick.
             * @param {Number} tick Loop start in tick.
             */
            setLoopStart = function (tick) {
                loopStart = tick2sec(tick);
            },

            /**
             * Sets loop end position by tick.
             * @param {Number} tick Loop end in tick.
             */
            setLoopEnd = function (tick) {
                loopEnd = tick2sec(tick);
            },

            /**
             * Returns loop start by tick.
             * @return {Number}
             */
            getLoopStart = function () {
                return sec2tick(loopStart);
            },

            /**
             * Returns loop end by tick.
             * @return {Number}
             */
            getLoopEnd = function () {
                return sec2tick(loopEnd);
            },

            /**
             * Toggles or sets loop status.
             * @param  {Boolean|undefined} bool Loop state. If undefined, it toggles the current state.
             */
            toggleLoop = function (bool) {
                if (bool === undefined) {
                    isLoop = !isLoop;
                } else {
                    isLoop = !!bool;
                }
            },

            /**
             * Sets transport BPM.
             * @param {Number} BPM Beat per minute.
             */
            setBPM = function (newBpm) {
                // calculates change factor
                bpm = (newBpm || 120);
                var factor = lastBpm / bpm;
                lastBpm = bpm;
                // recalcualte beat in seconds, tick in seconds
                var beatInSeconds = 60.0 / bpm;
                tickInSeconds = beatInSeconds / ppqn;
                // lookahead is 16 ticks (1/128th note)
                lookAhead = tickInSeconds * 16;
                // update time references based on tempo change
                now *= factor;
                loopStart *= factor;
                loopEnd *= factor;
                absOrigin = WH.core.getNow() - now;
            },

            /**
             * Returns current BPM.
             * @return {Number}
             */
            getBPM = function () {
                return bpm;
            };
        
        that = {};
        
        setBPM(bpm);
        run();
        
        that.pause = pause;
        that.rewind = rewind;
        that.toggleStartStop = toggleStartStop;
        that.setBPM = setBPM;
        that.getBPM = getBPM;
        return that;
    }
    
    /**
     * Singleton
     */
    WH.transport = createTransport();

})(WH);
