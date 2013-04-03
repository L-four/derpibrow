// Avoid `console` errors in browsers that lack a console.
(function() {
    var method;
    var noop = function () {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());

// Place any jQuery/helper plugins in here.

/*! Copyright (c) 2011 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 * Thanks to: Seamus Leahy for adding deltaX and deltaY
 *
 * Version: 3.0.6
 * 
 * Requires: 1.2.2+
 */
(function(a){
    function d(b){var c=b||window.event,d=[].slice.call(arguments,1),e=0,f=!0,g=0,h=0;return b=a.event.fix(c),b.type="mousewheel",c.wheelDelta&&(e=c.wheelDelta/120),c.detail&&(e=-c.detail/3),h=e,c.axis!==undefined&&c.axis===c.HORIZONTAL_AXIS&&(h=0,g=-1*e),c.wheelDeltaY!==undefined&&(h=c.wheelDeltaY/120),c.wheelDeltaX!==undefined&&(g=-1*c.wheelDeltaX/120),d.unshift(b,e,g,h),(a.event.dispatch||a.event.handle).apply(this,d)}var b=["DOMMouseScroll","mousewheel"];if(a.event.fixHooks)for(var c=b.length;c;)a.event.fixHooks[b[--c]]=a.event.mouseHooks;a.event.special.mousewheel={setup:function(){if(this.addEventListener)for(var a=b.length;a;)this.addEventListener(b[--a],d,!1);else this.onmousewheel=d},teardown:function(){if(this.removeEventListener)for(var a=b.length;a;)this.removeEventListener(b[--a],d,!1);else this.onmousewheel=null}},a.fn.extend({mousewheel:function(a){return a?this.bind("mousewheel",a):this.trigger("mousewheel")},unmousewheel:function(a){return this.unbind("mousewheel",a)}})
})(jQuery);

/*
 * Color Thief v1.0
 * by Lokesh Dhakar - http://www.lokeshdhakar.com
 *
 * Licensed under the Creative Commons Attribution 2.5 License - http://creativecommons.org/licenses/by/2.5/
 *
 * # Thanks
 * Nick Rabinowitz: Created quantize.js which is used by the median cut palette function. This handles all the hard clustering math.
 * John Schulz: All around mad genius who helped clean and optimize the code. @JFSIII
 *
 * ## Classes
 * CanvasImage
 * ## Functions
 * getDominantColor()
 * createPalette()
 * getAverageRGB()
 * createAreaBasedPalette()
 *
 * Requires jquery and quantize.js.
 */

(function(MMCQ){
    window.ColorThief = {
        getDominantColor: getDominantColor,
        getAverageRGB: getAverageRGB,
    };
    /*
      CanvasImage Class
      Class that wraps the html image element and canvas.
      It also simplifies some of the canvas context manipulation
      with a set of helper functions.
    */
    var CanvasImage = function (image) {
        // If jquery object is passed in, get html element
        imgEl = (image.jquery) ? image[0] : image;

        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');

        document.body.appendChild(this.canvas);
        var ratio = imgEl.width / imgEl.height;
        var height;
        var width;
        var maxSize = 50;
        if (ratio > 1) {
            width = maxSize;
            height = maxSize / ratio;
        }
        else {
            height = maxSize;
            width  = maxSize * ratio;
        }
        this.width = this.canvas.width = width;
        this.height = this.canvas.height = height;

        this.context.drawImage(imgEl, 0, 0, this.width, this.height);
    };

    CanvasImage.prototype.clear = function () {
        this.context.clearRect(0, 0, this.width, this.height);
    };

    CanvasImage.prototype.update = function (imageData) {
        this.context.putImageData(imageData, 0, 0);
    };

    CanvasImage.prototype.getPixelCount = function () {
        return this.width * this.height;
    };

    CanvasImage.prototype.getImageData = function () {
        return this.context.getImageData(0, 0, this.width, this.height);
    };

    CanvasImage.prototype.removeCanvas = function () {
        $(this.canvas).remove();
    };


    /*
     * getDominantColor(sourceImage)
     * returns {r: num, g: num, b: num}
     *
     * Use the median cut algorithm provided by quantize.js to cluster similar
     * colors and return the base color from the largest cluster. */
    function getDominantColor(sourceImage) {

        var palette = createPalette(sourceImage, 5);
        var dominant = palette[0];

        return dominant;
    }


    /*
     * createPalette(sourceImage, colorCount)
     * returns array[ {r: num, g: num, b: num}, {r: num, g: num, b: num}, ...]
     *
     * Use the median cut algorithm provided by quantize.js to cluster similar
     * colors.
     *
     * BUGGY: Function does not always return the requested amount of colors. It can be +/- 2.
     */
    function createPalette(sourceImage, colorCount) {

        // Create custom CanvasImage object
        var image = new CanvasImage(sourceImage),
            imageData = image.getImageData(),
            pixels = imageData.data,
            pixelCount = image.getPixelCount();

        // Store the RGB values in an array format suitable for quantize function
        var pixelArray = [];
        for (var i = 0, offset, r, g, b, a; i < pixelCount; i++) {
            offset = i * 4;
            r = pixels[offset + 0];
            g = pixels[offset + 1];
            b = pixels[offset + 2];
            a = pixels[offset + 3];
            // If pixel is mostly opaque and not white
            if (a >= 125) {
                if (!(r > 250 && g > 250 && b > 250)) {
                    pixelArray.push([r, g, b]);
                }
            }
        }

        // Send array to quantize function which clusters values
        // using median cut algorithm

        var cmap = MMCQ.quantize(pixelArray, colorCount);
        var palette = cmap.palette();

        // Clean up
        image.removeCanvas();

        return palette;

    }


    /*
     * getAverageRGB(sourceImage)
     * returns {r: num, g: num, b: num}
     *
     * Add up all pixels RGB values and return average.
     * Tends to return muddy gray/brown color. Most likely, you'll be better
     * off using getDominantColor() instead.
     */
    function getAverageRGB(sourceImage) {
        // Config
        var sampleSize = 10;

        // Create custom CanvasImage object
        var image = new CanvasImage(sourceImage),
            imageData = image.getImageData(),
            pixels = imageData.data,
            pixelCount = image.getPixelCount();

        // Reset vars
        var i = 0,
            count = 0,
            rgb = {r:0, g:0, b:0};

        // Loop through every # pixels. (# is set in Config above via the blockSize var)
        // Add all the red values together, repeat for blue and green.
        // Last step, divide by the number of pixels checked to get average.
        while ( (i += sampleSize * 4) < pixelCount ) {
            // if pixel is mostly opaque
            if (pixels[i+3] > 125) {
                ++count;
                rgb.r += pixels[i];
                rgb.g += pixels[i+1];
                rgb.b += pixels[i+2];
            }
        }

        rgb.r = ~~(rgb.r/count);
        rgb.g = ~~(rgb.g/count);
        rgb.b = ~~(rgb.b/count);

        return rgb;
    }


    /*
     * createAreaBasedPalette(sourceImage, colorCount)
     * returns array[ {r: num, g: num, b: num}, {r: num, g: num, b: num}, ...]
     *
     * Break the image into sections. Loops through pixel RGBS in the section and average color.
     * Tends to return muddy gray/brown color. You're most likely better off using createPalette().
     *
     * BUGGY: Function does not always return the requested amount of colors. It can be +/- 2.
     *
     */
    function createAreaBasedPalette(sourceImage, colorCount) {

        var palette = [];

        // Create custom CanvasImage object
        var image = new CanvasImage(sourceImage),
            imageData = image.getImageData(),
            pixels = imageData.data,
            pixelCount = image.getPixelCount();


        // How big a pixel area does each palette color get
        var rowCount = Math.round(Math.sqrt(colorCount)),
            colCount = rowCount,
            colWidth = Math.round(image.width / colCount),
            rowHeight = Math.round(image.height / rowCount);

        // Loop through pixels section by section.
        // At the end of each section, push the average rgb color to palette array.
        for (var i = 0, vertOffset; i<rowCount; i++) {
            vertOffset = i * rowHeight * image.width * 4;

            for (var j = 0, horizOffset, rgb, count; j<colCount; j++) {
                horizOffset = j * colWidth * 4;
                rgb = {r:0, g:0, b:0};
                count = 0;

                for (var k = 0, rowOffset; k < rowHeight; k++) {
                    rowOffset = k * image.width * 4;

                    for (var l = 0, offset; l < colWidth; l++) {
                        offset = vertOffset + horizOffset + rowOffset + (l * 4);
                        rgb.r += pixels[offset];
                        rgb.g += pixels[offset+1];
                        rgb.b += pixels[offset+2];
                        count++;
                    }

                }
                rgb.r = ~~(rgb.r/count);
                rgb.g = ~~(rgb.g/count);
                rgb.b = ~~(rgb.b/count);
                palette.push(rgb);
            }
        }

        return palette;
    }
})(MMCQ);