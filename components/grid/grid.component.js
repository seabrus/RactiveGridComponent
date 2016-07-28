var Grid = Ractive.extend({
  ver: '1.5.1',
  last: false,
  last_sort: '',
  partials_folder: 'partials/',
  component_folder: 'components/grid/',
  reel_speed: 2, // greater then 1!
  reel_timer: 0,
  dependencies: {
//        components:[],
    elements: [
      'grid/filter',
      'grid/filter/daterange',
      'grid/sort',
      'grid/scroll',
    ],
  },
  data: function(){
    return {
      show_partual: true,
      store: [],
      store_set: false,
      filtered_store: [],
      filtered_sorted_store: [],
      list: [],
      sorted: false,
      sort_type: 'ask', //desk
      mouseWheel_scroll: 3,
      cnt: 0,
      empty_mess: _e('Empty'),
      sel_def: _e('All'),
      agg_event: '',
      tableHeight: '',
      scrollHeight: '',
      scrollShow: false,
      scrollMin: 0,
      scrollMax: 100,
//            scrollValue: 0,
      scrollRatio: 0.5,
      scrollEnd: false,
      scrollTop: false,
      scrollBottom: false,
      // Number of rows in the grid table to display
      defaultMaxRowNumber: 20, // Default value
      minMaxRowNumber: 3, // Minimal acceptable value
      maxMaxRowNumber: 50, // Maximal acceptable value
      _maxRowNumber: 20, // Internal current value. Note: "maxRowNumber" is used as option when calling <grid ... />
      // List to display
      startFromRow: 0, // = scrollValue
      set_class: function(){
        return '';
      },
      set_colspan: function(e){

      },
      log: function(v){
        console.log(v);
      },
      is_cont: function(v){
        return this.get('content') == v;
      },
      is_object: function(v){
        return 'object' == typeof v;
      },
      is: function(c, v){
        return c == v;
      },
      formatters: function(){
        return this.formatters();
      },
    };
  }, // end of "data: ..."
  oninit: function(){
    var obj = this;
    window.addEventListener('resize', function(){
      obj.fire('grid_resize');
    }, false);

    // Set event handlers
    this.on({
      mouseWheel: function(event){
        event.original.preventDefault();
        var dy = (event.dy / 100 * this.get('mouseWheel_scroll'));
        clearTimeout(this.reel_timer);
        this.reelScroll(dy, function(d){
          obj.fire('scroll', d);
        });
        this.fire('scroll', dy);
      },
      swipe_tbody: function(event){
        var deltaY = event.original.deltaY;
        var obj = this;

        if(deltaY !== 0){
          var tbodyHeight = this.find('.grid-tbody').offsetHeight;
          var maxRowNum = this.get('_maxRowNumber');
          var dy = Math.floor(maxRowNum * deltaY / tbodyHeight);
          clearTimeout(this.reel_timer);
          this.reelScroll(dy, function(d){
            obj.fire('scroll', d);
          });
          this.fire('scroll', dy);
        }

        return false;
      },
      row_clicked: function(){
        if(this.reel_timer){
          clearTimeout(this.reel_timer);
          this.reel_timer = 0;
          return false;
        }
      },
      keypressed: function(event){ // up and down does not work in div element :(
        console.log('keypressed fire!');
        event.original.preventDefault();

        var maxLimit = this.get('filtered_sorted_store').length;
        var pageStep = Math.floor(maxLimit * 0.1);
        var keyCode = event.original.keyCode;
        switch(keyCode){
          case 38: // ArrowUp
            this.fire('scroll', -1);
            break;
          case 40: // ArrowDown
            this.fire('scroll', 1);
            break;
          case 33: // PageUp
            this.fire('scroll', -pageStep);
            break;
          case 34: // PageDown
            this.fire('scroll', pageStep);
            break;
          default:
            return false;
        }
      },
      grid_resize: function(){
        this.updateHight();
      },
      filter_changed: function(e){
        if(Ractive.DEBUG)
          console.log('pre-list-filter fired!');

        this.last = (Ractive.helper.isset(e)) ? e.context.name : this.last;
        var h = this.get('cols');
        var m = {};
        m.s = this.get('store');
        this.getFiltersVal(m, h); // filtering m.c - is a cur val
        var o = {};
        o.filtered_store = [];
        o.cnt = 0;
        o.agg = this.getAgg(h); // o.agg[i]{min, max, sum, avg, cnt}

        this.initFiltersSelOpts(o, h); // filtering o.c - is a col data object
        for(var i in m.s){
          if(this.checkCurRow(m.c, m.s[i]))
            continue;
          o.filtered_store.push(this.getRowCols(m.s[i], h));

          this.createAgg(o.agg, m.s[i]);
          o.cnt++;
          this.createFiltersSelOpts(o.c, m.s[i]);
        }

        this.compliteAgg(o.agg, o.cnt);

        this.sortFiltersSelOpts(o.c); // filtering
        this.setFiltersSelOpts(o, this.last); // filtering

        if(!this.get('store_set'))
          this.set('startFromRow', 0);
        this.set({
          cnt: o.cnt,
          filtered_store: o.filtered_store
        });

        if(this.get('agg_event')) // вызов события для установки агрегаторов у парента
          this.parent.fire(this.get('agg_event'), o.agg);

        this.fire('sort_table');
      },
      sort_table: function(e){
        if(Ractive.DEBUG)
          console.log('sort_table fired!');

        var filtered_sorted_store = [], sort_type = this.get('sort_type'), sorted = (Ractive.helper.isset(e)) ? e.context.col : this.get('sorted');
        if(Ractive.helper.isset(e)){
          if(this.last_sort == sorted){
            sort_type = (('ask' == sort_type) ? 'desk' : 'ask');
          } else{
            this.last_sort = sorted;
            sort_type = 'ask';
          }
        } else
          this.last_sort = sorted;

        filtered_sorted_store = Ractive.helper.objSortByCol(this.get('filtered_store'), sorted, sort_type);
        if(!this.get('store_set'))
          this.set('startFromRow', 0);
        this.set({
          sorted: sorted,
          sort_type: sort_type,
          filtered_sorted_store: filtered_sorted_store,
          store_set: false,
        });

        this.fire('set_list');
      },
      scroll: function(num_rows){
        var maxLimit = this.get('filtered_sorted_store').length;
        var maxRowNum = this.get('_maxRowNumber');

        // If there is no need in scrolling
        if(maxLimit <= maxRowNum){
          return this.set({
            scrollTop: true,
            scrollEnd: true,
          });
        }

        var start = this.get('startFromRow');
        var newStart = start - num_rows;

        if(newStart < 0){
          newStart = 0;
          this.set('scrollTop', true);
        }
        if(newStart > (maxLimit - maxRowNum)){
          newStart = maxLimit - maxRowNum;
          this.set('scrollBottom', true);
        }

        if(newStart === start)
          return this.set('scrollEnd', true);

        this.set({
          scrollEnd: false,
          scrollTop: false,
          scrollBottom: false,
        });
        this.set('startFromRow', newStart);
      },
      set_list: function(e){
//                if (Ractive.DEBUG) console.log('set_list event fired!');
        this.getLists();

        // 2). Reset the slider's settings
        this.calcSliderSettings();
      },
    });

    this.observe('startFromRow', function(){
      setTimeout(function(){
        obj.fire('set_list')
      }, 4);
    });
  },
  onrender: function(){
//      if (Ractive.DEBUG) console.log('>>> onRender');
    this.setMaxRowNumber();
  },
  onunrender: function(){
    this.set('show_partual', false);
  },
  oncomplete: function(){
    this.set('show_partual', true);
    var obj = this;
    setTimeout(function(){obj.updateHight();}, 4);
  },
  setStore: function(store){
    this.set({
      store: store,
      store_set: true,
    });
    this.fire('filter_changed');
    this.updateHight();
  },
  getLists: function(){
    var filtered_sorted_store = this.get('filtered_sorted_store');
    var start = this.get('startFromRow');
    var maxLimit = filtered_sorted_store.length;
    var maxRowNum = this.get('_maxRowNumber');
    var rowNum = (maxLimit > maxRowNum) ? maxRowNum : maxLimit;

    // Don't display empty rows
    if(maxLimit - start < rowNum){
      start = maxLimit - rowNum;
    }

    this.set('list', filtered_sorted_store.slice(start, start + rowNum));
  },
  getRowCols: function(d, h){
    var r = {};
    for(var i in h){
      r[i] = d[i];
    }
    return r;
  },
  getFiltersVal: function(m, h){
    m.c = {};
    for(var i in h){
      if(h[i].filter)
        m.c[i] = h[i].filter;
    }
  },
  setFiltersSelOpts: function(o, last){
    var h = this.get('cols');
    for(var i in o.c){
      if(i != last || 'all' == h[i].filter.val){
        if('all' == h[i].filter.val)
          this.set('cols.' + i + '.filter.conf.opts', {all: ((h[i].filter.conf.plaseholder) ? h[i].filter.conf.plaseholder : this.get('sel_def'))});
        this.set('cols.' + i + '.filter.conf.opts', o.c[i]);
      }
    }
  },
  initFiltersSelOpts: function(o, h){
    var isset = Ractive.helper.isset;
    o.c = {};
    for(var i in h){
      if(isset(h[i].filter) && 'sel' == h[i].filter.type){
        if(!isset(h[i].filter.conf))
          throw "Не верно настроен фильтр для колонки " + i;
        if(false === h[i].filter.conf.auto_opts)
          continue;

        o.c[i] = {all: ((h[i].filter.conf.plaseholder) ? h[i].filter.conf.plaseholder : this.get('sel_def'))};
      }
    }
  },
  resetFiltersSelOpts: function(){
    var o = {};
    o.m = {};
    var h = this.get('cols');
    this.initFiltersSelOpts(o, h);
    this.setFiltersSelOpts(o, false);
  },
  createFiltersSelOpts: function(c, d){ // с - is only select
    var k, v, h = this.get('cols');;
    for(var i in c){
      k = d[i];
      v = d[i];
      if(Ractive.helper.isFloat(k)){
        k = (k * 100).toFixed(0); // k = 50.00
      } else if(Ractive.helper.isInt(k))
        k = +k;
      c[i][k] = (Ractive.helper.isset(h[i].format) && ((Ractive.helper.isset(h[i].filter.conf.format_opts) && h[i].filter.conf.format_opts) || !Ractive.helper.isset(h[i].filter.conf.format_opts)) ? this.formatters()[h[i].format.name](v, h[i].format.conf, i, h, d) : v);
    }
  },
  sortFiltersSelOpts: function(c){
    var help = Ractive.helper;
    var isDate = help.isDate;
    for(var i in c){
      if(isDate(c[i][Object.keys(c[i])[0]]))
        c[i] = help.objSortKeyDate(c[i]);
      else if('string' == typeof c[i][Object.keys(c[i])[0]])
        c[i] = help.objSortString(c[i]);
      else
        c[i] = help.objSortDef(c[i]);
    }
  },
  checkCurRow: function(c, o){
    var res = false, help = Ractive.helper;
    var v, k, t;
    for(var i in c){
      v = o[i];
      k = c[i].val;
      t = c[i].type;
      if('sel' == t){
        if(help.isFloat(v))
          v = (v * 100).toFixed(0);
        if('all' != k && k != v)
          res = (false == res) ? true : res;
      }
      if('inp' == t){
        if('' != k && -1 == (v + '').toLowerCase().indexOf(k.toLowerCase()))
          res = (false == res) ? true : res;
      }
      if('daterange' == t){
        if(help.isDate(v) && help.isDate(c[i].conf.start) && help.isDate(c[i].conf.end)
                && !moment(v).isBetween(c[i].conf.start, c[i].conf.end, 'day', '[]'))
          res = (false == res) ? true : res;
      }
    }
    return res;
  },
  getAgg: function(h){
    var r = {};
    for(var i in h){
      if(h[i].agg)
        r[i] = Ractive.helper.clone(h[i].agg);
    }
    return r;
  },
  createAgg: function(agg, $r){
    var isset = Ractive.helper.isset;
    for(var i in agg){
      if(isset(agg[i].min))
        agg[i].min = (agg[i].min > $r[i]) ? $r[i] : agg[i].min;
      if(isset(agg[i].max))
        agg[i].max = (agg[i].max < $r[i]) ? $r[i] : agg[i].max;
      if(isset(agg[i].avg))
        agg[i].avg += +($r[i]);
      if(isset(agg[i].sum))
        agg[i].sum += +($r[i]);
      if(isset(agg[i].cnt))
        agg[i].cnt++;
      if(isset(agg[i].complex))
        agg[i].complex(i, $r);
    }
  },
  compliteAgg: function(agg, cnt){
    var isset = Ractive.helper.isset;
    for(var i in agg){
      if(isset(agg[i].avg) && 0 != cnt)
        agg[i].avg = agg[i].avg / cnt;
    }
  },
  formatters: function(){
    var obj = this;
    return {
      date: function(val, conf, col, cols, row){
        if('undefined' === typeof val || -1 != val.indexOf('0000-00-00') || (10 >= val.length && -1 != val.indexOf('00:00:00')))
          val = '';
        else if(conf && conf.formate)
          val = moment(new Date(val)).format(conf.formate);
        else
          val = moment(new Date(val)).format('L');

        return val;
      },
      list: function(val, conf, col, cols, row){
        var isset = Ractive.helper.isset;
        if(conf && conf.list && isset(conf.list[val]))
          val = conf.list[val];
        else if(cols[col] && 'sel' == cols[col].filter.type && cols[col].filter.conf.opts && isset(cols[col].filter.conf.opts[val]))
          val = cols[col].filter.conf.opts[val];
        else if('undefined' === typeof val)
          val = '';
        else{
          console.log('list decorator - list config missed or list doesnt have val element or in filter we havent need val: ' + val);
        }
        return val;
      },
      number: function(val, conf, col, cols, row){
        var number_format = '0,0.0', language = 'en', force_number = false;
        if(conf){
          number_format = conf.format || number_format;
          language = conf.language || language;
          force_number = conf.force_number || force_number;
        }
        if('undefined' === typeof val)
          return 'undefined';

        if(!isNaN(parseInt(val)) || force_number){
          numeral.language(language);
          val = numeral(val).format(number_format);
        }

        return val;
      },
      currency: function(val, conf, col, cols, row){
        var cur_format = ' 0,0[.]00',
            cur_symbol = '$',
            language = 'en',
            force_number = false;
        if(conf){
          cur_symbol = conf.cur_symbol || cur_symbol;
          cur_format = conf.format || cur_format;
          language = conf.language || language;
          force_number = conf.force_number || force_number;
        }
        if('undefined' === typeof val)
          return 'undefined';

        if(!isNaN(parseInt(val)) || force_number){
          numeral.language(language);
          val = numeral(val).format(cur_symbol + cur_format);
        }

        return val;
      },
      partial: function(val, conf, col, cols, row){
        // set empty partial
        if(!Ractive.partials['empty'])
          Ractive.partials['empty'] = 'partial error';

        if('undefined' == typeof conf.template){
          console.error('Empty template var (need path to the pertial)');
          return 'empty';
        }

        var name = conf.template;
        if(-1 == name.indexOf('/'))
          name = obj.component_folder + obj.partials_folder + name;

        if(!Ractive.partials[name])
          Ractive.requirePartial(name);
        return name;
      },
      longString: function(val, conf, col, cols, row){
        if(typeof val !== 'string'){
          return val;
        }

        var endSymbol = conf && conf.lengthLimit || 20;
        if(val.length <= endSymbol){
          return val;
        }

        return val.slice(0, endSymbol) + '...';
      },
    }
  },
  setMaxRowNumber: function(){
    var self = this;

    // If the option "maxRowNumber" is present in the <grid ... /> call in a HTML file
    // and is not falsy, we use it
    var maxRowNumber = self.get('maxRowNumber');
    if(maxRowNumber){
      if(Ractive.DEBUG)
        console.log('typeof maxRowNumber = %s, maxRowNumber = %s', typeof maxRowNumber, maxRowNumber);

      // Remove 'component-height' class - we will use maxRowNumber directly
      var componentDiv = self.find('.component-grid');
      componentDiv.className = componentDiv.className.replace(' component-height', '');
      // Or (IE10+): componentDiv.classList.remove('component-height');
      // jQuery('.component-grid').removeClass('component-height');

      if(typeof maxRowNumber === 'number'){
        maxRowNumber = self.checkMaxRowNumberLimits(maxRowNumber);
        self.set('_maxRowNumber', maxRowNumber);
        return;
      }

      if(typeof maxRowNumber === 'string'){
        maxRowNumber = parseInt(maxRowNumber, 10);
        if(isNaN(maxRowNumber)){
          self.handleIncorrectMaxRowNumber();
          return;
        }

        maxRowNumber = self.checkMaxRowNumberLimits(maxRowNumber);
        self.set('_maxRowNumber', maxRowNumber);
        return;
      }

      // If the "maxRowNumber" option is not Number or String
      self.handleIncorrectMaxRowNumber();
      return;
    } // end of "if (maxRowNumber)..."


    // If there is no external "maxRowNumber" option, we use the component height
    var compDiv = self.find('.component-grid');
    var compHeightStr = window.getComputedStyle(compDiv, null).getPropertyValue('height');
    var compHeight = parseInt(compHeightStr.slice(0, -2), 10);

    if(compHeight){
      var theadHeight = self.find('.grid-thead').offsetHeight;
      var rowHeight = self.find('.grid-tbody tr td');
      if(rowHeight)
        rowHeight = rowHeight.offsetHeight;
      else
        rowHeight = self.find('.header-tr-label th').offsetHeight;
      var num = Math.floor((compHeight - theadHeight) / rowHeight);
      if(Ractive.DEBUG)
        console.log('componentHeight = %s, theadHeight = %s, rowHeight = %s, rowNum = %s',
                compHeight, theadHeight, rowHeight, num);

      num = self.checkMaxRowNumberLimits(num);
      self.set('_maxRowNumber', num);
      return;
    }

    // If something else occurs: No external "maxRowNumber" option and no component height
    self.set('_maxRowNumber', self.get('defaultMaxRowNumber'));
  },
  checkMaxRowNumberLimits: function(maxNum){
    var self = this;
    if(maxNum < self.get('minMaxRowNumber') || maxNum > self.get('maxMaxRowNumber')){
      if(Ractive.DEBUG){
        console.info('"maxRowNumber" option in <grid .../> call' +
                ' is out of limits. Using the default value'
                );
      }

      return self.get('defaultMaxRowNumber');
    }

    return maxNum;
  },
  handleIncorrectMaxRowNumber: function(){
    var self = this;
    if(Ractive.DEBUG){
      console.warn('Incorrect "maxRowNumber" option in <grid .../> call.'
              + ' Using the default value'
              );
    }

    self.set('_maxRowNumber', self.get('defaultMaxRowNumber'));
  },
  calcSliderSettings: function(){
    // Show slider only if there are rows that cannot be placed in the grid
    var maxLimit = this.get('filtered_sorted_store').length;
    var maxRowNum = this.get('_maxRowNumber');
    if(maxLimit <= maxRowNum){
      this.set('scrollShow', false);
      return 'No need in scrolling';
    }

    // Grid container height is equal to the table height
    var tableHeight = this.find('.grid-table').offsetHeight;

    // Slider container has the same height as tbody
    var tbodyHeight = this.find('.grid-tbody').offsetHeight;
    this.set({
      scrollShow: true,
      tableHeight: tableHeight + 'px',
      scrollHeight: tbodyHeight + 'px',
      scrollMin: 0,
      scrollMax: maxLimit - maxRowNum,
      scrollRatio: (maxRowNum / maxLimit) < 1 ? (maxRowNum / maxLimit) : 1,
    });
  },
  updateHight: function(){
    this.setMaxRowNumber();
    this.calcSliderSettings();
    this.fire('set_list');
  },
  reelScroll: function(dy, callback, speed){
    var obj = this;
    speed = speed || 1;
    if(0.1 < Math.abs(dy))
      this.reel_timer = setTimeout(function(){
        callback(Math.sign(dy) * Math.ceil(Math.abs(dy / obj.reel_speed)));
        if(!obj.get('scrollEnd'))
          obj.reelScroll(dy / obj.reel_speed, callback, speed++)
      }, 20 * Math.exp(speed * speed));
  },
});


/**
 * At the element or model where use this component you should set this data var with conf of grid component
 * cols: {
 *   '__data_name__':{
 *       label: '__display_name__',
 *       w: 'xx%',
 *       [
 *         [sort: true | false (if not present - def false),]
 *         [filter:
 *           {type: 'inp', val: ''} |
 *           {type: 'sel', val: 'all', conf: {
 *                                       opts: {all: _e('All accounts')}, // for first use - data in select
 *                                       plaseholder: def get from data var sel_def or you can set in 'my all def label',
 *                                       auto_opts: def true (if false you need set opts options in this object)
 *                                       format_opts: def true | false
 *           }
 *         },]
 *         [agg: {min:100, max: 0, avg: 0, sum:0, cnt:0, complex: you_function(_col_, _row_)}},]
 *         [format: {
 *           name: 'list', conf:{list:[__this_is_a_list__]}} |
 *           name: 'date', conf:{formate:'empty = 'L' | moment_formatte'}} |
 *           name: 'number', conf:{number_format: numeral_formatte | def '0,0.0', language: def 'en', force_number: def false}} |
 *           name: 'currency', conf:{cur_format:def ' 0,0[.]00', cur_symbol: def '$', language: def 'en', force_number: def false}} |
 *           name: 'partial', conf:{template: component_path_to_templ(from app folder path) or templete from grid_component folder (only name without /)}} |
 *           name: 'longString', conf:{lengthLimit:def 20}
 *         }]
 *       ]
 *    },
 * }
 */