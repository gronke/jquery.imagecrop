;(function ( $, window, document, undefined ) {

    var pluginName = 'imagecrop',
        defaults = {
            width: null,
            height: null,
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

            console.log("init");

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

            // Check for the various File API support
            $upload.create("input", { type: "file" })
            .bind("change", function(event) {
                self.onUpload(event.target.files);
                event.preventDefault();

            });

            $upload.create("div").addClass("imc-drop-zone")
            .bind("dragover", function(event) {
                event.preventDefault();
            })
            .bind("drop", function(event) {
                self.onUpload(event.originalEvent.dataTransfer.files);
                event.preventDefault();
            });

            // draw crop
            $elem.create("div").addClass("imc-crop");
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
                    console.log("Forbidden MIME type");
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
            .load(function() {
                console.log("load", this);
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

            });

            reader.onload = function(e) {
                $img.attr("src", e.target.result);
            }
            reader.readAsDataURL(file);
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