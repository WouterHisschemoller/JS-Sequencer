/**
 * Plugin base objects.
 *
 * @namespace WH
 */

window.WH = window.WH || {};

(function (WH, WX) {

    function createPlugin(specs, my) {

        var that,
            id = specs.id,
            name = specs.name,
            title = specs.title,
            to = function(target) {
                if (target.getInlet && target.getInlet()) {
                    my.outlet.to(target.getInlet());
                    return target;
                } else {
                    try {
                      my.outlet.to(target);
                      return target;
                    } catch (error) {
                        console.error('Connection failed. Invalid patching.');
                    }
                }
            },
            cut = function() {

            },
            setParam = function (param, arg) {

            },
            getParam = function (param) {
                return;
            },
            setPreset = function (preset) {

            },
            getPreset = function () {
                return null;
            },
            getId = function() {
                return id;
            },
            getName = function() {
                return name;
            },
            getInlet = function() {
                return my.inlet;
            },
            getInlet;

        my = my || {};

        that = {};
        that.to = to;
        that.cut = cut;
        that.setParam = setParam;
        that.getParam = getParam;
        that.setPreset = setPreset;
        that.getPreset = getPreset;
        that.getId = getId;
        that.getName = getName;
        return that;
    }

    function createGeneratorPlugin(specs, my) {

        var that,
            output = WX.Gain(),
            outlet = WX.Gain();

        my = my || {};
        my.outlet = outlet;

        output.to(outlet);

        that = createPlugin(specs, my);
        return that;
    }

    WH.createGeneratorPlugin = createGeneratorPlugin;

    function createProcessorPlugin(specs, my) {

        var that,
            input = WX.Gain(),
            inlet = WX.Gain(),
            output = WX.Gain(),
            outlet = WX.Gain();

        my = my || {};
        my.inlet = inlet;
        my.outlet = outlet;
        
        inlet.to(input);
        output.to(outlet);

        that = createPlugin(specs, my);
        return that;
    }

    WH.createProcessorPlugin = createProcessorPlugin;

})(WH, WX);



(function (WH, WX) {

    function createPlugin(specs) {

        var that,
            soloCallback,

            /**
             * Set the callback function to notify the other channels of a solo parameter change.
             * @param {Function} callback The callback function.
             */
            setSoloCallback = function(callback) {
                soloCallback = callback;
            };
        
        specs.name = 'channel'
        specs.title = 'Mixer Channel';

        that = WH.createGeneratorPlugin(specs);
        that.setSoloCallback = setSoloCallback;
        return that;
    }

    WH.plugins = WH.plugins || {};
    WH.plugins['channel'] = {
        create: createPlugin,
        type: 'processor'
    };

})(WH, WX);
