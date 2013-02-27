;(function ( $, window, document, undefined ) {

    var pluginName = 'imagecrop',
        defaults = {
            width: null,
            height: null,
            text: {
                close: "x"
            },
            zoomStep: 1,
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
            originalPosition: { // zoom factor 1.0
                x: 0,
                y: 0,
                width: 0,
                height: 0
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
                    position.height = $t.height();
                    position.width = position.height * aspect_img;
                    position.left = -(position.width-$t.width())/2;
                } else {
                    position.width = $t.width();
                    position.height = position.width / aspect_img;
                    position.top = -(position.height-$t.height())/2;
                }

                $img.height(position.height);
                $img.width(position.width);
                $img.css("left", position.left);
                $img.css("top", position.top);

                self.data.originalPosition = position;
                self.updateDraggableConstraint(position);

                console.log("zoomfactor", self.getZoomFactor(position));

            })
            .draggable();
            this.$img = $img;
            this.zoom(0);

            // Events
            $t.bind("mousewheel", function(e, delta, deltaX, deltaY) {

                e.preventDefault();

                var x = (e.pageX - $img.offset().left) + $(window).scrollLeft();
                var y = (e.pageY - $img.offset().top) + $(window).scrollTop();

                //console.log(x, y, $img.width(), $img.height(), self.getPosition());
                console.log(delta, o.zoomStep);
                self.zoom(delta * o.zoomStep);
            });

            reader.onload = function(e) {
                $img.attr("src", e.target.result);
            };
            reader.readAsDataURL(file);
            this.show("crop");
        },

        zoom: function(deltaZoomFactor, centerPos) { // centerPos relative to stage top left

            deltaZoomFactor = parseFloat(deltaZoomFactor);

            if(this.data.activeStage!="crop")
                return false;

            var $crop = this.$crop,
                $img = $crop.find("img"),
                aspect = this.data.aspect.img,
                oldZoomFactor = this.getZoomFactor(),
                newZoomFactor = oldZoomFactor + deltaZoomFactor,
                oldPos = this.getPosition(),
                newPos = oldPos;

            centerPos = centerPos || {
                x: $crop.width() / 2,
                y: $crop.height() / 2
            };

            if(newZoomFactor < 1)
                newZoomFactor = 1;

            console.log("factors", oldZoomFactor, deltaZoomFactor, newZoomFactor);

            newPos.width = this.data.originalPosition.width * newZoomFactor;
            newPos.height = this.data.originalPosition.height * newZoomFactor;

            // Dimensions

            /** replaced by matrix
            if(newPos.width<$crop.width()) {
                newPos.width = $crop.width();
                newPos.height = newPos.width / aspect;
                newPos.left = 0;
            } else if(newPos.height<$crop.height()) {
                newPos.height = $crop.height();
                newPos.width = newPos.height * aspect;
                newPos.top = 0;
            }
            */

            // Position Constraints
            if((newPos.left + newPos.width) < $crop.width()) {
                newPos.left = $crop.width() - newPos.width;
            }

            if((newPos.top + newPos.height) < $crop.height()) {
                newPos.top = $crop.height() - newPos.height;
            }

            $img
            .width(newPos.width)
            .height(newPos.height)
            .css("left", newPos.left)
            .css("top", newPos.top);

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

        getZoomFactor: function(position) {
            var position = position || this.getPosition(),
                originalPosition = this.data.originalPosition;

            return 1 / originalPosition.width * position.width;
        },

        getStagePosition: function() {
            var self = this,
                $el = this.$crop,
                position = $el.position();

            do {
                position.left += $el.position().left + parseInt($el.css("margin-left"));
                position.top += $el.position().top + parseInt($el.css("margin-top"));
                $el = $el.parent();
            } while($el.get(0)!=document);

            position.left -= parseInt($("body").css("margin-left"));
            position.top -= parseInt($("body").css("margin-top"));

            return position;
        },

        getPosition: function() {

            var $img = this.$img,
                position = $img.position();

            return {
                top: position.top,
                left: position.left,
                width: $img.width(),
                height: $img.height()
            };

        },

        getConstraint: function(position) {

            position = position || this.getPosition();

            var $stage = this.$crop;

            return [
                ($stage.width()-position.width),
                ($stage.height()-position.height),
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