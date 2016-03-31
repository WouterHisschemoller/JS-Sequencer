/**
 * PluginView.
 *
 * @namespace WH
 */
window.WH = window.WH || {};

(function (WH) {

    function pluginView(plugin, containerEl, channelIndex) {

            /**
             * Object settings
             * @type {Object}
             */
        var settings = {
                pluginClass: '.plugin',
                pluginHeaderClass: '.plugin__header',
                pluginNameClass: '.plugin__name-label',
                pluginControlsClass: '.plugin__controls',
                pluginPageClass: '.plugin__page',
                pluginPagePrevClass: '.plugin__page-prev',
                pluginPageNextClass: '.plugin__page-next',
                pluginPageNumberClass: '.plugin__page-number',

                overlayName: '.overlay-ctrl__name',
                overlayValue: '.overlay-ctrl__value',
                overlayMin: '.overlay-ctrl__min',
                overlayMax: '.overlay-ctrl__max',
                overlaySlider: '.overlay-ctrl__slider',
                overlaySliderThumb: '.overlay-ctrl__slider-thumb',
                overlayList: '.overlay-ctrl__items',
                overlayListItem: '.overlay-ctrl__item',

                data: {
                    pluginId: 'plugin_id',
                    paramKey:  'param_key',
                    paramType: 'param_type'
                },

                ctrlTypes: {
                    generic: 'generic',
                    itemized: 'itemized',
                    boolean: 'boolean'
                }
            },

            /**
             * HTML elements.
             * @type {Object}
             */
            elements = {
                app: $('#app'),
                pluginTemplate: $('#template-plugin'),
                pluginHeaderTemplate: $('#template-plugin-header'),
                overlayCtrlGeneric: $('#overlay-ctrl-generic'),
                overlayCtrlItemized: $('#overlay-ctrl-itemized'),

                templates: {
                    ctrlGeneric: $('#template-ctrl-generic'),
                    ctrlBoolean: $('#template-ctrl-boolean'),
                    ctrlItemized: $('#template-ctrl-itemized'),
                    overlayControlItem: $('#template-overlay-ctrl-item')
                },

                pluginTemplates: {
                    Channel: $('#template-channel'),
                    WXS1: $('#template-plugin-wxs1')
                }
            },

            /**
             * Reference to this once function has closed.
             * @type {Object}
             */
            self = this,

            /**
             * Plugin DOM element.
             * @type {Object}
             */
            pluginEl,

            /**
             * Initialise the view, add DOM event handlers.
             */
            init = function() {
                var pluginTemplate = elements.pluginTemplates[plugin.info.className];
                pluginEl = pluginTemplate.children().first().clone();
                pluginEl.appendTo(containerEl);
                pluginEl.attr('data-' + settings.data.pluginId, plugin.getId());
                addHeader();
                addControls();
                self.setColor(pluginEl, settings.channelColorClasses[channelIndex]);
            },

            /**
             * Add a header to the plugin if a header container element is
             * present in the plugin template.
             */
            addHeader = function() {
                var headerContainer = pluginEl.find(settings.pluginHeaderClass);
                if (!headerContainer.length) {
                    return;
                }

                // add the header to the plugin
                var headerEl = elements.pluginHeaderTemplate.children().clone();
                headerEl.appendTo(headerContainer);
                headerEl.find(settings.pluginNameClass).text(plugin.info.name);

                // add pagination if there's mupltiple control pages
                var pageEls = pluginEl.find(settings.pluginPageClass),
                    prevEl = pluginEl.find(settings.pluginPagePrevClass),
                    nextEl = pluginEl.find(settings.pluginPageNextClass);
                if (pageEls.length > 1) {
                    prevEl.on(self.eventType.click, {dir:-1}, onPagingClick);
                    nextEl.on(self.eventType.click, {dir: 1}, onPagingClick);
                } else {
                    prevEl.addClass(settings.disabledClass);
                    nextEl.addClass(settings.disabledClass);
                }

                changePage(0, 0);
            },

            /**
             * Click on the previous or next page buttons.
             * @param {Event} Click or touch event.
             */
            onPagingClick = function(e) {
                changePage(e.data.dir);
            },

            /**
             * Change to another page of contols.
             * @param {Number} relativeChange New page index relative to the current.
             * @param {Number} relativeChange
             */
            changePage = function(relativeChange, absoluteChange) {
                var pageEls = pluginEl.find(settings.pluginPageClass),
                    prevEl = pluginEl.find(settings.pluginPagePrevClass),
                    nextEl = pluginEl.find(settings.pluginPageNextClass),
                    numberEl = pluginEl.find(settings.pluginPageNumberClass),
                    currentPageEl = pageEls.filter('.' + settings.selectedClass),
                    currentIndex = pageEls.index(currentPageEl),
                    newIndex,
                    lastIndex = pageEls.length - 1;

                // get the new page index
                if (!isNaN(relativeChange) && relativeChange != 0) {
                    newIndex = currentIndex + relativeChange;
                } else {
                    if (!isNaN(absoluteChange)) {
                        newIndex = absoluteChange;
                    }
                }

                // integers and clamp to existing page indexes
                newIndex = Math.floor(newIndex);
                newIndex = Math.max(0, Math.min(newIndex, lastIndex));

                // disable or enable page buttons
                prevEl.toggleClass(settings.disabledClass, newIndex == 0);
                nextEl.toggleClass(settings.disabledClass, newIndex == lastIndex);

                // set paging info text
                numberEl.find(settings.ctrlTextClass).text((newIndex + 1) + '/' + pageEls.length);

                // update selected page
                pageEls.removeClass(settings.selectedClass);
                $(pageEls[newIndex]).addClass(settings.selectedClass);
            },

            /**
             * Add controls to the plugin based on the plugin's parameters and the template's control container elements.
             */
            addControls = function() {
                var paramKey,
                    paramValue,
                    param,
                    controlContainer;

                for (paramKey in plugin.params) {
                    controlContainer = pluginEl.find('.' + paramKey);

                    if (controlContainer.length) {
                        param = plugin.params[paramKey];
                        paramValue = param.value;

                        switch (param.type) {
                            case 'Generic':
                                paramValue = paramValue.toFixed(1);
                                controlEl = elements.templates.ctrlGeneric.children().first().clone();
                                controlEl.find(settings.ctrlNameClass).text(param.name);
                                controlEl.find(settings.ctrlValueClass).text(paramValue);
                                paramType = settings.ctrlTypes.generic;
                                break;
                            case 'Itemized':
                                paramValue = WX.findKeyByValue(param.getModel(), paramValue);
                                controlEl = elements.templates.ctrlItemized.children().first().clone();
                                controlEl.find(settings.ctrlNameClass).text(param.name);
                                controlEl.find(settings.ctrlValueClass).text(paramValue);
                                paramType = settings.ctrlTypes.itemized;
                                break;
                            case 'Boolean':
                                controlEl = elements.templates.ctrlBoolean.children().first().clone();
                                controlEl.find(settings.ctrlTextClass).text(param.name);
                                if (paramValue) {
                                    controlEl.addClass(settings.selectedClass);
                                }
                                paramType = settings.ctrlTypes.boolean;
                                break;
                        }

                        controlEl.attr('data-' + settings.data.paramKey, paramKey);
                        controlEl.attr('data-' + settings.data.paramType, paramType);
                        controlContainer.append(controlEl);
                    }
                }

                // data to send to the DOM event handlers
                var eventData = {
                    plugin: plugin
                };

                // DOM event handlers
                pluginEl.find(settings.ctrlBooleanClass).on(self.eventType.click, eventData, onBooleanControlClick);
                pluginEl.find(settings.ctrlGenericClass).on(self.eventType.start, eventData, onGenericControlTouchStart);
                pluginEl.find(settings.ctrlItemizedClass).on(self.eventType.start, eventData, onItemizedControlTouchStart);
            },

            /**
             * Boolean control clicked on a plugin.
             * @param {Event} e Touch end or mouse click event.
             */
            onBooleanControlClick = function(e) {
                var controlEl = $(e.currentTarget),
                    paramKey = controlEl.data(settings.data.paramKey),
                    paramValue = !controlEl.hasClass(settings.selectedClass);

                WH.Studio.setParameter(e.data.plugin.getId(), paramKey, paramValue);
                WH.File.autoSave();
            },

            /**
             * Generic control pressed on a plugin.
             * @param {Event} e Touchstart or mousedown event.
             */
            onGenericControlTouchStart = function(e) {
                e.preventDefault();

                elements.overlayCtrlGeneric.show();

                // get parameter from plugin
                var slider = elements.overlayCtrlGeneric.find(settings.overlaySlider),
                    thumb = elements.overlayCtrlGeneric.find(settings.overlaySliderThumb),
                    paramKey = $(e.currentTarget).data(settings.data.paramKey),
                    param = e.data.plugin.getParameterValues(paramKey),
                    normalValue = (param.value - param.min) / (param.max - param.min),
                    userY = self.isTouchDevice ? e.originalEvent.changedTouches[0].clientY : e.clientY,
                    normalUserY = Math.max(0, 1 - Math.min(((userY - slider.offset().top) / slider.height()), 1)),
                    eventData = {
                        pluginId: e.data.plugin.getId(),
                        paramKey: paramKey,
                        param: param,
                        normalValue: normalValue,
                        normalUserY: normalUserY,
                        isEnabled: false
                    };

                elements.overlayCtrlGeneric.find(settings.overlayName).text(param.name);
                elements.overlayCtrlGeneric.find(settings.overlayValue).text(param.value.toFixed(2));
                elements.overlayCtrlGeneric.find(settings.overlayMin).text(param.min.toFixed(1));
                elements.overlayCtrlGeneric.find(settings.overlayMax).text(param.max.toFixed(1));
                elements.app.on(self.eventType.move, eventData, onGenericOverlayTouchMove);
                elements.app.on(self.eventType.end, eventData, onGenericOverlayTouchEnd);

                thumb.height(slider.height() * normalValue);
            },

            /**
             * Generic control overlay touchend or mouseup.
             * @param {Event} e Touch or mouse end event.
             */
            onGenericOverlayTouchEnd = function(e) {
                elements.overlayCtrlGeneric.hide();
                elements.app.off(self.eventType.move, onGenericOverlayTouchMove);
                elements.app.off(self.eventType.end, onGenericOverlayTouchEnd);
                WH.File.autoSave();
            },

            /**
             * Generic control overlay touchend or mouseup.
             * @param {Event} e Touch or mouse move event.
             */
            onGenericOverlayTouchMove = function(e) {
                var slider = elements.overlayCtrlGeneric.find(settings.overlaySlider),
                    userY = self.isTouchDevice ? e.originalEvent.changedTouches[0].clientY : e.clientY,
                    normalValue = Math.max(0, 1 - Math.min(((userY - slider.offset().top) / slider.height()), 1));

                if (!e.data.isEnabled &&
                    ((e.data.normalUserY >= e.data.normalValue) && (normalValue <= e.data.normalValue)) ||
                    ((e.data.normalUserY <= e.data.normalValue) && (normalValue >= e.data.normalValue))) {
                    e.data.isEnabled = true;
                }

                if (e.data.isEnabled) {
                    WH.Studio.setParameter(e.data.pluginId, e.data.paramKey, normalValue);
                }
            },

            /**
             * Itemized control pressed on a plugin.
             * @param {Event} e Touchstart or mousedown event.
             */
            onItemizedControlTouchStart = function(e) {
                e.preventDefault();
                elements.overlayCtrlItemized.show();

                var paramKey = $(e.currentTarget).data(settings.data.paramKey),
                    param = e.data.plugin.getParameterValues(paramKey),
                    listEl = elements.overlayCtrlItemized.find(settings.overlayList),
                    i = 0,
                    n = param.model.length,
                    itemEl;

                elements.overlayCtrlItemized.find(settings.overlayName).text(param.name);
                listEl.empty();

                for (i; i < n; i++) {
                    itemEl = elements.templates.overlayControlItem.children().first().clone();
                    itemEl.text(param.model[i].key);
                    itemEl.appendTo(listEl);

                    if (param.value == param.model[i].value) {
                        itemEl.addClass(settings.selectedClass);
                    }
                }

                var listOffset = listEl.offset(),
                    eventData = {
                        pluginId: e.data.plugin.getId(),
                        paramKey: paramKey,
                        model: param.model,
                        originalIndex: param.valueNormalized,
                        changedIndex: null,
                        itemEls: elements.overlayCtrlItemized.find(settings.overlayListItem),
                        listLeft: listOffset.left,
                        listTop: listOffset.top,
                        listRight: listOffset.left + listEl.width(),
                        listBottom: listOffset.top + listEl.height(),
                        itemHeight: listEl.height() / param.model.length
                    };

                elements.app.on(self.eventType.move, eventData, onItemizedOverlayTouchMove);
                elements.app.on(self.eventType.end, eventData, onItemizedOverlayTouchEnd);
            },

            /**
             * Itemized control overlay touchend or mouseup.
             * @param {Event} e Touch or mouse end event.
             */
            onItemizedOverlayTouchEnd = function(e) {
                elements.overlayCtrlItemized.hide();
                elements.app.off(self.eventType.move, onItemizedOverlayTouchMove);
                elements.app.off(self.eventType.end, onItemizedOverlayTouchEnd);
                WH.File.autoSave();
            },

            /**
             * Itemized control overlay touchend or mouseup.
             * @param {Event} e Touch or mouse move event.
             */
            onItemizedOverlayTouchMove = function(e) {
                var userX = self.isTouchDevice ? e.originalEvent.changedTouches[0].clientX : e.clientX,
                    userY = self.isTouchDevice ? e.originalEvent.changedTouches[0].clientY : e.clientY,
                    newIndex;

                if (userX > e.data.listLeft && userX < e.data.listRight &&
                    userY > e.data.listTop && userY < e.data.listBottom) {
                    newIndex = Math.floor((userY - e.data.listTop) / e.data.itemHeight);
                } else {
                    newIndex = -1;
                }

                if (newIndex != e.data.changedIndex) {
                    e.data.itemEls.removeClass(settings.activeClass);
                    if (newIndex == -1) {
                        newIndex = e.data.originalIndex;
                    } else {
                        e.data.itemEls[newIndex].className += ' ' + settings.activeClass;
                    }
                    e.data.changedIndex = newIndex;
                    WH.Studio.setParameter(e.data.pluginId, e.data.paramKey, newIndex);
                }
            };

        /**
         * Update a control to reflect a changed plugin parameter.
         * @param {Number} pluginId Unique ID of the plugin.
         * @param {String} paramKey The parameter to change.
         * @param {Object} paramValues Object containing all the values of the parameter.
         */
        this.updateControl = function(paramKey, paramValues) {
            var ctrlEl = pluginEl.find(settings.ctrlClass + '[data-' + settings.data.paramKey + '="' + paramKey + '"]'),
                ctrlType = ctrlEl.data(settings.data.paramType);

            switch (ctrlType) {
                case settings.ctrlTypes.generic:
                    var slider = elements.overlayCtrlGeneric.find(settings.overlaySlider);
                    ctrlEl.find(settings.ctrlValueClass).text(paramValues.value.toFixed(2));
                    elements.overlayCtrlGeneric.find(settings.overlayValue).text(paramValues.value.toFixed(2));
                    elements.overlayCtrlGeneric.find(settings.overlaySliderThumb).height(slider.height() * paramValues.valueNormalized);
                    break;
                case settings.ctrlTypes.itemized:
                    ctrlEl.find(settings.ctrlValueClass).text(paramValues.model[paramValues.valueNormalized].key);
                    break;
                case settings.ctrlTypes.boolean:
                    ctrlEl.toggleClass(settings.selectedClass, paramValues.value);
                    break;
            }
        };

        // extend AbstractView
        WH.AbstractView.call(this, settings);

        // initialise
        init();
    }

    /**
     * Exports
     */
    WH.PluginView = function(plugin, containerEl, channelIndex) {
        return new pluginView(plugin, containerEl, channelIndex);
    };

})(WH);