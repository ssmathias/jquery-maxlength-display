;
/**
 * jQuery MaxLength Plugin
 * Version: 0.1
 * Author: Steven Mathias
 * Description:
 * 	This plugin will create a pop-up notification of how many characters
 * 	are left before maxlength is reached. It will also update browsers
 *	which do not support max length on textareas to restrict the length
 *	of those fields.
 **/

(function($) {

	$.maxLengthDisplay = {
		"scope": "body",
		"pinDefault": {
			"target": "top-left",
			"parent": "top-right"
		},
		"allowPositionToggle": true,
		"style": {},
		"lengthDefinition" : {
			"long": 100,
			"medium": 50,
			"short": 10,
			"empty": 0
		},

		"init": function() {
			var $scope = $(this.scope);
			if (typeof $scope != "undefined") {
				$scope
					.find('input[maxlength], textarea[maxlength]').not('.maxlength-display-activated')
						.each(function() {
							$.maxLengthDisplay.initializeElement($(this));
						});
			}
		},
		
		"calculateRemainingChars": function($parent) {
			if (typeof $parent.attr == "undefined") {
				$parent = $($parent);
			}
			if (typeof $parent == "undefined") {
				return false;
			}
			if ($parent.attr("maxlength")) {
				var maxLength = parseInt($parent.attr("maxlength")),
					currentLength = $parent.val().length;
				if (maxLength === false) {
					if (typeof console != "undefined") {
						console.warn("[jQuery Maxlength Display] Could not parse integer from value: " + $parent.attr("maxlength"));
					}
					return false;
				}
				if (maxLength <= currentLength) {
					return 0;
				}
				else {
					return maxLength - currentLength;
				}
			}
			else {
				return false;
			}
		}
		
		"updateDisplayMarkup": function($parent, $target) {
			if (typeof $target.attr == "undefined") {
				// Convert to jQuery object
				$target = $($target);
			}
			if (typeof $target == "undefined") {
				return false;
			}
			var remainingChars = $.maxLengthDisplay.calculateRemainingChars($parent),
				cssClass = "",
				currentMaxClassNum = -1;
				
			if (remainingChars === false) {
				return false;
			}
				
			// Clean off old length classes.
			$target.className = $target.className.replace(/\bmaxlength-remaining-.*?\b/g, '');
			
			for (var lengthName in $.maxLengthDisplay.lengthDefinition) {
				var currentLength = $.maxLengthDisplay.lengthDefinition[lengthName];
				if (remainingChars >= currentLength && currentLength > currentMaxClassNum) {
					cssClass = "maxlength-remaining-" + lengthName;
					currentMaxClassNum = currentLength;
				}
			}
			$target.addClass(cssClass)
				.html(remainingChars);
		}
			
		
		"initializeElement": function($element) {
			var maxLength,
				$target;
			if (typeof $element.attr == "undefined") {
				// Set this to a jquery element
				$element = $($element);
			}
			if ($element.data("maxlength-display-initialized") == "true") {
				// This is already initialized. Return.
				return true;
			}
			maxLength = parseInt($element.attr("maxlength"));
			if (typeof maxLength == "undefined" || typeof maxLength == "NaN") {
				if (typeof console != "undefined") {
					console.warn("[jQuery Maxlength Display] Could not convert " + $element.attr("maxlength") + " to an integer. Ignoring.");
					return false;
				}
			}
			$element.data("maxlength-display-initialized", "true");
			
			if (!$element.data("maxlength-display-target")) {
				// A display target needs to be created for this element.
				$target = $.maxLengthDisplay.createDisplayTarget($this);
			}
			else {
				$target = $("#"+$element.data("maxlength-display-target"));
				$this
					.focus(function() {
						$target.addClass('maxlength-parent-has-focus');
					})
					.blur(function() {
						$target.removeClass('maxlength-parent-has-focus');
					});
			}
			
			// Set up the change events for this element.
			$this
				.bind('keyup change', function() {
					$.maxLengthDisplay.updateDisplayMarkup($this, $target);
				})
				.bind('keypress', function(e) {
					var currentLength = $this.val().length;
					if (currentLength + 1 >= maxLength) {
						// Prevent entry of the content
						$this.val($this.val().substring(0, maxLength);
						e.stopPropagation();
						e.preventDefault();
					}
				});
				
			return true;
		},
		
		"getPinDefinition": function($parent, pinElement) {
			var hardOverrides = {
					"parent": ["top", "right"],
					"target": ["top", "left"]
				},
				defaultPinLocation = false;
				pinLocation = false
				overridePinLocation = false;
			switch (pinElement) {
				case "parent":
					defaultPinLocation = $.maxLengthDisplay.pinDefault.parent.toLowerCase().split('-');
					pinLocation = $parent.data("maxlength-pin-location");
					overridePinLocation = hardOverrides["parent"];
					break;
				case "target":
					defaultPinLocation = $.maxLengthDisplay.pinDefault.target.toLowerCase().split('-');
					pinLocation = $parent.data("maxlength-target-pin-location");
					overridePinLocation = hardOverrides["target"];
					break;
			}
			
			if (typeof pinLocation == "undefined") {
				pinLocation = defaultPinLocation;
				if (!$.inArray(pinLocation[0], ["top", "bottom"])) {
					if (typeof console != "undefined") {
						console.warn("[jQuery Maxlength Display] Invalid vertical pin location: " + pinLocation[0] + " - Overriding to " + overridePinLocation[0]);
					}
					pinLocation[0] = overridePinLocation[0];
				}
				if (!$.inArray(pinLocation[1], ["left", "right"])) {
					if (typeof console != "undefined") {
						console.warn("[jQuery Maxlength Display] Invalid horizontal pin location: " + pinLocation[1] + " - Overriding to " + overridePinLocation[1]);
					}
					pinLocation[1] = overridePinLocation[1];
				}
			}
			else {
				pinLocation = pinLocation.toLowerCase().split('-');
				if (pinLocation.length != 2) {
					if (typeof console != "undefined") {
						console.warn("[jQuery Maxlength Display] Invalid pin location: " + pinLocation.join('-') + " - Using default.");
					}
					pinLocation = defaultPinLocation;
				}
				else {
					if (!$.inArray(pinLocation[0], ["top", "bottom"])) {
						if ($.inArray(defaultPinLocation[0], ["top", "bottom"])) {
							if (typeof console != "undefined") {
								console.warn("[jQuery Maxlength Display] Invalid vertical pin location: " + pinLocation[0] + " - Using default.");
							}
							pinLocation[0] = defaultPinLocation[0];
						}
						else {
							if (typeof console != "undefined") {
								console.warn("[jQuery Maxlength Display] Invalid vertical pin location: " + pinLocation[0] + " - Overriding to " + overridePinLocation[0]);
							}
							pinLocation[0] = overridePinLocation[0];
						}
					}
					if (!$.inArray(pinLocation[1], ["left", "right"])) {
						if ($.inArray(defaultPinLocation[1], ["left", "right"])) {
							if (typeof console != "undefined") {
								console.warn("[jQuery Maxlength Display] Invalid horizontal pin location: " + pinLocation[1] + " - Using default.");
							}
							pinLocation[1] = defaultPinLocation[1];
						}
						else {
							if (typeof console != "undefined") {
								console.warn("[jQuery Maxlength Display] Invalid horizontal pin location: " + pinLocation[1] + " - Overriding to " + overridePinLocation[1]);
							}
							pinLocation[1] = overridePinLocation[1];
						}
					}
				}
			}
			
			return pinLocation;
		}
		
		"createDisplayTarget": function($parent) {
			var $parentDiv = $('<div></div>'),
				$innerDiv = $('<div></div>'),
				targetStyle = $.maxLengthDisplay.style;
				
			if ($parent.data("maxlength-target-style")) {
				// Parse the CSS into a custom object.
				var inlineStyles = $.trim($parent.data("maxlength-target-style")).split(';');
				for (var styleDefinition in inlineStyles) {
					var currentDefinition = $.trim(inlineStyles[styleDefinition]).split(':');
					if (currentDefinition.length == 2) {
						targetStyle[$.trim(currentDefinition[0])] = $.trim(currentDefinition[1]);
					}
				}
			}
				
			// Configure the inner div. This is largely the "target", and what is returned.
			$.maxLengthDisplay.updateDisplayMarkup($parent, $innerDiv);
			$innerDiv
				.addClass('maxlength-display-target')
				.css(targetStyle)
				.width($innerDiv.width())
				.hide();
				
			// Configure the parent div
			$parentDiv
				.addClass('maxlength-display-target-parent')
				.css({
					"float": "left"
				})
				.append($innerDiv)
				.hide()
				.data("maxlength-parent-pin", $.maxLengthDisplay.getPinDefinition($parent, "parent"))
				.data("maxlength-my-pin", $.maxLengthDisplay.getPinDefinition($parent, "target"));
			
			// Append to the body so it can flow outside its parents' DOM location.
			$('body').append($parentDiv);
			$.maxLengthDisplay.updateDisplayLocation($parent, $parentDiv);
				
			// Set up events related to these elements
			$parent
				.focus(function() {
					$innerDiv
						.addClass("maxlength-parent-has-focus");
					$parentDiv
						.addClass("maxlength-parent-has-focus")
						.show();
				})
				.blur(function() {
					$innerDiv
						.addClass("maxlength-parent-has-focus");
					$parentDiv
						.addClass("maxlength-parent-has-focus")
						.hide();
				});

			if ($.maxLengthDisplay.allowPositionToggle) {
				$(window).bind('scroll resize', function() {
					$.maxLengthDisplay.updateDisplayLocation($parent, $parentDiv);
				});
			}

			return $innerDiv;
		},
		
		"updateDisplayLocation": function($parent, $target) {
			var parentPin = $target.data("maxlength-parent-pin"),
				targetPin = $target.data("maxlength-my-pin"),
				positionCss = {"position": "absolute", "top": "", "left": ""},
				parentPos = $parent.position(),
				windowPos = {}; // windowPos has to be created manually
				
			// Set up missing position elements
			parentPos.right = parentPos.left + $parent.outerWidth();
			parentPos.bottom = parentPos.top + $parent.outerHeight();

			windowPos.top = window.scrollY;
			windowPos.bottom = windowPos.top + window.innerHeight;
			windowPos.left = window.scrollX;
			windowPos.right = windowPos.left + window.innerWidth;
				
			if (!parentPin || parentPin.length != 2 || !targetPin || targetPin.length != 2) {
				return false;
			}
			
			switch (parentPin[0]) {
				case "top":
					switch (targetPin[0]) {
						case "top":
							if (parentPos.top < windowPos.top && parentPos.bottom > windowPos.top && $.maxLengthDisplay.allowPositionToggle) {
								// Set toggled state
								if ($target.hasClass("maxlength-display-target-parent")) {
									$target.find("maxlength-display-target").each(function() {
										var $inner = $(this); // maxlength display target
										$.maxLengthDisplay.setToggledCss($inner, "vertical", true);
									});
								}
								else if ($target.hasClass("maxlength-display-target")) {
									$.maxLengthDisplay.setToggledCss($target, "vertical", true);
								}
								positionCss["top"] = parentPos.bottom - $target.outerHeight();
							}
							else {
								// Unset toggled state
								if ($target.hasClass("maxlength-display-target-parent")) {
									$target.find("maxlength-display-target").each(function() {
										var $inner = $(this); // maxlength display target
										$.maxLengthDisplay.setToggledCss($inner, "vertical", false);
									});
								}
								else if ($target.hasClass("maxlength-display-target")) {
									$.maxLengthDisplay.setToggledCss($target, "vertical", false);
								}
								positionCss["top"] = parentPos.top;
							}
							break;
						case "bottom":
							if (parentPos.top - $target.outerHeight() < windowPos.top && parentPos.bottom > windowPos.top && $.maxLengthDisplay.allowPositionToggle) {
								// Set toggled state
								if ($target.hasClass("maxlength-display-target-parent")) {
									$target.find("maxlength-display-target").each(function() {
										var $inner = $(this); // maxlength display target
										$.maxLengthDisplay.setToggledCss($inner, "vertical", true);
									});
								}
								else if ($target.hasClass("maxlength-display-target")) {
									$.maxLengthDisplay.setToggledCss($target, "vertical", true);
								}
								positionCss["top"] = parentPos.bottom;
							}
							else {
								// Unset toggled state
								if ($target.hasClass("maxlength-display-target-parent")) {
									$target.find("maxlength-display-target").each(function() {
										var $inner = $(this); // maxlength display target
										$.maxLengthDisplay.setToggledCss($inner, "vertical", false);
									});
								}
								else if ($target.hasClass("maxlength-display-target")) {
									$.maxLengthDisplay.setToggledCss($target, "vertical", false);
								}
								positionCss["top"] = parentPos.top - $target.outerHeight();
							}
							break;
					}
					break;
				case "bottom":
					switch (targetPin[0]) {
						case "top":
							if (parentPos.bottom + $target.outerHeight() > windowPos.bottom && parentPos.top < windowPos.bottom && $.maxLengthDisplay.allowPositionToggle) {
								// Set toggled state
								if ($target.hasClass("maxlength-display-target-parent")) {
									$target.find("maxlength-display-target").each(function() {
										var $inner = $(this); // maxlength display target
										$.maxLengthDisplay.setToggledCss($inner, "vertical", true);
									});
								}
								else if ($target.hasClass("maxlength-display-target")) {
									$.maxLengthDisplay.setToggledCss($target, "vertical", true);
								}
								positionCss["top"] = parentPos.top - $target.outerHeight();
							}
							else {
								// Unset toggled state
								if ($target.hasClass("maxlength-display-target-parent")) {
									$target.find("maxlength-display-target").each(function() {
										var $inner = $(this); // maxlength display target
										$.maxLengthDisplay.setToggledCss($inner, "vertical", false);
									});
								}
								else if ($target.hasClass("maxlength-display-target")) {
									$.maxLengthDisplay.setToggledCss($target, "vertical", false);
								}
								positionCss["top"] = parentPos.bottom;
							}
							break;
						case "bottom":
							if (parentPos.bottom > windowPos.bottom && parentPos.top < windowPos.bottom && $.maxLengthDisplay.allowPositionToggle) {
								// Set toggled state
								if ($target.hasClass("maxlength-display-target-parent")) {
									$target.find("maxlength-display-target").each(function() {
										var $inner = $(this); // maxlength display target
										$.maxLengthDisplay.setToggledCss($inner, "vertical", true);
									});
								}
								else if ($target.hasClass("maxlength-display-target")) {
									$.maxLengthDisplay.setToggledCss($target, "vertical", true);
								}
								positionCss["top"] = parentPos.top;
							}
							else {
								// Unset toggled state
								if ($target.hasClass("maxlength-display-target-parent")) {
									$target.find("maxlength-display-target").each(function() {
										var $inner = $(this); // maxlength display target
										$.maxLengthDisplay.setToggledCss($inner, "vertical", false);
									});
								}
								else if ($target.hasClass("maxlength-display-target")) {
									$.maxLengthDisplay.setToggledCss($target, "vertical", false);
								}
								positionCss["top"] = parentPos.bottom - $target.outerHeight();
							}
							break;
					}
					break;
			}
			
			switch (parentPin[1]) {
				case "left":
					switch (targetPin[1]) {
						case "left":
							if (parentPos.left < windowPos.left && parentPos.right > windowPos.left && $.maxLengthDisplay.allowPositionToggle) {
								// Set toggled state
								if ($target.hasClass("maxlength-display-target-parent")) {
									$target.find("maxlength-display-target").each(function() {
										var $inner = $(this); // maxlength display target
										$.maxLengthDisplay.setToggledCss($inner, "horizontal", true);
									});
								}
								else if ($target.hasClass("maxlength-display-target")) {
									$.maxLengthDisplay.setToggledCss($target, "horizontal", true);
								}
								positionCss["left"] = parentPos.right - $target.outerWidth();
							}
							else {
								// Unset toggled state
								if ($target.hasClass("maxlength-display-target-parent")) {
									$target.find("maxlength-display-target").each(function() {
										var $inner = $(this); // maxlength display target
										$.maxLengthDisplay.setToggledCss($inner, "vertical", false);
									});
								}
								else if ($target.hasClass("maxlength-display-target")) {
									$.maxLengthDisplay.setToggledCss($target, "vertical", false);
								}
								positionCss["left"] = parentPos.left;
							}
							break;
						case "right":
							if (parentPos.left - $target.outerWidth() < windowPos.left && parentPos.right > windowPos.left && $.maxLengthDisplay.allowPositionToggle) {
								// Set toggled state
								if ($target.hasClass("maxlength-display-target-parent")) {
									$target.find("maxlength-display-target").each(function() {
										var $inner = $(this); // maxlength display target
										$.maxLengthDisplay.setToggledCss($inner, "vertical", true);
									});
								}
								else if ($target.hasClass("maxlength-display-target")) {
									$.maxLengthDisplay.setToggledCss($target, "vertical", true);
								}
								positionCss["left"] = parentPos.right;
							}
							else {
								// Unset toggled state
								if ($target.hasClass("maxlength-display-target-parent")) {
									$target.find("maxlength-display-target").each(function() {
										var $inner = $(this); // maxlength display target
										$.maxLengthDisplay.setToggledCss($inner, "vertical", false);
									});
								}
								else if ($target.hasClass("maxlength-display-target")) {
									$.maxLengthDisplay.setToggledCss($target, "vertical", false);
								}
								positionCss["left"] = parentPos.left - $target.outerWidth();
							}
							break;
					}
					break;
				case "right":
					switch (targetPin[1]) {
						case "left":
							if (parentPos.right + $target.outerWidth() > windowPos.right && parentPos.left < windowPos.right && $.maxLengthDisplay.allowPositionToggle) {
								// Set toggled state
								if ($target.hasClass("maxlength-display-target-parent")) {
									$target.find("maxlength-display-target").each(function() {
										var $inner = $(this); // maxlength display target
										$.maxLengthDisplay.setToggledCss($inner, "vertical", true);
									});
								}
								else if ($target.hasClass("maxlength-display-target")) {
									$.maxLengthDisplay.setToggledCss($target, "vertical", true);
								}
								positionCss["left"] = parentPos.left - $target.outerWidth();
							}
							else {
								// Unset toggled state
								if ($target.hasClass("maxlength-display-target-parent")) {
									$target.find("maxlength-display-target").each(function() {
										var $inner = $(this); // maxlength display target
										$.maxLengthDisplay.setToggledCss($inner, "vertical", false);
									});
								}
								else if ($target.hasClass("maxlength-display-target")) {
									$.maxLengthDisplay.setToggledCss($target, "vertical", false);
								}
								positionCss["left"] = parentPos.right;
							}
							break;
						case "right":
							if (parentPos.right > windowPos.right && parentPos.left < windowPos.right && $.maxLengthDisplay.allowPositionToggle) {
								// Set toggled state
								if ($target.hasClass("maxlength-display-target-parent")) {
									$target.find("maxlength-display-target").each(function() {
										var $inner = $(this); // maxlength display target
										$.maxLengthDisplay.setToggledCss($inner, "vertical", true);
									});
								}
								else if ($target.hasClass("maxlength-display-target")) {
									$.maxLengthDisplay.setToggledCss($target, "vertical", true);
								}
								positionCss["left"] = parentPos.left;
							}
							else {
								// Unset toggled state
								if ($target.hasClass("maxlength-display-target-parent")) {
									$target.find("maxlength-display-target").each(function() {
										var $inner = $(this); // maxlength display target
										$.maxLengthDisplay.setToggledCss($inner, "vertical", false);
									});
								}
								else if ($target.hasClass("maxlength-display-target")) {
									$.maxLengthDisplay.setToggledCss($target, "vertical", false);
								}
								positionCss["left"] = parentPos.right - $target.outerWidth();
							}
							break;
					}
					break;
			}
			
			$target.css(positionCss);
		},
		
		"setToggledCss": function($target, direction, toggledState) {
			var toggleData = $target.data("maxlength-display-toggle-" + direction);
			if (
				(toggledState && toggleData != "active")
				|| (!toggledState && toggleData == "active")
			) {
				// We need to toggle the css state on this object
				if (toggleData == "active") {
					$target
						.data("maxlength-display-toggle-" + direction, "")
						.addClass("maxlength-display-toggle-" + direction);
				}
				else {
					$target
						.data("maxlength-display-toggle-" + direction, "active")
						.removeClass("maxlength-display-toggle-" + direction);
				}
				switch (direction) {
					case "vertical":
						var marginTop = $target.css("margin-top"),
							marginBottom = $target.css("margin-bottom"),
							paddingTop = $target.css("padding-top"),
							paddingBottom = $target.css("padding-bottom"),
							borderTop = $target.css("border-top"),
							borderBottom = $target.css("border-bottom"),
							borderRadiusTopLeft = $target.css("border-top-left-radius"),
							borderRadiusTopRight = $target.css("border-top-right-radius"),
							borderRadiusBottomLeft = $target.css("border-bottom-left-radius"),
							borderRadiusBottomRight = $target.css("border-bottom-right-radius");
							
						$target.css({
							"margin-top": marginBottom,
							"margin-bottom": marginTop,
							"padding-top": paddingBottom,
							"padding-bottom": paddingTop,
							"border-top": borderBottom,
							"border-bottom": borderTop,
							"border-top-left-radius": borderRadiusBottomLeft,
							"border-top-right-radius": borderRadiusBottomRight,
							"border-bottom-left-radius": borderRadiusTopLeft,
							"border-bottom-right-radius": borderRadiusBottomRight
						});
						break;
					case "horizontal":
						var marginLeft = $target.css("margin-left"),
							marginRight = $target.css("margin-right"),
							paddingLeft = $target.css("padding-left"),
							paddingRight = $target.css("padding-right"),
							borderLeft = $target.css("border-left"),
							borderRight = $target.css("border-right"),
							borderRadiusTopLeft = $target.css("border-top-left-radius"),
							borderRadiusTopRight = $target.css("border-top-right-radius"),
							borderRadiusBottomLeft = $target.css("border-bottom-left-radius"),
							borderRadiusBottomRight = $target.css("border-bottom-right-radius");
							
						$target.css({
							"margin-left": marginRight,
							"margin-right": marginLeft,
							"padding-left": paddingRight,
							"padding-right": paddingLeft,
							"border-left": borderRight,
							"border-right": borderLeft,
							"border-top-left-radius": borderRadiusTopRight,
							"border-top-right-radius": borderRadiusTopLeft,
							"border-bottom-left-radius": borderRadiusBottomRight,
							"border-bottom-right-radius": borderRadiusBottomLeft
						});
						break;
				}
			}
		}
	};
	$(document).ready(function() { $.maxLengthDisplay.init(); });
})(jQuery);
