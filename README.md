resizable-columns-mootools
==========================

A small library which provides the facility for resizable columns. 

Most systems of resizable columns simply increase the overall width of the column container, only changing the column width of the column to the left of the drag-handle. This library keeps the overall width of the column container constant and adjusts instead the width of the columns to either side of the drag handle.

Example Usage:
=============

var RC = new ResizableColumns('arcGrid',{				// container id
	columnSelector:'.column',						  	      // css class for columns
	messageSelector:'.col_msg',							      // css class for column header text
	minWidth:64,										              // can't resize smaller than this
	linkedContainer:'arcGridRows'						      // causes the row columns to resize along with the header columns
});
