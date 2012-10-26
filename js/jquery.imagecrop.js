;(function ( $, window, document, undefined ) {

    var pluginName = 'imagecrop',
        defaults = {
            width: null,
            height: null,
            text: {
                close: "x"
            },
            zoomStep: 100,
            onSelect: function() {} // user selects a new image files
        };

    function Plugin( element, options ) {
        this.elem = element;
        this.$elem = jQuery(element);

        this.options = $.extend( {}, defaults, options);
        this.data = {
            x: 0,
            y: 0,
            width: null,
            height: null,
            aspect: {
                img: null,
                stage: null
            },
            activeStage: "upload"
        };

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
            if(o.height===null) {
                o.height = $elem.height();
            } else {
                $elem.height(o.height);
            }

            if(o.width===null) {
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
            this.$crop = $elem.create("div").addClass("imc-crop");

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

        },

        onUploaderror: function(code) {
            switch(code) {
                case "403":
                    console.warn("Forbidden MIME type");
                    ;;
            }
        },

        handleFile: function(file) {
            var $t = this.$crop,
                self = this,
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
                    aspect_t = self.getAspect($t),
                    aspect_img = self.getAspect($img),
                    position = {
                        left: 0,
                        top: 0
                    };

                self.data.aspect = {
                    img: aspect_img,
                    stage: aspect_t
                };

                // fit image
                if(aspect_img >= aspect_t) {
                    $img.height($t.height());
                    $img.width($img.height() * aspect_img);
                    position.left = -($img.width()-$t.width())/2;
                } else {
                    $img.width($t.width());
                    $img.height($img.width() / aspect_img);
                    position.top = -($img.height()-$t.height())/2;
                }

                $img.css("left", position.left);
                $img.css("top", position.top);

                self.updateDraggableConstraint({
                    width: $img.width(),
                    height: $img.height(),
                    top: position.top,
                    left: position.left
                });

            })
            .draggable();
            this.$img = $img;
            this.zoom(0);

            // Events
            $t.bind("mousewheel", function(e, delta, deltaX, deltaY) {
                self.zoom(delta * o.zoomStep);
            });

            reader.onload = function(e) {
                $img.attr("src", e.target.result);
            };
            reader.readAsDataURL(file);
            this.show("crop");
        },

        zoom: function(px) {

            if(typeof(px)!="number") {
                console.log("not a number");
                return false;
            }

            if(this.data.activeStage!="crop")
                return false;

            var $crop = this.$crop,
                $img = $crop.find("img"),
                aspect = this.data.aspect.img,
                oldPos = $.extend($img.position(), {
                    width: parseInt($img.get(0).offsetWidth, 10),
                    height: parseInt($img.get(0).offsetHeight, 10)
                }),
                newPos = {
                    top: oldPos.top,
                    left: oldPos.left,
                    width: oldPos.width + px,
                    height: (oldPos.width + px) / aspect
                };

            // Dimensions
            if(newPos.width<$crop.width()) {
                newPos.width = $crop.width();
                newPos.height = newPos.width / aspect;
            } else if(newPos.height<$crop.height()) {
                newPos.height = $crop.height();
                newPos.width = newPos.height * aspect;
            }

            $img
            .width(newPos.width)
            .height(newPos.height);

            // Position
            newPos.top += (oldPos.height-newPos.height) / 2;
            newPos.left += (oldPos.width-newPos.width) / 2;
            
            var constraint = this.getConstraint(newPos);

            if(newPos.top < constraint[1]) {
                newPos.top = constraint[1];
            } else if(newPos.top > constraint[3]) {
                newPos.top = constraint[3];
            }

            if(newPos.left < constraint[0]) {
                newPos.left = constraint[0];
            } else if(newPos.left > constraint[2]) {
                newPos.left = constraint[2];
            }

            $img
            .css("top", newPos.top)
            .css("left", newPos.left);

            this.updateDraggableConstraint(newPos);
        },

        show: function(tab) {

            var $c = this.$elem.children();
            this.data.activeStage = tab;

            switch(tab) {

                case "crop":
                    $c.hide();
                    $c.filter(".imc-crop").show();
                    $c.filter(".imc-controls").show();
                    break;

                default: // case "upload"
                    $c.hide();
                    $c.filter(".imc-upload").show();
                    $c.filter(".imc-controls").hide();
                    this.data.activeStage = "upload";
                    break;

            }

        },

        getAspect: function($item) {
            $item = (typeof($item)===undefined) ? this.$img : $item;
            return $item.width() / $item.height();
        },

        getStagePosition: function() {
            var self = this,
                $el = this.$crop,
                position = $el.position();

            do {
                position.left += $el.position().left;
                position.top += $el.position().top;
                $el = $el.parent();
            } while($el.get(0)!=document);

            return position;
        },

        getConstraint: function(imgPos) {

            var $stage = this.$crop,
                $img = this.$img,
                imagePosition = $.extend({
                    width: $img.width(),
                    height: $img.height()
                }, (imgPos || {}));

            return [
                ($stage.width()-$img.width()),
                ($stage.height()-$img.height()),
                0,
                0
            ];
        },

        updateDraggableConstraint: function(imgPos) {

            var stagePosition = this.getStagePosition(),
                constraint = this.getConstraint(imgPos),
                containment = [
                    constraint[0] + stagePosition.left,
                    constraint[1] + stagePosition.top,
                    constraint[2] + stagePosition.left,
                    constraint[3] + stagePosition.top
                ];

            this.$img.draggable({
                containment: containment
            });
        }
    
    };

    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName,
                new Plugin( this, options ));
            }
        });
    };

})( jQuery, window, document );