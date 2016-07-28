var GridSort = Ractive.extend({
    data:function(){
        return {
            is_active: function(col,sort){
                return col == sort;
            },
            is_ask: function(sort_type){
                return 'ask' == sort_type;
            },
        }
    },

    oninit: function (options) {

    },
});