/**
 * Created by aub3 on 5/1/15.
 */
var canvas = new fabric.Canvas('canvas'),
    output_canvas = document.getElementById('output_canvas'),
    width = canvas.getWidth(),
    height = canvas.getHeight(),
    state = {
        'images':[],
        'masks_present':false,
        'current_mode':null,
        'recompute':true,
        'results':{},
        net:null,
        canvas_data:null,
        mask_data:null,
        'options':{
            'pf':null,
            'slic':null
        }
    };


initialize_ui = function () {
    var jsfeat_gui = new dat.GUI({ autoPlace: false });
    var pf_opt, slic_opt;
    //pf_opt = function () {
    //this.sigma = 0;
    //this.threshold = 1000;
    //this.minSize = 1000;
    //};
    slic_opt = function () {
    this.regionSize = 40;
    this.minSize = 20;
    };
    //state.options.pf = new pf_opt();
    state.options.slic = new slic_opt();
    var slic_gui = jsfeat_gui.addFolder('Superpixel Segmentation');
    slic_gui.add(state.options.slic, "regionSize", 20, 400);
    slic_gui.add(state.options.slic, "minSize", 2, 100);
    //var pf_gui = jsfeat_gui.addFolder('PF Graph Segmentation (Not Used)');
    //pf_gui.add(state.options.pf, "threshold", 20, 40000);
    //pf_gui.add(state.options.pf, "sigma", 0, 20);
    //pf_gui.add(state.options.pf, "minSize", 2, 10000);

    $("#dat_gui").append(jsfeat_gui.domElement);
    canvas.backgroundColor = '#ffffff';
    $('#bg-color').val('#ffffff');
    canvas.renderAll();
};


initial = function() {
    if (document.location.hash !== '#zoom') return;

    function renderVieportBorders() {
      var ctx = canvas.getContext();

      ctx.save();

      ctx.fillStyle = 'rgba(0,0,0,0.1)';

      ctx.fillRect(
        canvas.viewportTransform[4],
        canvas.viewportTransform[5],
        canvas.getWidth() * canvas.getZoom(),
        canvas.getHeight() * canvas.getZoom());

      ctx.setLineDash([5, 5]);

      ctx.strokeRect(
        canvas.viewportTransform[4],
        canvas.viewportTransform[5],
        canvas.getWidth() * canvas.getZoom(),
        canvas.getHeight() * canvas.getZoom());

      // var viewport = canvas.getViewportCenter();
      //console.log(canvas.getZoom(), viewport.x, viewport.y);

      ctx.restore();
    }

    $(canvas.getElement().parentNode).on('wheel mousewheel', function(e) {

      // canvas.setZoom(canvas.getZoom() + e.originalEvent.wheelDelta / 300);

      var newZoom = canvas.getZoom() + e.originalEvent.wheelDelta / 300;
      canvas.zoomToPoint({ x: e.offsetX, y: e.offsetY }, newZoom);

      renderVieportBorders();

      return false;
    });

    var viewportLeft = 0,
        viewportTop = 0,
        mouseLeft,
        mouseTop,
        _drawSelection = canvas._drawSelection,
        isDown = false;

    canvas.on('mouse:down', function(options) {
      isDown = true;

      viewportLeft = canvas.viewportTransform[4];
      viewportTop = canvas.viewportTransform[5];

      mouseLeft = options.e.x;
      mouseTop = options.e.y;

      if (options.e.altKey) {
        _drawSelection = canvas._drawSelection;
        canvas._drawSelection = function(){ };
      }

      renderVieportBorders();
    });

    canvas.on('mouse:move', function(options) {
      if (options.e.altKey && isDown) {
        var currentMouseLeft = options.e.x;
        var currentMouseTop = options.e.y;

        var deltaLeft = currentMouseLeft - mouseLeft,
            deltaTop = currentMouseTop - mouseTop;

        canvas.viewportTransform[4] = viewportLeft + deltaLeft;
        canvas.viewportTransform[5] = viewportTop + deltaTop;

        console.log(deltaLeft, deltaTop);

        canvas.renderAll();
        renderVieportBorders();
      }
    });

    canvas.on('mouse:up', function() {
      canvas._drawSelection = _drawSelection;
      isDown = false;
    });
  };
initial();

 $('#imgfile').on("change",function(){
    file = this.files[0];
    fr = new FileReader();
    fr.onload = function () {
        img = new Image();
        img.onload = function () {
            fabric.Image.fromURL(img.src, function (oImg) {
            canvas.add(oImg);
            });
        };
        img.src = fr.result;
    };
    fr.readAsDataURL(file);
});


(function() {
  fabric.util.addListener(fabric.window, 'load', function() {
    var canvas = this.__canvas || this.canvas,
        canvases = this.__canvases || this.canvases;

    canvas && canvas.calcOffset && canvas.calcOffset();

    if (canvases && canvases.length) {
      for (var i = 0, len = canvases.length; i < len; i++) {
        canvases[i].calcOffset();
      }
    }
  });
})();

// Define the tour!
var tour = {
  id: "hello-hopscotch",
  showPrevButton:true,
  steps: [
    {
      title: "Click here to add image",
      content: "You can only upload one image at a time. But you can repeat the process to add more images and rearrange them. Click to <a id='example' href='#''>add an example image</a>.",
      target: document.querySelector("#btnLoad"),
      onShow:function(){
        $('#example').on('click',function(event){
        fabric.Image.fromURL("/static/img/test.png", function(oImg){canvas.add(oImg);},load_options = {crossOrigin:"Anonymous"});
        state.recompute = true;
        event.preventDefault();
        });
      },
      placement: "bottom"
    },
    {
      title: "Click inside to select, resize and move images",
      content: "Use this canvas to position and resize images.",
      target: document.querySelector("#canvas"),
      placement: "right"
    },
    {
      title: "Draw foreground",
      content: "Mark foreground regions.",
      target: document.querySelector("#drawing-mode_f"),
      placement: "bottom"
    },
    {
      title: "Draw background",
      content: "Mark background regions.",
      target: document.querySelector("#drawing-mode_b"),
      placement: "bottom"
    },
    {
      title: "Click to segment",
      content: "Once you have marked the image click to segment, you can further edit your masks and segment again.",
      target: document.querySelector("#segment"),
      placement: "right"
    },
    {
      title: "Download",
      content: "Click to download results",
      target: document.querySelector("#rasterize"),
      placement: "bottom"
    },
    {
      title: "Export",
      content: "Or export to editor and combine with additional images.",
      target: document.querySelector("#export"),
      placement: "bottom"
    }
  ]
};



$(document).ready(function(){
    initialize_ui();
    hopscotch.startTour(tour);
});


