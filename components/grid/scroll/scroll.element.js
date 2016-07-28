var GridScroll = Ractive.extend({
    data:function(){
        return {
            // Check whether to use the swipe event on the input range slider
            hasTouchEvents: false,

            // Vars for handling continuous scrolling on Up/Down buttons pressing
            mousedownTimeout: null,
            mousedownInterval: null,

            height: '',
            show: false,
            min: 0,
            max: 100,
            value: 0,
            ratio: 0.5,
        }
    },
    computed:{
        scrollSliderHeight: function(){
            // There are 2 buttons of 16px height and 5px margin + 5px fix
            var scrollHeight = parseInt(this.get('height')) - 2 * (16 + 5 + 5);

            // Slider thumb height is proportional to (maxRowNumr / maxLimit)
            var retio = this.get('ratio');
            if (retio < 0.05) retio = 0.05;
            var sliderThumbHeight = Math.floor(scrollHeight * retio);
            this.setThumbWidth(sliderThumbHeight);

            // So, height of the slider input is (we use "width" because slider is rotated(90deg))
            return scrollHeight + 'px';
        },
    },

    oninit: function (options) {
        // Set "hasTouchEvents"
        var self = this;
        var hasTouch = 'ontouchstart' in document.documentElement || 'ontouchstart' in window;
        self.set('hasTouchEvents', hasTouch);

        this.on({
            swipe_slider: function (event) {
              var deltaY = event.original.deltaY;

              if (deltaY !== 0) {
                var sliderHeight = this.find('.scroll-slider-div').offsetHeight;
                var maxRowNum = this.get('_maxRowNumber');
                var dy = Math.floor(maxRowNum * deltaY / sliderHeight);
                this.fire('handleScroll',-dy);
              }

              return false;
            },

            scroll_up: function () {
                this.fire('handleScroll',3);
            },

            scroll_down: function () {
                this.fire('handleScroll',-3);
            },

            continuous_scroll_up: function () {
                this.handleContinuousScroll(3);
            },

            continuous_scroll_down: function () {
                this.handleContinuousScroll(-3);
            },

            stop_scroll: function () {
                clearTimeout(this.get('mousedownTimeout'));
                clearInterval(this.get('mousedownInterval'));
            },

            slider_changed: function () { //auto hendle by observe
//              var newVal = this.get('value');
//              var dy = this.get('startFromRow') - newVal;
//              console.log(dy, this.get('startFromRow'), newVal);
//              this.fire('handleScroll',dy);
            },
        });
    },


    /**
     * Set the thumb width for INPUT type="range"
     * @param {Number} width
     */
    setThumbWidth: function (width) {
      var styleSheets = document.styleSheets;
      var lastSS = styleSheets[(styleSheets.length - 1)];

      var selector = '';
      if (window.CSSRule.WEBKIT_KEYFRAMES_RULE) {
        selector = 'input[type=range].scroll-slider-width::-webkit-slider-thumb';
      }
      else if (window.CSSRule.MOZ_KEYFRAMES_RULE) {
        selector = 'input[type=range].scroll-slider-width::-moz-range-thumb';
      }
      else if (window.CSSRule.MS_KEYFRAMES_RULE) {
        selector = 'input[type=range].scroll-slider-width::-ms-thumb';
      }
      else {   // window.CSSRule.O_KEYFRAMES_RULE
        return;
      }

      var rule = 'width: ' + width + 'px;';

      if (lastSS.addRule) {
        lastSS.addRule(selector, rule);
      }
      else if (lastSS.insertRule) {
        lastSS.insertRule(selector + ' { ' + rule + ' }', lastSS.cssRules.length);
      }
    },

    /**
     * Handles long pressing of Up/Down buttons
     * @param {Number} dy -- Shift to scroll
     */
    handleContinuousScroll: function (dy) {
      // Just in case: Clear timers when a user quickly scrolls Up/Down back and forth
      clearTimeout(this.get('mousedownTimeout'));
      clearInterval(this.get('mousedownInterval'));
      var obj = this;
      var timer = setTimeout(function () {
          var interval = setInterval(function () {
              obj.fire('handleScroll',dy);
            },
            50
          );
          obj.set('mousedownInterval', interval);
        },
        250
      );

      obj.set('mousedownTimeout', timer);
    },
});