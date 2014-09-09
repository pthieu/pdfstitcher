var files = [];
var pdf_page = 0;
var docDefinition = {
  'content': []
};

$(document).ready(function() {
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.
  }
  else {
    alert('The File APIs are not fully supported in this browser.');
  }

  // Setup the dnd listeners.
  var dropZone = document.getElementsByClassName('dropzone')[0];
  dropZone.addEventListener('dragover', handleDragOver, false);
  dropZone.addEventListener('dragleave', handleDragLeave, false);
  dropZone.addEventListener('drop', handleFileDrop, false);
  dropZone.addEventListener('change', handleFileDrop, false);

  $('button.setsize').click(setSize);
  $('button.makepdf').click(makekit);
  rebindConfig();
  rebindThumbHandlers();

  $(document).on('keyup', function (e) {
    if (e.keyCode == 27) {
      $(this).find('.modal').remove();
    }
  });
});


//file events
function handleDragOver(e) {
  e.stopPropagation();
  e.preventDefault();
  $(this).addClass('blueborder');
  e.dataTransfer.dropEffect = 'copy'; // Explicitly show this isrt('test')
}

function handleDragLeave(e) {
  e.stopPropagation();
  e.preventDefault();
  $(this).removeClass('blueborder');
}

function handleFileDrop(e) {
  e.stopPropagation();
  e.preventDefault();

  //show results area
  $('.results_wrap.hidden').removeClass('hidden');


  if (!!e.dataTransfer) e.dataTransfer.dropEffect = 'copy';

  $(this).removeClass('blueborder');
  if (!!e.dataTransfer) {
    //if drag and drop
    var filesRAW = e.dataTransfer.files;
  }
  else {
    //if click and select
    var filesRAW = e.target.files;
  }

  for (var i = 0; i < filesRAW.length; i++) {
    if (!(filesRAW[i].type) || !filesRAW[i].type.match(/image/)) {
      continue;
    }
    //start a new read stream per file
    var reader = new FileReader();
    var file = {};

    file['name'] = filesRAW[i].name;
    file['type'] = filesRAW[i].type;
    file['src'] = window.URL.createObjectURL(filesRAW[i]);

    reader.onloadend = (function(f) {
      //we return an object because we want variable file to be in the scope of the function (as variable f)
      return function(e) {
        // docDefinition = {content:[{image: e.target.result,width: 150, height: 150}]}
        // pdfMake.createPdf(docDefinition).download('test.pdf')
        //we also want variable e to be the input parameter from ouput of readAsDataURL
        f['url'] = e.target.result;
        f['size'] = getImageSize(f.url);

        var imgRatio = calcRatio(f.size.width, f.size.height);
        if (!imgRatio) return;

        f['crop'] = imgRatio[0]; //number of screens there are (number rounded up)
        f['max_h'] = imgRatio[1]; //max height screen can be (includes margins)
        //preview
        var config_screen = [
            "<div class='fileinfo'>" + f.name + "</div>",
            "<div class='config_screen'>",
              // "<div class='opt_wrap remove'>",
              //   "<button title='Remove from PDF'><i class='fa fa-times'></i></button>",
              //   "<span>Remove</span>",
              // "</div>",
              "<div class='opt_wrap margin_btn'>",
                "<button title='Set custom margins'><i class='fa fa-arrows-alt'></i></button>",
                "<span>Margins</span>",
              "</div>",
              "<div class='opt_wrap preview'>",
                "<button title='Preview page in a larger window'><i class='fa fa-search-plus'></i></button>",
                "<span>Preview</span>",
              "</div>",
              "<div class='margins_wrap hidden'>",
                "<div class='margins'>",
                  "<div class='margin msg'>",
                    "<span style='font-style:italic'>Close menu to drag again</span>",
                  "</div>",
                  "<div class='margin msg'>",
                    "<span style='font-style:italic'>(Units in inches)</span>",
                  "</div>",
                  "<div class='margin'>",
                    "<label>Top:</label><input class='top' />",
                  "</div>",
                  "<div class='margin'>",
                    "<label>Bottom:</label><input class='bottom' />",
                  "</div>",
                  "<div class='margin'>",
                    "<label>Left:</label><input class='left' />",
                  "</div>",
                  "<div class='margin'>",
                    "<label>Right:</label><input class='right' />",
                  "</div>",
                  "<div class='margin msg'>",
                    "<span style='font-style:italic'>Input numbers only!</span>",
                  "</div>",
                "</div>",
              "</div>",
            "</div>"
          ].join('');
        // if (f.crop > 1) {
          var timestamp = (new Date()).getTime(); //use time stamp to get unique group identifier
          //write to canvas and split into however many sections
          splitCanvas(e.target.result, timestamp);
          //splitCanvas has async calls so we have to add a div group skeleton and fill it up later
          var addIMG = ["<div class='thumb_wrap crop_group ", timestamp, "' data-src='"+f.src+"' data-timestamp='"+timestamp+"'><div draggable='true' class='drag_overlay'></div>", config_screen, "</div>"].join('');
        // }
        // else {
        //   //append image to div -- single page no crop isn't an async call so just add it
        //   var addIMG = ["<div class='thumb_wrap' data-src='"+f.src+"'><div draggable='true' class='drag_overlay'></div>" + config_screen + "<div class='thumb_crop'><div class='opt_wrap remove'><button title='Remove from PDF'><i class='fa fa-times'></i></button></div><div class='bg_cross'></div><span><img src='", f.url, "' class='thumb' /></span></div></div>"].join('');
        //   rebindConfig();
        // }
        $('#list').append(addIMG);

        rebindThumbHandlers();
      };
    })(file); // this is using the file variable we defined earlier

    //this is async
    reader.readAsDataURL(filesRAW[i]);
    // files.push(file);
  }
}

function handleObjectDrop(e) {
  e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  $(this).removeClass('blueborder');

  var filesRAW = e.dataTransfer.files;


  for (var i = 0; i < filesRAW.length; i++) {
    if (!(filesRAW[i].type) || !filesRAW[i].type.match(/image/)) {
      continue;
    }

    //this is async
    window.URL.createObjectURL(filesRAW[i]);
    for (var i = 0; i < filesRAW.length; i++) {
      // img.height = 60;
      // img.onload = function(e) {
      //   window.URL.revokeObjectURL(this.src);
      // }

      var addIMG = ["<div class='thumb_wrap'><div class='thumb_crop'><span><img src='", window.URL.createObjectURL(filesRAW[i]), "' class='thumb' /></span></div></div>"].join('');
      $('#list').append(addIMG);
      // info.innerHTML = filesRAW[i].name + ": " + filesRAW[i].size + " bytes";
    }
  }
}

function getImageSize(src) {
  var img = new Image;
  img.src = src;

  var size = {
    'width': img.width,
    'height': img.height
  };

  delete img;
  return size;
}

function setSize() {
  //handle setsize, make it disappear
  $('button.setsize').addClass('hidden');
  //disable inputs in global config
  $('.config_global input').attr('disabled', 'disabled')
  $('.config_global input').addClass('disabled')
  $('.config_global h2').addClass('hidden')
  //show dropzone area
  $('.step2 .dropzone.hidden').removeClass('hidden');
  
  //enable save pdf
  $('button.makepdf').removeAttr('disabled');
}


//this is testing pdfmake -- NOTUSED
function makePDF2() {
  var pdf_w = $('.pdf_w').val();
  var pdf_h = $('.pdf_h').val();

  var items = $('.thumb');
  docDefinition['pageSize'] = 'A4';

  items.each(function(i, e) {
    var imgData = e.src;
    docDefinition['content'].push({
      image: e.src,
      width: 210,
      pageBreak: 'after'
    });
  });
  pdfMake.createPdf(docDefinition).download('test.pdf')
}

//this is testing pdfkit
function makekit() {
  var pdf_w = mmToin($('.pdf_w').val(), true) || mmToin(11,true);
  var pdf_h = mmToin($('.pdf_h').val(), true) || mmToin(17,true);
  var pdf_t = mmToin($('.pdf_t').val(), true) || 0;
  var pdf_b = mmToin($('.pdf_b').val(), true) || 0;
  var pdf_l = mmToin($('.pdf_l').val(), true) || 0;
  var pdf_r = mmToin($('.pdf_r').val(), true) || 0;

  var items = $('.thumb_wrap:not(.notincluded) .thumb_crop:not(.notincluded) .thumb');

  if (items.length < 1) {
    //do nothing if no items. probably add a check and alert here
    console.log('No pages in PDF')
    return;
  }

  console.log('Generating PDF...')

  var kit = new PDFDocument({
    size: [pdf_w, pdf_h]
  });
  var stream = kit.pipe(blobStream());

  items.each(function(i, e) {
    var parent = $(this).parents('.thumb_wrap');

    // check individual margins
    var top     = (parent.find('.top').val() === "0")?0:mmToin(parent.find('.top').val(), true) || pdf_t;
    var bottom  = (parent.find('.bottom').val() === "0")?0:mmToin(parent.find('.bottom').val(), true)  || pdf_b;
    var left    = (parent.find('.left').val() === "0")?0:mmToin(parent.find('.left').val(), true)    || pdf_l;
    var right   = (parent.find('.right').val() === "0")?0:mmToin(parent.find('.right').val(), true)   || pdf_r;
    // top     = (!!top)     ? mmToin(top, true)     : 12.7;
    // bottom  = (!!bottom)  ? mmToin(bottom, true)  : 12.7;
    // left    = (!!left)    ? mmToin(left, true)    : 25.4;
    // right   = (!!right)   ? mmToin(right, true)   : 25.4;

    //add image
    var imgData = e.src;
    kit.image(e.src, left, top, {
      width: kit.page.width-left-right
    });

    //add new page if not last page
    if (i == items.length - 1) {
      kit.end();
    }
    else {
      kit.addPage();
    }
  });
  stream.on('finish', function() {
    var url = stream.toBlobURL('application/pdf');
    window.open(url, 'don\'t close this!!!', 'width=1024, height=768');
  });
}

//this is testing jsPDF -- NOTUSED
function makePDF() {
  var pdf_w = $('.pdf_w').val();
  var pdf_h = $('.pdf_h').val();

  var items = $('.thumb');
  pdf = new jsPDF((pdf_w > pdf_h) ? 'l' : 'p', 'in', [pdf_w, pdf_h]); //p:portrait, in:inches,[h,w] //l:landscape, mm:millimeter, [w,h]

  items.each(function(i, e) {
    // var img = new Image;
    // img.src = e.src;
    // console.log(['w:', img.width, 'h:', img.height].join(' '));
    var imgData = e.src;
    // var doc = new jsPDF('p', 'in', [pdf_w, pdf_h]); //p:portrait, in:inches,[w,h] //l:landscape, mm:millimeter, [w,h]

    if (pdf_page > 0) {
      pdf.addPage();
    }
    // pdf.addImage(imgData, 'JPEG', 0, 0, pdf_w, (img.height < calcRatio(img.width, img.height)[1])?(img.height/img.width*pdf_w):pdf_h);
    pdf.addImage(imgData, 'png', 0, 0, pdf_w, pdf_h);
    pdf_page++;
    // delete img;
  });
  savePDF();
  pdf_page = 0; //reset
}

//save function for jsPDF -- NOTUSED
function savePDF() {
  pdf.save('test.pdf');
}

function calcRatio(w, h, ele) {
  //default 11x17 -- no need to convert in to mm since we're grabbing ratios and returning pixels
  var pdf_w = $('.pdf_w').val() || 11;
  var pdf_h = $('.pdf_h').val() || 17;
  var pdf_t = $('.pdf_t').val() || 0;
  var pdf_b = $('.pdf_b').val() || 0;
  var pdf_l = $('.pdf_l').val() || 0;
  var pdf_r = $('.pdf_r').val() || 0;
  //overwrite borders if individual thumb has its own config  
  if(!!ele){
    thumb_wrap = $('[data-timestamp="'+ele+'"]');
    pdf_t = thumb_wrap.find('.top').val()     || pdf_t;
    pdf_b = thumb_wrap.find('.bottom').val()  || pdf_b;
    pdf_l = thumb_wrap.find('.left').val()    || pdf_l;
    pdf_r = thumb_wrap.find('.right').val()   || pdf_r;
  }

  //check to see if user specified page height/width
  if (pdf_w <= 0 || pdf_h <= 0) {
    //can't have pdf page size of 0x0.. wtf??
    return false;
  }

  var usable_h = pdf_h - pdf_t - pdf_b; //pageheight-margins
  var usable_w = pdf_w - pdf_l - pdf_r; //pagewidth-margins
  var max_h = usable_h / usable_w * w;
  return [Math.ceil(h / max_h), max_h]; //returns # of thumbs and max height in pixels of image

}

function splitCanvas(src, ele, margin) {
  if (src.match(/^blob:/)){
    //if it's a blob, means we're re-splicing so remove all the thumb_crops
    $('[data-timestamp="'+ele+'"]').find('.thumb_crop').remove();
  }

  //create invisible element
  var canvas = document.createElement("canvas");
  var context = canvas.getContext('2d');

  // load image from data url
  var imageObj = new Image();
  imageObj.onload = function(e) {
    //grab dimensions and draw src image onto canvas
    canvas.height = imageObj.height;
    canvas.width = imageObj.width;
    context.drawImage(this, 0, 0);

    //calculate how many pieces (crop) to crop and what the max height of each piece is going to be
    var imgRatio = calcRatio(canvas.width, canvas.height, ele);
    var crop = imgRatio[0];
    var max_h = imgRatio[1];

    //iterate through each piece and take source image and draw onto a temp image
    for (var i = 0; i < crop; i++) {
      var tmpCanvas = document.createElement("canvas");
      var tmpContext = tmpCanvas.getContext('2d');

      tmpCanvas.width = canvas.width;
      tmpCanvas.height = max_h;
      if(i == crop-1){
        tmpContext.rect(0,0, canvas.width, max_h);
        tmpContext.fillStyle = 'white';
        tmpContext.fill();
      }
      tmpContext.drawImage(canvas, 0, -max_h * i);

      var thumb_wrap = $('[data-timestamp="'+ele+'"]');
      //probably instead of appending, find a way to put it beside thing
      thumb_wrap.append("<div class='thumb_crop'><div class='opt_wrap remove'><button title='Remove from PDF'><i class='fa fa-times'></i></button></div><div class='bg_cross'></div><span><img src='" + tmpCanvas.toDataURL('image/jpeg') + "' class='thumb' /></span></div>");
      rebindConfig();
    }
  };
  //you can load img.src with data src or blob
  imageObj.src = src;
}
//END file events



//draggable thumbs events

//starting a drag
//for manual entry swap
function handleThumbSwapStart(e) {
  $(this).parent('.thumb_wrap').addClass('dragging');
  dragSrcEl = this;

  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.parentElement.innerHTML);
}
//src html
function handleThumbDragStart(e) {
  $(this).parent('.thumb_wrap').addClass('dragging');
  dragSrcEl = this;

  dragSrcElmargins = {
    't': $(this).siblings('.config_screen').find('.margins_wrap .top').val(),
    'b': $(this).siblings('.config_screen').find('.margins_wrap .bottom').val(),
    'l': $(this).siblings('.config_screen').find('.margins_wrap .left').val(),
    'r': $(this).siblings('.config_screen').find('.margins_wrap .right').val()
  }

  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.parentElement.outerHTML);
}

//while over element, will keep triggering as long as held over
function handleThumbDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault(); // Necessary. Allows us to drop.
  }
  e.dataTransfer.dropEffect = 'move'; // See the section on the DataTransfer object.

  return false;
}

//entering an element, check for element being entered and handle
function handleThumbDragEnter(e) {
  // this / e.target is the current hover target.
  $(this).parent('.thumb_wrap').addClass('dragover');
}

//leaving element, check for element being left
function handleThumbDragLeave(e) {
  $(this).parent('.thumb_wrap').removeClass('dragover');
}

//triggers if you let go of the mouse ontop of a draggable item
//for manual entry swap
function handleThumbSwapDrop(e) {
  $(this).parent('.thumb_wrap').removeClass('dragover');
  if (e.stopPropagation) {
    e.stopPropagation(); // Stops some browsers from redirecting.
  }

  // Don't do anything if dropping the same column we're dragging.
  if (dragSrcEl != this) {
    // Set the source column's HTML to the HTML of the column we dropped on.
    dragSrcEl.parentElement.innerHTML = this.parentElement.innerHTML;
    this.parentElement.innerHTML = e.dataTransfer.getData('text/html');
  }

  return false;
}
//triggers if you let go of the mouse ontop of a draggable item
function handleThumbDrop(e) {
  $(this).parent('.thumb_wrap').removeClass('dragover');
  if (e.stopPropagation) {
    e.stopPropagation(); // Stops some browsers from redirecting.
  }

  // Don't do anything if dropping the same column we're dragging.
  if (dragSrcEl != this) {
    //move element to before position of destination
    var new_thumb = $(e.dataTransfer.getData('text/html')).insertBefore(this.parentElement);
    dragSrcEl.dropped = true; //set if element has been dropped on a droppable item
    new_thumb.find('.config_screen .margins_wrap .top').val(dragSrcElmargins.t);
    new_thumb.find('.config_screen .margins_wrap .bottom').val(dragSrcElmargins.b);
    new_thumb.find('.config_screen .margins_wrap .left').val(dragSrcElmargins.l);
    new_thumb.find('.config_screen .margins_wrap .right').val(dragSrcElmargins.r);
  }

  return false;
}

//final function when you let go of the mouse
function handleThumbDragEnd(e) {
  if (dragSrcEl.dropped) {
    $(this.parentElement).remove(); // this is used to remove element after the move occurs
  }
  $('.dragging').removeClass('dragging');
  // this/e.target is the source node.
  rebindConfig();
  rebindThumbHandlers();
}

function rebindThumbHandlers(e) {
  //will rebind the one element moved
  var thumb_wrap = document.querySelectorAll('.thumb_wrap .drag_overlay');
  [].forEach.call(thumb_wrap, function(thumb) {
    if (!thumb._hasDragEvents) {
      thumb.addEventListener('dragstart', handleThumbDragStart, false);
      thumb.addEventListener('dragenter', handleThumbDragEnter, false);
      thumb.addEventListener('dragover', handleThumbDragOver, false);
      thumb.addEventListener('dragleave', handleThumbDragLeave, false);
      thumb.addEventListener('dragend', handleThumbDragEnd, false);
      thumb.addEventListener('drop', handleThumbDrop, false);
      thumb._hasDragEvents = true;
    }
  });
}

function rebindConfig(e) {
  bindRemoveHandler();
  bindMarginHandler();
  bindPreviewHandler();
}

function bindRemoveHandler(e) {
  var thumb_wrap = document.querySelectorAll('.thumb_wrap');
  [].forEach.call(thumb_wrap, function(thumb) {
    var btn = $(thumb).find('.config_screen .remove button');
    btn.unbind();
    btn.on('click', function() {
      $(thumb).toggleClass('notincluded');
      // var btn = $(this);
      // btn.text((btn.text() == 'Remove') ? 'Include' : 'Remove');
    });
  });

  var thumb_wrap = $('.thumb_wrap');
  thumb_wrap.each(function(i) {
    $(this).find('.thumb_crop .opt_wrap.remove button').each(function() {
      var btn = $(this);
      var rm_crop = btn.parents('.thumb_crop');
      btn.unbind();
      btn.on('click', function() {
        rm_crop.toggleClass('notincluded');
      });
    });
  });
}

function bindMarginHandler() {
  var thumb_wrap = document.querySelectorAll('.thumb_wrap');
  [].forEach.call(thumb_wrap, function(thumb) {
    var btn = $(thumb).find('.config_screen .margin_btn button');
    var margin = $(thumb).find('.config_screen .margins_wrap input');
    
    btn.unbind();
    margin.unbind();

    btn.on('click', function() {
      $(thumb).find('.margins_wrap').toggleClass('hidden');
    });

    margin.on('keyup', function () {
      resplice($(thumb).data('timestamp'));
    });
  });
}

function bindPreviewHandler(){
  var thumb_wrap = document.querySelectorAll('.thumb_wrap');
  $(thumb_wrap).each(function(){
    var preview_btn = $(this).find('.preview button');

    preview_btn.unbind();

    preview_btn.click(function () {
      var modal = document.createElement('div');
      $(modal).addClass('modal');
      $('body').append(modal);
      $(modal).click(function () {
        $('.modal').remove();
      });

      var preview_wrap = document.createElement('div');
      $(preview_wrap).addClass('preview_wrap');
      $(modal).append(preview_wrap);

      $(preview_btn).parents('.thumb_wrap').find('img.thumb').each(function () {
        var img = document.createElement('img');
        img.src = $(this)[0].src;

       $(img).click(function (e) {
         e.stopPropagation();
       });
        $('.preview_wrap').append(img);
      });
    });
  });
}

function resplice(timestamp){
  var thumb_wrap = $('[data-timestamp="'+timestamp+'"]');
  var blob = thumb_wrap.data('src');

  splitCanvas(blob, timestamp);
}


//UTILITY FUNCTIONS
function mmToin(n, rev) {
  return rev ? n * 2.54 * 10 : (n / 10 / 2.54);
}