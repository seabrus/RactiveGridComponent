# RactiveGridComponent
This is a RactiveJS(v.0.7.3)-based component with a viewport to display large arrays of data in a grid form. 

## How to Use It
Add [RactiveApp.js](https://github.com/esbhome/RactiveApp.js) and use the folder structure from [RactiveApp](https://github.com/esbhome/RactiveApp).

#### In the "Element"'s `data` property set a subproperty `cols`. Here is an example:
```javascript
cols: {
    account: { 
        label: 'Accounts', // the column title
        w: '15%',       // the column width
        sort: true,     // whether to add or not icon for sorting
        filter: {       // an input for filtering data in the column
            type: 'sel',    // select input is used
            val: 'all',     // Default option
            conf: { opts: { all: _e('All') } }, 
        },
    }, 
    // filter: {type: 'sel', val: 'all', conf: {opts: {all: _e('All accounts')}, plaseholder: 'def select', auto_opts: false}} or filter: {type: 'daterange', val: 'All', conf: {start: '2014-06-01', end: moment().format('YYYY-MM-DD'), add_range:{'All': [moment('2014-01-01'), moment()]}}
    date: { 
        label: 'Date',       
        w: '15%', 
        sort: true, 
        filter: { 
            type: 'daterange', 
            val: 'All', 
            conf: { 
                start: '2014-01-01', 
                end: moment().format('YYYY-MM-DD'), 
                add_range: { 'All': [moment('2014-01-01'), moment()] },
            },
        }, 
        format: { name: 'date' },
    }, 
    // agg:{min, max, cnt, sum, avg, complex}
    note: {
        label: 'Notes',
        w: '40%', 
        sort: true, 
        filter: {
            type: 'inp',    // <input type ="text" ...> is used
            val: ''
        }, 
        format: { 
            name: 'partial', 
            conf: { template: 'wallet/operations/partials/description' },
        },
    }, 
    // format:{name:'partial', conf:{template:'simpl or with /'}}
    summa: {label: '__COL_NAME__',    w: '15%', sort: true, filter: {type: 'inp', val: ''}, agg: {complex:this.agg_sum}, format: {name: 'currency'}},
    status: {label: '__COL_NAME__',   w: '15%', sort: true, filter: {type: 'sel', val: 'all', conf: {opts: {all: _e('All')}}}},
    id: {hidden: true},
    metod: {hidden: true},
},
```
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
 
 #### After the element has been initiated and you received data from the server, set the grid store:
```javascript
    var self = this;
    getData().then(function (res) {
        Ractive.app.alert(res.message);
        var data = res.data;
        self.findComponent('grid').setStore(data);
    });
    
```
`getData` is a sample function, you should substitute it with your own function.

That's it.

See more in the [RactiveApp example](https://github.com/esbhome/RactiveApp).
 
