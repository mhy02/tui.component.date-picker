/**
 * @fileoverview Datepicker component
 * @author NHN ent FE dev Lab <dl_javascript@nhnent.com>
 */
'use strict';

var Calendar = require('../calendar');
var RangeModel = require('./rangeModel');
var Timepicker = require('../timepicker');
var constants = require('../constants');
var localeTexts = require('../localeTexts');
var dateUtil = require('../dateUtil');
var setTouchClickEvent = require('../setTouchClickEvent');
var tmpl = require('../../template/datepicker/index.hbs');
var DatepickerInput = require('./input');

var util = tui.util;

var DEFAULT_LANGUAGE_TYPE = constants.DEFAULT_LANGUAGE_TYPE;
var TYPE_DATE = constants.TYPE_DATE;
var TYPE_MONTH = constants.TYPE_MONTH;
var TYPE_YEAR = constants.TYPE_YEAR;
var CLASS_NAME_NEXT_YEAR_BTN = constants.CLASS_NAME_NEXT_YEAR_BTN;
var CLASS_NAME_NEXT_MONTH_BTN = constants.CLASS_NAME_NEXT_MONTH_BTN;
var CLASS_NAME_PREV_YEAR_BTN = constants.CLASS_NAME_PREV_YEAR_BTN;
var CLASS_NAME_PREV_MONTH_BTN = constants.CLASS_NAME_PREV_MONTH_BTN;

var CLASS_NAME_SELECTABLE = 'tui-is-selectable';
var CLASS_NAME_BLOCKED = 'tui-is-blocked';
var CLASS_NAME_SELECTED = 'tui-is-selected';
var CLASS_NAME_CHECKED = 'tui-is-checked';
var CLASS_NAME_SELECTOR_BUTTON = 'tui-datepicker-selector-button';
var CLASS_NAME_TODAY = 'tui-calendar-today';

var SELECTOR_BODY = '.tui-datepicker-body';
var SELECTOR_FOOTER = '.tui-datepicker-footer';
var SELECTOR_DATE_ICO = '.tui-ico-date';

/**
 * Merge default option
 * @ignore
 * @param {object} option - Datepicker option
 * @returns {object}
 */
var mergeDefaultOption = function(option) {
    option = util.extend({
        language: DEFAULT_LANGUAGE_TYPE,
        calendar: {},
        timepicker: null,
        input: {
            element: null,
            format: null
        },
        date: null,
        showAlways: false,
        type: TYPE_DATE,
        selectableRanges: [[constants.MIN_DATE, constants.MAX_DATE]],
        openers: [],
        autoClose: true
    }, option);

    option.localeText = localeTexts[option.language];
    if (!util.isObject(option.calendar)) {
        throw new Error('Calendar option must be an object');
    }
    if (!util.isObject(option.input)) {
        throw new Error('Input option must be an object');
    }
    if (!util.isArray(option.selectableRanges)) {
        throw new Error('Selectable-ranges must be a 2d-array');
    }

    // override calendar option
    option.calendar.language = option.language;
    option.calendar.type = option.type;

    return option;
};

/**
 * @Class
 * @param {HTMLElement|jQuery|string} container - Container element of datepicker
 * @param {Object} [option] - Options
 *      @param {Date|number} [option.date] - Initial date. Default - null for no initial date
 *      @param {string} [option.type = 'date'] - Datepicker type - ('date' | 'month' | 'year')
 *      @param {string} [option.language='en'] - Language key
 *      @param {object|boolean} [option.timePicker] - {@link Timepicker} option
 *      @param {object} [option.calendar] - {@link Calendar} option
 *      @param {object} [option.input] - Input option
 *      @param {HTMLElement|string|jQuery} [option.input.element] - Input element
 *      @param {string} [option.intput.format = 'yyyy-mm-dd'] - Date string format
 *      @param {Array.<Array.<Date|number>>} [options.selectableRanges = 1900/1/1 ~ 2999/12/31]
 *                                                                      - Selectable date ranges.
 *      @param {Array} [option.openers = []] - Opener button list (example - icon, button, etc.)
 *      @param {boolean} [option.showAlways = false] - Whether the datepicker shows always
 *      @param {boolean} [option.autoClose = true] - Close after click a date
 * @tutorial datepicker-basic
 * @tutorial datepicker-inline
 * @tutorial datepicker-selectable-ranges
 * @tutorial datetimepicker
 * @tutorial month-year-pickers
 * @example
 *
 *   var range1 = [new Date(2015, 2, 1), new Date(2015, 3, 1)];
 *   var range2 = [1465570800000, 1481266182155]; // timestamps
 *
 *   var picker1 = new tui.component.Datepicker('#datepicker-container1, {
 *       showAlways: true
 *   });
 *
 *
 *   var picker2 = new tui.component.Datepicker('#datepicker-container2, {
 *      showAlways: true,
 *      timepicker: true
 *   });
 *
 *   var picker3 = new tui.component.Datepicker('#datepicker-container3', {
 *      // There are two supporting types by default - 'en' and 'ko'.
 *      // See "{@link Datepicker.localeTexts}"
 *       language: 'ko',
 *       calendar: {
 *          showToday: true
 *       },
 *       timepicker: {
 *           showMeridiem: true,
 *           defaultHour: 13,
 *           defaultMinute: 24
 *       },
 *       input: {
 *           element: '#datepicker-input',
 *           format: 'yyyy년 MM월 dd일 hh:mm A'
 *       }
 *       type: 'date',
 *       date: new Date(2015, 0, 1) // or timestamp. (default: null-(no initial date))
 *       selectableRanges: [range1, range2],
 *       openers: ['#opener']
 *   });
 */
var Datepicker = util.defineClass(/** @lends Datepicker.prototype */{
    static: {
        /**
         * Locale text data
         * @type {object}
         * @memberof Datepicker
         * @static
         * @example
         *
         * tui.component.Datepicker.localeTexts['customKey'] = {
         *     titles: {
         *         // days
         *         DD: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
         *         // daysShort
         *         D: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fir', 'Sat'],
         *         // months
         *         MMMM: [
         *             'January', 'February', 'March', 'April', 'May', 'June',
         *             'July', 'August', 'September', 'October', 'November', 'December'
         *         ],
         *         // monthsShort
         *         MMM: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
         *     },
         *     titleFormat: 'MMM yyyy',
         *     todayFormat: 'D, MMMM dd, yyyy',
         *     date: 'Date',
         *     time: 'Time'
         * };
         *
         * var datepicker = new tui.component.Datepicker('#datepicker-container', {
         *     language: 'customKey'
         * });
         */
        localeTexts: localeTexts
    },
    init: function(container, option) {
        option = mergeDefaultOption(option);

        /**
         * Language type
         * @type {string}
         * @private
         */
        this._language = option.language;

        /**
         * Datepicker container
         * @type {jQuery}
         * @private
         */
        this._$container = $(container);

        /**
         * Datepicker element
         * @type {jQuery}
         * @private
         */
        this._$element = $(tmpl(option)).appendTo(this._$container);

        /**
         * Calendar instance
         * @type {Calendar}
         * @private
         */
        this._calendar = new Calendar(this._$element.find(SELECTOR_BODY), option.calendar);

        /**
         * Timepicker instance
         * @type {Timepicker}
         * @private
         */
        this._timepicker = null;

        /**
         * Datepicker input
         * @type {DatepickerInput}
         * @private
         */
        this._datepickerInput = null;

        /**
         * Object having date values
         * @type {Date}
         * @private
         */
        this._date = null;

        /**
         * Selectable date-ranges model
         * @type {RangeModel}
         * @private
         */
        this._rangeModel = null;

        /**
         * openers - opener list
         * @type {Array}
         * @private
         */
        this._openers = [];

        /**
         * State of picker enable
         * @type {boolean}
         * @private
         */
        this._isEnabled = true;

        /**
         * ID of instance
         * @private
         * @type {number}
         */
        this._id = 'datepicker-selectable-ranges' + util.stamp(this);

        /**
         * Datepicker type
         * @type {TYPE_DATE|TYPE_MONTH|TYPE_YEAR}
         * @private
         */
        this._type = option.type;

        /**
         * Show always or not
         * @type {boolean}
         */
        this.showAlways = option.showAlways;

        /**
         * Close after select a date
         * @type {boolean}
         */
        this.autoClose = option.autoClose;

        this._initializeDatepicker(option);
    },

    /**
     * Initialize method
     * @param {Object} option - user option
     * @private
     */
    _initializeDatepicker: function(option) {
        this.setRanges(option.selectableRanges);
        this._setEvents(option);
        this._initTimepicker(option.timepicker);
        this.setInput(option.input.element);
        this.setDateFormat(option.input.format);
        this.setDate(option.date);

        util.forEach(option.openers, this.addOpener, this);
        if (!this.showAlways) {
            this._$element.hide();
        }

        if (this.getType() === TYPE_DATE) {
            this._$element.find(SELECTOR_BODY).addClass('tui-datepicker-type-date');
        }
    },

    /**
     * Set events
     * @param {object} option - Constructor option
     * @private
     */
    _setEvents: function(option) {
        setTouchClickEvent(this._$element, $.proxy(this._onClickDate, this), {
            selector: '.' + CLASS_NAME_SELECTABLE,
            namespace: this._id
        });

        setTouchClickEvent(this._$element, $.proxy(this._onClickCalendarTitle, this), {
            selector: '.tui-calendar-title',
            namespace: this._id
        });

        if (option.timepicker && option.timepicker.layoutType === 'tab') {
            setTouchClickEvent(this._$element, $.proxy(this._onClickSelectorButton, this), {
                selector: '.' + CLASS_NAME_SELECTOR_BUTTON,
                namespace: this._id
            });
        }

        this._calendar.on('draw', this._onDrawCalendar, this);
    },

    /**
     * Off datepicker's events
     * @param {string|jQuery|Element} el - Element
     * @private
     */
    _offDatepickerEvents: function(el) {
        $(el).off('.' + this._id);
    },

    /**
     * Set Timepicker instance
     * @param {object|boolean} opTimepicker - Timepicker instance
     * @private
     */
    _initTimepicker: function(opTimepicker) {
        var layoutType;
        if (!opTimepicker) {
            return;
        }

        layoutType = opTimepicker.layoutType || '';
        if (layoutType.toLowerCase() === 'tab') {
            this._timepicker = new Timepicker(this._$element.find(SELECTOR_BODY), opTimepicker);
            this._timepicker.hide();
        } else {
            this._timepicker = new Timepicker(this._$element.find(SELECTOR_FOOTER), opTimepicker);
        }

        this._timepicker.on('change', function(ev) {
            var prevDate;
            if (this._date) {
                prevDate = new Date(this._date);
                this.setDate(prevDate.setHours(ev.hour, ev.minute));
            }
        }, this);
    },

    /**
     * Calendar-header click handler
     * @private
     */
    _onClickCalendarTitle: function() {
        this.drawUpperCalendar(this._date);
    },

    /**
     * Selector button click handler
     * @param {jQuery.Event} ev - Event object
     * @private
     */
    _onClickSelectorButton: function(ev) {
        var btnSelector = '.' + CLASS_NAME_SELECTOR_BUTTON;
        var $selectedBtn = $(ev.target).closest(btnSelector);
        var isDate = !!$selectedBtn.find(SELECTOR_DATE_ICO).length;

        if (isDate) {
            this._calendar.show();
            this._timepicker.hide();
        } else {
            this._calendar.hide();
            this._timepicker.show();
        }
        this._$element.find(btnSelector).removeClass(CLASS_NAME_CHECKED);
        $selectedBtn.addClass(CLASS_NAME_CHECKED);
    },

    /**
     * Returns whether the element is opener
     * @param {string|jQuery|HTMLElement} element - Element
     * @returns {boolean}
     * @private
     */
    _isOpener: function(element) {
        var el = $(element)[0];

        return util.inArray(el, this._openers) > -1;
    },

    /**
     * Set selectable-class-name to selectable date element.
     * @param {jQuery} $dateElements - date element
     * @private
     */
    _setDefaultClassName: function($dateElements) {
        var self = this;

        $dateElements.each(function(idx, el) {
            var $el = $(el);
            var timestamp = $el.data('timestamp');
            var date = new Date(timestamp);
            var isToday = timestamp === new Date().setHours(0, 0, 0, 0);

            if (isToday) {
                $el.addClass(CLASS_NAME_TODAY);
            }

            if (self.isSelectable(date)) {
                $el.addClass(CLASS_NAME_SELECTABLE);
            } else {
                $el.addClass(CLASS_NAME_BLOCKED);
            }
        });
    },

    /**
     * Set selected-class-name to selected date element
     * @param {jQuery} $dateElements - date element
     * @private
     */
    _setSelectedClassName: function($dateElements) {
        var self = this;

        $dateElements.each(function(idx, el) {
            var $el = $(el);
            var date = new Date($el.data('timestamp'));

            if (self.isSelectable(date) && self.isSelected(date)) {
                $el.addClass(CLASS_NAME_SELECTED);
            } else {
                $el.removeClass(CLASS_NAME_SELECTED);
            }
        });
    },

    /**
     * Set value a date-string of current this instance to input element
     * @private
     */
    _syncToInput: function() {
        if (!this._date) {
            return;
        }

        this._datepickerInput.setDate(this._date);
    },

    /**
     * Event handler for mousedown of document<br>
     * - When click the out of layer, close the layer
     * @param {Event} ev - Event object
     * @private
     */
    _onMousedownDocument: function(ev) {
        var evTarget = ev.target;
        var isContains = $.contains(this._$element[0], evTarget);
        var isInput = this._datepickerInput.is(evTarget);
        var isInOpener = !!$(evTarget).closest(this._openers).length;
        var shouldClose = !(this.showAlways || isInput || isContains || isInOpener);

        if (shouldClose) {
            this.close();
        }
    },

    /**
     * Event handler for click of calendar<br>
     * - Update date form event-target
     * @param {Event} ev - event object
     * @private
     */
    _onClickDate: function(ev) {
        var timestamp = $(ev.target).data('timestamp');
        var newDate = new Date(timestamp);
        var timepicker = this._timepicker;
        var prevDate = this._date;
        var shouldLowerCalendarType = this.getCalendarType() !== this._type;

        if (shouldLowerCalendarType) {
            this.drawLowerCalendar(newDate);
        } else {
            if (timepicker) {
                newDate.setHours(timepicker.getHour(), timepicker.getMinute());
            } else if (prevDate) {
                newDate.setHours(prevDate.getHours(), prevDate.getMinutes());
            }
            this.setDate(newDate);

            if (!this.showAlways && this.autoClose) {
                this.close();
            }
        }
    },

    /**
     * Event handler for 'draw'-custom event of calendar
     * @param {Object} eventData - custom event data
     * @see {Calendar.draw}
     * @private
     */
    _onDrawCalendar: function(eventData) {
        var $dateElements = eventData.$dateElements;

        this._setDefaultClassName($dateElements);
        if (this._date) {
            this._setSelectedClassName($dateElements);
        }

        this._hideUselessButtons();
    },

    /**
     * Hide useless buttons (next, next-year, prev, prev-year)
     * @see Don't save buttons reference. The buttons are rerendered every "calendar.darw".
     * @private
     */
    _hideUselessButtons: function() {
        var nextYearDate = this._calendar.getNextYearDate();
        var prevYearDate = this._calendar.getPrevYearDate();
        var maxTimestamp = this._rangeModel.getMaximumValue();
        var minTimestamp = this._rangeModel.getMinimumValue();
        var nextMonthDate, prevMonthDate;

        if (this.getCalendarType() === TYPE_DATE) {
            nextMonthDate = this._calendar.getNextDate();
            prevMonthDate = this._calendar.getPrevDate();

            prevYearDate.setDate(1);
            nextYearDate.setDate(1);
            prevMonthDate.setMonth(prevMonthDate.getMonth() + 1, 0);
            nextMonthDate.setDate(1);

            if (maxTimestamp < nextMonthDate.getTime()) {
                this._$element.find('.' + CLASS_NAME_NEXT_MONTH_BTN).hide();
            }

            if (minTimestamp > prevMonthDate.getTime()) {
                this._$element.find('.' + CLASS_NAME_PREV_MONTH_BTN).hide();
            }
        } else {
            prevYearDate.setMonth(12, 0);
            nextYearDate.setMonth(0, 1);
        }

        if (maxTimestamp < nextYearDate.getTime()) {
            this._$element.find('.' + CLASS_NAME_NEXT_YEAR_BTN).hide();
        }

        if (minTimestamp > prevYearDate.getTime()) {
            this._$element.find('.' + CLASS_NAME_PREV_YEAR_BTN).hide();
        }
    },

    /**
     * Input change handler
     * @private
     * @throws {Error}
     */
    _onChangeInput: function() {
        var date;
        try {
            date = this._datepickerInput.getDate();

            if (this.isSelectable(date)) {
                if (this._timepicker) {
                    this._timepicker.setTime(date.getHours(), date.getMinutes());
                }
                this.setDate(date);
            } else {
                this._syncToInput(); // Rollback input value
            }
        } catch (err) {
            /**
             * Parsing error from input-text
             * @event Datepicker#error
             * @example
             *
             * datepicker.on('error', function(err) {
             *     console.error(err.message);
             * });
             */
            this.fire('error', {
                type: 'ParsingError',
                message: err.message
            });
            this._syncToInput(); // Rollback input value
        }
    },

    /**
     * Returns whether the date is changed
     * @param {Date} date - Date
     * @returns {boolean}
     * @private
     */
    _isChanged: function(date) {
        var prevDate = this.getDate();

        return !prevDate || (date.getTime() !== prevDate.getTime());
    },

    /**
     * Returns current calendar type
     * @returns {'date'|'month'|'year'}
     */
    getCalendarType: function() {
        return this._calendar.getType();
    },

    /**
     * Returns datepicker type
     * @returns {'date'|'month'|'year'}
     */
    getType: function() {
        return this._type;
    },

    /**
     * Whether the provided date is selectable
     * @param {Date} date - Date instance
     * @returns {boolean}
     */
    isSelectable: function(date) {
        var start, end;

        if (!dateUtil.isValidDate(date)) {
            return false;
        }

        start = new Date(date);
        end = new Date(date);

        switch (this.getCalendarType()) {
            case TYPE_YEAR:
                start.setMonth(0, 1);
                end.setMonth(11, 31);
                break;
            case TYPE_MONTH:
                start.setDate(1);
                end.setMonth(end.getMonth() + 1, 0);
                break;
            default: break;
        }

        return this._rangeModel.hasOverlap(start.getTime(), end.getTime());
    },

    /**
     * Returns whether the date is selected or not
     * @param {Date} date - Date instance
     * @returns {boolean}
     */
    isSelected: function(date) {
        var curDate = new Date(this._date);

        date = new Date(date);
        switch (this.getCalendarType()) {
            case TYPE_DATE:
                return curDate.setHours(0, 0, 0, 0) === date.setHours(0, 0, 0, 0);
            case TYPE_MONTH:
                return (curDate.getFullYear() === date.getFullYear()) && (curDate.getMonth() === date.getMonth());
            case TYPE_YEAR:
                return curDate.getFullYear() === date.getFullYear();
            default:
                return false;
        }
    },

    /**
     * Set selectable ranges (prev ranges will be removed)
     * @param {Array.<Array<Date|number>>} ranges - (2d-array) Selectable ranges
     */
    setRanges: function(ranges) {
        ranges = tui.util.map(ranges, function(range) {
            var start = new Date(range[0]).getTime();
            var end = new Date(range[1]).getTime();

            return [start, end];
        });

        this._rangeModel = new RangeModel(ranges);
        this._refreshFromRanges();
    },

    /**
     * Add a range
     * @param {Date|number} start - startDate
     * @param {Date|number} end - endDate
     * @example
     * var start = new Date(2015, 1, 3);
     * var end = new Date(2015, 2, 6);
     *
     * datepicker.addRange(start, end);
     */
    addRange: function(start, end) {
        start = new Date(start).getTime();
        end = new Date(end).getTime();

        this._rangeModel.add(start, end);
        this._refreshFromRanges();
    },

    /**
     * Remove a range
     * @param {Date|number} start - startDate
     * @param {Date|number} end - endDate
     * @example
     * var start = new Date(2015, 1, 3);
     * var end = new Date(2015, 2, 6);
     *
     * datepicker.removeRange(start, end);
     */
    removeRange: function(start, end) {
        start = new Date(start).getTime();
        end = new Date(end).getTime();

        this._rangeModel.exclude(start, end);
        this._refreshFromRanges();
    },

    /**
     * Refresh datepicker
     * @private
     */
    _refreshFromRanges: function() {
        if (!this._date || !this.isSelectable(this._date)) {
            this.setNull();
        } else {
            this._calendar.draw(); // view update
        }
    },

    /**
     * Add opener
     * @param {HTMLElement|jQuery|string} opener - element or selector
     */
    addOpener: function(opener) {
        if (!this._isOpener(opener)) {
            this._openers.push($(opener)[0]);
            setTouchClickEvent(opener, $.proxy(this.toggle, this), {
                namespace: this._id
            });
        }
    },

    /**
     * Remove opener
     * @param {HTMLElement|jQuery|string} opener - element or selector
     */
    removeOpener: function(opener) {
        var $opener = $(opener);
        var index = util.inArray($opener[0], this._openers);

        if (index > -1) {
            this._offDatepickerEvents(opener);
            this._openers.splice(index, 1);
        }
    },

    /**
     * Remove all openers
     */
    removeAllOpeners: function() {
        this._offDatepickerEvents(this._openers);
        this._openers = [];
    },

    /**
     * Open datepicker
     * @example
     * datepicker.open();
     */
    open: function() {
        var docEvTypes;
        if (this.isOpened() || !this._isEnabled) {
            return;
        }

        this._calendar.draw({
            date: this._date || new Date(),
            type: this._type
        });
        this._$element.show();

        if (!this.showAlways) {
            docEvTypes = 'touchstart.' + this._id + ' mousedown.' + this._id;
            $(document).on(docEvTypes, $.proxy(this._onMousedownDocument, this));
        }

        /**
         * @event Datepicker#open
         * @example
         * datepicker.on('open', function() {
         *     alert('open');
         * });
         */
        this.fire('open');
    },

    /**
     * Raise calendar type
     *  - DATE --> MONTH --> YEAR
     * @param {Date} date - Date
     */
    drawUpperCalendar: function(date) {
        var currentType = this.getCalendarType();

        if (currentType === TYPE_DATE) {
            this._calendar.draw({
                date: date,
                type: TYPE_MONTH
            });
        } else if (currentType === TYPE_MONTH) {
            this._calendar.draw({
                date: date,
                type: TYPE_YEAR
            });
        }
    },

    /**
     * Lower calendar type
     *  - YEAR --> MONTH --> DATE
     * @param {Date} date - Date
     */
    drawLowerCalendar: function(date) {
        var currentType = this.getCalendarType();
        var originalType = this._type;
        var isLast = currentType === originalType;

        if (isLast) {
            return;
        }

        if (currentType === TYPE_MONTH) {
            this._calendar.draw({
                date: date,
                type: TYPE_DATE
            });
        } else if (currentType === TYPE_YEAR) {
            this._calendar.draw({
                date: date,
                type: TYPE_MONTH
            });
        }
    },

    /**
     * Close datepicker
     * @exmaple
     * datepicker.close();
     */
    close: function() {
        if (!this.isOpened()) {
            return;
        }
        this._offDatepickerEvents(document);
        this._$element.hide();

        /**
         * Close event - Datepicker
         * @event Datepicker#close
         * @example
         * datepicker.on('close', function() {
         *     alert('close');
         * });
         */
        this.fire('close');
    },

    /**
     * Toggle: open-close
     * @example
     * datepicker.toggle();
     */
    toggle: function() {
        var isOpened = this.isOpened();

        if (isOpened) {
            this.close();
        } else {
            this.open();
        }
    },

    /**
     * Returns date object
     * @returns {?Date} - Date
     * @example
     * // 2015-04-13
     * datepicker.getDate(); // new Date(2015, 3, 13)
     */
    getDate: function() {
        if (!this._date) {
            return null;
        }

        return new Date(this._date);
    },

    /**
     * Set date and then fire 'update' custom event
     * @param {Date|number} date - Date instance or timestamp
     * @example
     * datepicker.setDate(new Date()); // Set today
     */
    setDate: function(date) {
        var isValidInput, newDate, shouldUpdate;

        if (date === null) {
            this.setNull();

            return;
        }

        isValidInput = util.isNumber(date) || util.isDate(date);
        newDate = new Date(date);
        shouldUpdate = isValidInput && this._isChanged(newDate) && this.isSelectable(newDate);

        if (shouldUpdate) {
            newDate = new Date(date);
            this._date = newDate;
            this._syncToInput();
            this._calendar.draw({date: newDate});
            if (this._timepicker) {
                this._timepicker.setTime(newDate.getHours(), newDate.getMinutes());
            }

            /**
             * Change event
             * @event Datepicker#change
             * @example
             *
             *   datepicker.on('change', function() {
             *       var newDate = datepicker.getDate();
             *
             *       console.log(newDate);
             *   });
             */
            this.fire('change');
        }
    },

    /**
     * Set null date
     */
    setNull: function() {
        var isChagned = this._date !== null;

        if (this._datepickerInput) {
            this._datepickerInput.clearText();
        }
        if (this._timepicker) {
            this._timepicker.setTime(0, 0);
        }
        this._date = null;
        this._calendar.draw(); // view update

        if (isChagned) {
            this.fire('change');
        }
    },

    /**
     * Set or update date-form
     * @param {String} [format] - date-format
     * @example
     * datepicker.setDateFormat('yyyy-MM-dd');
     * datepicker.setDateFormat('MM-dd, yyyy');
     * datepicker.setDateFormat('y/M/d');
     * datepicker.setDateFormat('yy/MM/dd');
     */
    setDateFormat: function(format) {
        this._datepickerInput.setFormat(format);
        this._syncToInput();
    },

    /**
     * Return whether the datepicker is opened or not
     * @returns {boolean}
     * @example
     * datepicker.close();
     * datepicker.isOpened(); // false
     *
     * datepicker.open();
     * datepicker.isOpened(); // true
     */
    isOpened: function() {
        return this._$element.css('display') !== 'none';
    },

    /**
     * Returns timepicker instance
     * @returns {?Timepicker} - Timepicker instance
     * @example
     * var timepicker = this.getTimepicker();
     */
    getTimepicker: function() {
        return this._timepicker;
    },

    /**
     * Returns calendar instance
     * @returns {Calendar}
     */
    getCalendar: function() {
        return this._calendar;
    },

    /**
     * Set input element
     * @param {string|jQuery|HTMLElement} element - Input element
     * @private
     */
    setInput: function(element) {
        var prev = this._datepickerInput;
        var localeText = localeTexts[this._language] || localeTexts[DEFAULT_LANGUAGE_TYPE];
        var prevFormat;

        if (prev) {
            prevFormat = prev.getFormat();
            prev.destroy();
        }

        this._datepickerInput = new DatepickerInput(element, {
            format: prevFormat,
            id: this._id,
            localeText: localeText
        });

        this._datepickerInput.on({
            change: this._onChangeInput,
            click: this.open
        }, this);

        this._syncToInput();
    },

    /**
     * Enable
     * @example
     * datepicker.disable();
     * datepicker.enable();
     */
    enable: function() {
        if (this._isEnabled) {
            return;
        }
        this._isEnabled = true;
        this._datepickerInput.enable();

        util.forEach(this._openers, function(opener) {
            $(opener).removeAttr('disabled');
            setTouchClickEvent(opener, $.proxy(this.toggle, this), {
                namespace: this._id
            });
        }, this);
    },

    /**
     * Disable
     * @example
     * datepicker.enable();
     * datepicker.disable();
     */
    disable: function() {
        if (!this._isEnabled) {
            return;
        }

        this._isEnabled = false;
        this.close();
        this._datepickerInput.disable();

        this._offDatepickerEvents(this._openers);
        util.forEach(this._openers, function(opener) {
            $(opener).attr('disabled', true);
        }, this);
    },

    /**
     * Destroy
     */
    destroy: function() {
        this._offDatepickerEvents(document);
        this._calendar.destroy();
        if (this._timepicker) {
            this._timepicker.destroy();
        }
        if (this._datepickerInput) {
            this._datepickerInput.destroy();
        }
        this._$element.remove();
        this.removeAllOpeners();

        this._calendar
            = this._timepicker
            = this._datepickerInput
            = this._$container
            = this._$element
            = this._date
            = this._rangeModel
            = this._openers
            = this._isEnabled
            = this._id
            = null;
    }
});

util.CustomEvents.mixin(Datepicker);
module.exports = Datepicker;
