;(function ( $, window, document, undefined ) {

    var pluginName = 'imagecrop',
        defaults = {
            width: null,
            height: null,
            text: {
                close: "x"
            },
            onSelect: function() {} // user selects a new image files
        };

    function Plugin( element, options ) {
        this.elem = element;
        this.$elem = jQuery(element);

        this.options = $.extend( {}, defaults, options) ;

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    Plugin.prototype = {
        
        init: function() {

            var self = this,
                o = this.options,
                $elem = this.$elem;

            // element dimensions
            if(o.height==null) {
                o.height = $elem.height();
            } else {
                $elem.height(o.height);
            }

            if(o.width==null) {
                o.width = $elem.width();
            } else {
                $elem.width(o.width);
            }

            // initial setup
            $elem.addClass("imc");

            // draw upload
            var $upload = $elem.create("div").addClass("imc-upload");

            var $uploadBox = $upload
            .create("div").addClass("imc-upload-middle")
            .create("div").addClass("imc-upload-inner");

            $uploadBox.create("div")
            .text("Drop image file here or upload");
            
            var $uploadFileInput = $uploadBox.create("div").addClass("imc-upload-file");
            $uploadFileInput.create("input", { type: "file" })
            .bind("change", function(event) {
                event.preventDefault();
                self.onUpload(event.target.files);
            });
            $uploadFileInput.create("input", { type: "button"}).val("Upload file");

            // Check for the various File API support
            $upload.create("div").addClass("imc-drop-zone")
            .bind("dragover", function(event) {
                event.preventDefault();
            })
            .bind("drop", function(event) {
                event.preventDefault();
                self.onUpload(event.originalEvent.dataTransfer.files);
            });

            // draw crop
            $elem.create("div").addClass("imc-crop");

            // draw controls
            var $controls = $elem.create("div").addClass("imc-controls");
            $controls.create("div").addClass("imc-control-close")
            .text(o.text.close)
            .bind("click", function() {
                self.show("upload");
                self.$element.find(".imc-crop").html("");
            });

            this.show("upload");
        }, 

        onUpload: function(files) {
            
            var self = this;

            jQuery.each(files, function(index) {
                if(this.type.match(/image.*/)) {
                    self.handleFile(this);
                } else {
                    self.onUploadError(403); // forbidden filetype
                }
            });

            //this.$elem.find("imc-crop").create("div").text(event)

        },

        onUploaderror: function(code) {
            switch(code) {
                case "403":
                    console.warn("Forbidden MIME type");
                    ;;
            }
        },

        handleFile: function(file) {
            var $t = this.$elem.find(".imc-crop"),
                o = this.options,
                reader = new FileReader();

            // clear target
            $t.html("");
            
            var $img = $t.create("img")
            .bind("load", function() {

                var $this = jQuery(this),
                    getAspect = function($item) {
                        return $item.width() / $item.height();
                    },
                    aspect_t = getAspect($t),
                    aspect_img = getAspect($img),
                    margin;

                // fit image
                if(aspect_img >= aspect_t) {
                    $t.css("margin-top", 0)
                    $img.height($t.height());
                    margin = -($img.width()-$t.width())/2;
                    $t.css("margin-left", margin);
                } else {
                    $t.css("margin-left", 0);
                    $img.width($t.width());
                    margin = -($img.height()-$t.height())/2;
                    $t.css("margin-top", margin);
                }

            })
            .draggable();

            reader.onload = function(e) {
                $img.attr("src", e.target.result);
            }
            reader.readAsDataURL(file);
            this.show("crop");
        },

        show: function(tab) {

            var $c = this.$elem.children();

            switch(tab) {

                case "crop":
                    $c.hide();
                    $c.filter(".imc-crop").show();
                    $c.filter(".imc-controls").show();
                    break;

                case "upload":
                default:
                    $c.hide();
                    $c.filter(".imc-upload").show();
                    $c.filter(".imc-controls").hide();
                    break;

            }

        }
    
    };

    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName,
                new Plugin( this, options ));
            }
        });
    }

})( jQuery, window, document );