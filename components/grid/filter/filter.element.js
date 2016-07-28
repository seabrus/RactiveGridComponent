var GridFilter = Ractive.extend({
  entered_timer: 0,
  data: function(){
    return {
      formatter: function(){}
    }
  },
  oninit: function(options){
    var obj = this;
    this.on({
      entered: function(){
        clearTimeout(this.entered_timer);
        this.entered_timer = setTimeout(function(){
          obj.fire('changed');
        }, 350);
      },
    });
  },
});