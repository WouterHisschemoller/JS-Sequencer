/**
 * Mixer view that contains the channel plugin views.
 *
 * @namespace WH
 */
window.WH = window.WH || {};

(function (WH) {
    
    function createPluginRackView(specs) {

        // private variables
        var that = specs.that,
            conf = specs.conf,
            rootEl = specs.rootEl,
            rackSlotContainerSel = specs.rackSlotContainerSel,
            rackSlotTemplate = $('#template-rack-slot'),
            pluginViews = [],
            
            selectors = {
                rackSlot: '.rack-slot'
            }
            
            /**
             * General setup.
             */
            setup = function() {
                // create separate containers for all plugins
                var i, n, slotEl;
                n = conf.getTrackCount();
                for (i = 0; i < n; i++) {
                    slotEl = rackSlotTemplate.children().first().clone();
                    rootEl.andSelf().find(rackSlotContainerSel).append(slotEl);
                }
            },

            /**
             * Fill a mixer channel with mixer channel controls.
             * This happens once because the mixer is created only once.
             * @param {Object} channelPlugin Plugin Processor object.
             * @param {Number} index Channel index in which to create the channel controls.
             */
            setPlugin = function(plugin, index) {
                var pluginView = WH.createPluginView({
                    plugin: plugin,
                    parentEl: $(rootEl.find(selectors.rackSlot)[index]),
                    index: index
                });
                
                pluginViews[plugin.getId()] = pluginView;
            };
    
        var my = my || {};
        my.rootEl = rootEl;
        
        that = WH.createBaseView(specs, my);
        
        that.setup = setup;
        that.setPlugin = setPlugin;
        return that;
    }

    WH.createPluginRackView = createPluginRackView;
    
})(WH);
