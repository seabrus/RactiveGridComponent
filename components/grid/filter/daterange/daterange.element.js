var GridFilterDaterange = Ractive.extend({
  entered_timer: 0,
  data: function(){
    return {
      startDate: '2014-06-01',
      endDate: moment().format('YYYY-MM-DD'),
      val: '2014-06-01 - '+moment().format('YYYY-MM-DD'),
      font_size: 12,
      add_range: {},
      formatter: function(){}
    }
  },
  oninit: function(){

  },
  oncomplete: function(){
    this.initPlugin(jQuery);
  },
  initPlugin: function($){
    var obj = this;
    var el = $(this.find('.grid-filter-daterange'));
    el.daterangepicker({
      startDate: moment(this.get('startDate')),
      endDate: moment(this.get('endDate')),
      opens: "center",
      ranges: Ractive.helper.concatObj({
        'Today': [moment(), moment()],
        'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
        'Last 7 Days': [moment().subtract(6, 'days'), moment()],
        'Last 30 Days': [moment().subtract(29, 'days'), moment()],
        'This Month': [moment().startOf('month'), moment().endOf('month')],
        'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
        'This Quarter': [moment().startOf('quarter'), moment().endOf('quarter')],
        'This Year': [moment().startOf('year'), moment().endOf('year')],
      }, this.get('add_range')),
    }, function(start, end, label){
      var val = label;
      var font_size = 12;
      if('Custom Range' == label){
        val = start.format('M/D/YY')+'-'+end.format('M/D/YY');
        font_size = 9;
      }
      obj.set({
        startDate: start.format('YYYY-MM-DD'),
        endDate: end.format('YYYY-MM-DD'),
        val: val,
        font_size: font_size,
      });
      obj.fire('setrange');
    });
  },
});