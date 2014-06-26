/*
Script: resizableColumns.js
    MooTools Resizable columns - any number of columns.
    Inspired by, and based on the non-object-oriented work of <Chris Bolson at http://blog.cbolson.com/mootools-expandable-columns/>

    
Copyright:
    Copyright (c) 2014 Noel da Costa - <http://www.arcsoftware.co.za>

Author: Noel da Costa

    
License:
    http://creativecommons.org/licenses/by/3.0/
    If you copy, distribute or transmit the source code please retain the above copyright notice, author name and project URL.
    
Version:
    1.0

Dependencies:
    - MooTools Core 1.2.3 or newer
    - MooTools More 1.2.3.1 or newer: Drag.js, Drag.Move.js, 
    - When using MooTools More 1.2.3.x: Add "Delegation.js" as provided in the Demos/ Folder of the Tree Components
    - NB: don't use borders in your CSS for the columns.. these will cause it to break. Chris's original scrips had a "pad" option to counter-act this but it was written to work with 3 columns only and I've not been able to implement this feature for dynamic multiple columns.

Options:
    - columnSelector: (string, CSS selector) The selector used to find the columns
    - messageSelector: (string, CSS selector) The selector used to find the column messages - these are optional elements where actual running widths of columns will be displayed, one per column.
    - snap: (number) Pixel increments by which the resizing of columns will occur during drag.
    - minWidth: (number) Minimum column width
    - borderWidth (number, default:0) Values > 0 will add in an internal border to each column
    - borderStyle (string, default:'solid') as per css border spec.
    - borderColor (string, default:'#000')
    - linkedContainer (string | boolean, default:false) the element id of a container in which to also resize matching columns. Useful for keeping headers static above a vertically scrolling set of data rows.
    - type (string, default:'float') float | absolute - left edges will be adjusted for type absolute 
                
Events:
    - onComplete(): fires when the column is done resizing. Can be used to resize contents like form fields.
*/

var ResizableColumns = new Class({
    Implements: [Options],

    options: {
        columnSelector: '.resizableColumn', //  each column should have this css class
        messageSelector: '.columnMessage', //   selector for writing column widths in
        snap: 5, // define snap if required - set to 0 for no snap
        minWidth: 120, //   minimum column width
        borderWidth: 0, //  default: 0; values > 0 will add in an internal border to each column
        borderStyle: 'solid', // as per css border spec.
        borderColor: '#000',
        linkedContainer: false, // the element id of a container in which to also resize matching columns
        type: 'float' // float | absolute - left edges will be adjusted for type absolute 
    },

    // collects the columns and makes them resizable
    initialize: function(wrapper, options) {
        var self = this;
        this.setOptions(options);
        this.wrapper = $(wrapper); // define the column wrapper so as to be able to get the total width via mootools
        this.columns = $$('#' + this.wrapper.id + ' ' + this.options.columnSelector);
        if (this.options.linkedContainer) {
            this.linkedContainer = $(this.options.linkedContainer);
            this.linkedColumns = $$('#' + this.linkedContainer.id + ' ' + this.options.columnSelector);
        }
        this.padding = (this.columns.length - 1) * this.options.pad;
        this.columnTracker = $H();
        this.refresh();
        this.w_total = this.wrapper.getWidth(); // total width of wrapper
        this.w_min_c = this.options.minWidth; // minimum width for columns

        for (i = 1; i < this.columns.length; i++) {

            var col = self.columnTracker.get(i);
            self.makeColumnResizable($(col.id));
        }
    },

    // collects attributes for each comment and set's their width, updates column width message
    refresh: function() {
        var self = this;
        var count = 1;
        this.columns.each(function(col) {
            col.setProperty('index', count);
            var msgEl = col.getElement(self.options.messageSelector);
            self.columnTracker.set(count, {
                id: col.id,
                message: msgEl,
                initialWidth: col.getWidth()
            });
            if (msgEl) msgEl.set('text', col.getWidth() + 'px');
            count++;
        });
    },

    // works out how wide the other columns should be
    getWidthComplement: function(col) {
        var self = this;
        var width = self.w_total;
        this.columns.each(function(c) {


            if (c.id != col.id) {
                width -= c.getWidth();
            }
        });

        return width;
    },

    // returns a collection of columns to the left of the given column
    getLeftCols: function(col) {
        var self = this;
        var cols = [];
        for (i = 1; i < col.getProperty('index'); i++) {
            cols.push($(self.columnTracker.get(i).id));
        }
        return cols;
    },
    // returns a collection of columns to the right of the given column
    getRightCols: function(col) {
        var self = this;
        var cols = [];
        for (i = self.columns.length; i > col.getProperty('index'); i--) {
            cols.push($(self.columnTracker.get(i).id));
        }
        return cols;
    },

    // adds in the handles to the column headers and adds the events to these handles
    makeColumnResizable: function(col) {
        var self = this;

        var index = col.getProperty('index').toInt();
        var tracker = self.columnTracker.get(index);


        var adjIndex = col.getProperty('index').toInt() + 1;
        var adjTracker = self.columnTracker.get(adjIndex);
        var adjCol = $(adjTracker.id);
        if (self.options.linkedContainer) {
            var linkedCol = this.linkedColumns[index - 1];
            var linkedAdjCol = this.linkedColumns[adjIndex - 1];
        }

        col.makeResizable({
            handle: col.getChildren('.resize'),
            grid: self.options.snap,
            modifiers: {
                x: 'width',
                y: false
            },
            limit: {
                x: [self.options.minWidth, null]
            },

            onStart: function(el) {
                var that = this;
                this.state = {};
                this.state.adjInitWidth = adjTracker.initialWidth;
                this.state.initWidth = tracker.initialWidth;

                this.state.leftWidth = 0;
                self.getLeftCols(col).each(function(item) {
                    that.state.leftWidth += item.getWidth().toInt();
                });
                this.state.rightWidth = 0;
                self.getRightCols(col).each(function(item) {
                    that.state.rightWidth += item.getWidth().toInt();
                });
                this.state.limit = this.state.initWidth + this.state.adjInitWidth - self.options.minWidth;
            },
            onDrag: function(el) {
                if (el.getWidth() >= this.state.limit) {
                    el.setStyle("width", this.state.limit);
                }

                var colWidth = col.getWidth();
                // set adjacent col left position
                var adjLeft = colWidth.toInt() + this.state.leftWidth;
                if (self.options.type == 'absolute') {
                    adjCol.setStyle("left", adjLeft);
                }
                var padding = 0;

                // define and set adjacent col width 
                var adjWidth = this.state.initWidth + this.state.adjInitWidth - colWidth - (padding);
                adjCol.setStyle("width", adjWidth);

                // update messages
                if (tracker.message) tracker.message.set('text', colWidth + 'px');
                if (adjTracker.message) adjTracker.message.set('text', adjWidth + 'px');

                // update linked columns
                if (self.options.linkedContainer) {
                    linkedCol.setStyle("width", colWidth);
                    if (self.options.type == 'absolute') {
                        linkedAdjCol.setStyle("left", adjLeft);
                    }
                    linkedAdjCol.setStyle("width", adjWidth);
                }
            },
            onComplete: function(el) {
                self.columnTracker.get(index).initialWidth = col.getWidth();
                self.columnTracker.get(adjIndex).initialWidth = adjCol.getWidth();
            }
        });
    }
});