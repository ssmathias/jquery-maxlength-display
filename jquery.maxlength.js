;
/**
 * jQuery MaxLength Plugin
 * Version: 1.1.0
 * Author: Steven Mathias
 * Description:
 * 	This plugin will create a pop-up notification of how many characters
 * 	are left before maxlength is reached. It will also update browsers
 *	which do not support max length on textareas to restrict the length
 *	of those fields.
 * Notes:
 *	This plugin requires the JSON global object to exist. In older browsers, json2.js should be
 *	used as a dependency.
 * Copyright and Licensing:
 *	Copyright (c) 2012 Steven Mathias
 *	Licensed for use under either the GNU Public License or the MIT License
 *	Copies of licenses are distributed with source and most recent versions available for review at either:
 *		GPL - https://github.com/ssmathias/jquery-maxlength-display/blob/master/GPL-License.txt
 *		MIT - https://github.com/ssmathias/jquery-maxlength-display/blob/master/MIT-License.txt
 **/

(function($) {

	var MaxLengthDisplay = function(params, $scope) {
		var settings = {
			"displayTarget": null,
			"targetPin": "top-left",
			"parentPin": "top-right",
			"allowPositionToggle": true,
			"style": {},
			"lengths": {
				"long": 100,
				"medium": 50,
				"short": 20,
				"empty": 0
			}
		};
		if (params) {
			if (params.targetPin)
				settings.targetPin = params.targetPin;
			if (params.parentPin)
				settings.parentPin = params.parentPin;
			if (params.allowPositionToggle !== undefined && params.allowPositionToggle !== null)
				settings.allowPositionToggle = (params.allowPositionToggle == true);
			if (params.style) {
				/*if (typeof params.style == "String")
					settings.style = this.objectifyCssString(params.style);
				else if (typeof params.style == "Object")*/
					settings.style = params.style;
			}
			if (params.lengths) {
				/*if (typeof params.lengths == "String")
					params.lengths = this.objectifyCssString(params.lengths);*/
				settings.lengths = params.lengths;
			}
			if (params.displayTarget) {
				settings.displayTarget = $(params.displayTarget);
			}
		}
		for (var setting in settings) {
			this[setting] = settings[setting];
		}
		this.scope = $scope;
		this.init();
	}
	
	MaxLengthDisplay.prototype.init = function() {
		var self = this;
		for (var index in self.scope) {
			var scopeItem = self.scope[index];
			if (parseInt(index) == 'NaN') {
				continue;
			}
			if (scopeItem.tagName == 'TEXTAREA' || scopeItem.tagName == 'INPUT') {
				this.initializeElement($(scopeItem));
			}
			else {
				this.scope
					.find('input[maxlength], textarea[maxlength]')
						.each(function() {
							self.initializeElement($(this));
						});
			}
		}
	};

	MaxLengthDisplay.prototype.initializeElement = function($element) {
		var self = this,
			maxLength,
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
		
		$target = self.displayTarget;
		
		if ($element.data("maxlength-display-target")) {
			$target = $("#"+$element.data("maxlength-display-target"));
		}
		
		if ($target && $target.length > 0) {
			$element
				.focus(function() {
					$target.addClass('maxlength-parent-has-focus');
				})
				.blur(function() {
					$target.removeClass('maxlength-parent-has-focus');
				});
			self.setLengthDefinitionData($element, $target);
			self.updateDisplayMarkup($element, $target);
		}
		else {
			// A display target needs to be created for this element.
			$target = self.createDisplayTarget($element);
		}
		
		// Set up the change events for this element.
		$element
			.bind('keyup change', function() {
				self.updateDisplayMarkup($element, $target);
			})
			.bind('keypress', function(e) {
				var currentLength = $element.val().length;
				if (currentLength + 1 > maxLength) {
					// Prevent entry of the content
					$element.val($element.val().substring(0, maxLength));
					e.stopPropagation();
					e.preventDefault();
				}
			});
			
		return true;
	};
		
	MaxLengthDisplay.prototype.createDisplayTarget = function($parent) {
		var self = this,
			$parentDiv = $('<div></div>'),
			$innerDiv = $('<div></div>'),
			targetStyle = {},
			allowToggle = self.allowPositionToggle,
			overrideToggle = $parent.data('maxlength-allow-position-toggle');
			
		// Cheap object cloning supported in older browsers
		for (var styleName in self.style) {
			targetStyle[styleName] = self.style[styleName];
		}
			
		if ($parent.data("maxlength-target-style")) {
			overrideStyle = self.objectifyCssString($parent.data("maxlength-target-style"));
			
			for (var attName in overrideStyle) {
				targetStyle[attName] = overrideStyle[attName];
			}
		}
			
		// Configure the inner div. This is largely the "target", and what is returned.
		self.setLengthDefinitionData($parent, $innerDiv);
		self.updateDisplayMarkup($parent, $innerDiv);
		$innerDiv
			.addClass('maxlength-display-target');
			
		if (typeof overrideToggle != "undefined") {
			var overrideToggle = $parent.data('maxlength-allow-position-toggle');
			if (overrideToggle.length > 0) {
				overrideToggle = $.trim(overrideToggle.toLowerCase());
			}
			if ($.inArray(overrideToggle, ["true", "false"])) {
				allowToggle = (overrideToggle == "true");
			}
			else {
				if (typeof console != "undefined") {
					console.warn('[jQuery Maxlength Display] allow position toggle value "' + overrideToggle + '" not recognized. Ignoring override.');
				}
			}
		}
			
		// Configure the parent div
		$parentDiv
			.addClass('maxlength-display-target-parent')
			.css({
				"float": "left"
			})
			.append($innerDiv)
			.data("maxlength-parent-pin", self.getPinDefinition($parent, "parent"))
			.data("maxlength-my-pin", self.getPinDefinition($parent, "target"))
			.data("maxlength-can-toggle", allowToggle)
			.data("parent-id", $parent.attr('id'));
		
		// Append to the body so it can flow outside its parents' DOM location.
		$('body').append($parentDiv);
		$innerDiv
			.width($innerDiv.width())
			.css(targetStyle);
		$parentDiv.hide();
		self.updateDisplayLocation($parent, $parentDiv);
			
		// Set up events related to these elements
		$parent
			.focus(function() {
				$innerDiv
					.addClass("maxlength-parent-has-focus");
				$parentDiv
					.addClass("maxlength-parent-has-focus")
					.show();
				self.updateDisplayLocation($parent, $parentDiv);
			})
			.blur(function() {
				$innerDiv
					.removeClass("maxlength-parent-has-focus");
				$parentDiv
					.removeClass("maxlength-parent-has-focus")
					.hide();
			});

		if (self.allowPositionToggle) {
			$(window).bind('scroll resize', function() {
				self.updateDisplayLocation($parent, $parentDiv);
			});
		}

		return $innerDiv;
	};
	
	MaxLengthDisplay.prototype.calculateRemainingChars = function($parent) {
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
	};
		
	MaxLengthDisplay.prototype.updateDisplayMarkup = function($parent, $target) {
		var self = this,
			remainingChars = self.calculateRemainingChars($parent),
			cssClass = "",
			currentMaxClassNum = null,
			lengthClasses;
		
		$target = $($target);
		if (typeof $target == "undefined") {
			return false;
		}
			
		if (remainingChars === false) {
			return false;
		}
		
		lengthClasses = self.lengths;
		
		for (var lengthName in lengthClasses) {
			$target.removeClass('maxlength-remaining-' + lengthName);
			var currentLength = lengthClasses[lengthName];
			if (remainingChars <= currentLength && (currentLength < currentMaxClassNum || currentMaxClassNum == null)) {
				cssClass = "maxlength-remaining-" + lengthName;
				currentMaxClassNum = currentLength;
			}
		}
		
		$target.addClass(cssClass)
			.html(remainingChars);
	};
		
	MaxLengthDisplay.prototype.getPinDefinition = function($parent, pinElement) {
		var self = this,
			hardOverrides = {
				"parent": ["top", "right"],
				"target": ["top", "left"]
			},
			defaultPinLocation = false;
			pinLocation = false
			overridePinLocation = false;
		switch (pinElement) {
			case "parent":
				defaultPinLocation = self.parentPin.toLowerCase().split('-');
				pinLocation = $parent.data("maxlength-pin-location");
				overridePinLocation = hardOverrides["parent"];
				break;
			case "target":
				defaultPinLocation = self.targetPin.toLowerCase().split('-');
				pinLocation = $parent.data("maxlength-target-pin-location");
				overridePinLocation = hardOverrides["target"];
				break;
		}
		
		if (typeof pinLocation == "undefined") {
			pinLocation = defaultPinLocation;
			if (!$.inArray(pinLocation[0], ["top", "bottom"]) == -1) {
				if (typeof console != "undefined") {
					console.warn("[jQuery Maxlength Display] Invalid vertical pin location: " + pinLocation[0] + " - Overriding to " + overridePinLocation[0]);
				}
				pinLocation[0] = overridePinLocation[0];
			}
			if (!$.inArray(pinLocation[1], ["left", "right"]) == -1) {
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
				if (!$.inArray(pinLocation[0], ["top", "bottom"]) == -1) {
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
				if (!$.inArray(pinLocation[1], ["left", "right"]) == -1) {
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
	};
		
	MaxLengthDisplay.prototype.setLengthDefinitionData = function($parent, $target) {
		var self = this,
			lengthClasses = {},
			lengthClass,
			overrideClasses,
			className,
			lengthVal;
		
		// Method to clone object that is supported in older browsers.
		for (lengthClass in self.lengthDefinition) {
			lengthClasses[lengthClass] = self.lengthDefinition[lengthClass];
		}
		
		// Allow overrides of lengthClasses and definitions
		if ($parent.data('maxlength-length-classes')) {
			overrideClasses = self.objectifyCssString($parent.data('maxlength-length-classes'));
			
			for (className in overrideClasses) {
				lengthVal = parseInt(overrideClasses[className]);
				if (typeof lengthVal == "undefined" || typeof lengthVal == "NaN") {
					if (typeof console != "undefined") {
						console.warn('[jQuery Maxlength Display] - Override length class "'+className+'" value "'+overrideClasses[className]+'" could not be parsed as an integer. Ignoring');
					}
					continue;
				}
				lengthClasses[className] = lengthVal;
			}
		}
		
		$target.data('maxlength-length-classes', lengthClasses);
		return true;
	};
		
	MaxLengthDisplay.prototype.updateDisplayLocation = function($parent, $target) {
		var self = this,
			parentPin = $target.data("maxlength-parent-pin"),
			targetPin = $target.data("maxlength-my-pin"),
			positionCss = {"position": "absolute", "top": "", "left": ""},
			canToggle = (
				($target.data('maxlength-can-toggle') !== undefined && $target.data('maxlength-can-toggle') === true) ||
				($target.data('maxlength-can-toggle') === undefined && self.allowPositionToggle === true)
			),
			parentPos = $parent.offset(),
			windowPos = {}; // windowPos has to be created manually
		
		// Set up missing position elements
		parentPos.right = parentPos.left + $parent.outerWidth();
		parentPos.bottom = parentPos.top + $parent.outerHeight();

		windowPos.top = window.scrollY;
		windowPos.bottom = windowPos.top + document.body.clientHeight;
		windowPos.left = window.scrollX;
		windowPos.right = windowPos.left + document.body.clientWidth;
			
		if (!parentPin || parentPin.length != 2 || !targetPin || targetPin.length != 2) {
			return false;
		}
		
		switch (parentPin[0]) {
			case "top":
				switch (targetPin[0]) {
					case "top":
						if (parentPos.top < windowPos.top && parentPos.bottom > windowPos.top && canToggle) {
							// Set toggled state
							if ($target.hasClass("maxlength-display-target-parent")) {
								$target.find(".maxlength-display-target").each(function() {
									var $inner = $(this); // maxlength display target
									self.setToggledCss($inner, "vertical", true);
								});
							}
							else if ($target.hasClass("maxlength-display-target")) {
								self.setToggledCss($target, "vertical", true);
							}
							positionCss["top"] = parentPos.bottom - $target.outerHeight();
						}
						else {
							// Unset toggled state
							if ($target.hasClass("maxlength-display-target-parent")) {
								$target.find(".maxlength-display-target").each(function() {
									var $inner = $(this); // maxlength display target
									self.setToggledCss($inner, "vertical", false);
								});
							}
							else if ($target.hasClass("maxlength-display-target")) {
								self.setToggledCss($target, "vertical", false);
							}
							positionCss["top"] = parentPos.top;
						}
						break;
					case "bottom":
						if (parentPos.top - $target.outerHeight() < windowPos.top && parentPos.bottom > windowPos.top && canToggle) {
							// Set toggled state
							if ($target.hasClass("maxlength-display-target-parent")) {
								$target.find(".maxlength-display-target").each(function() {
									var $inner = $(this); // maxlength display target
									self.setToggledCss($inner, "vertical", true);
								});
							}
							else if ($target.hasClass("maxlength-display-target")) {
								self.setToggledCss($target, "vertical", true);
							}
							positionCss["top"] = parentPos.bottom;
						}
						else {
							// Unset toggled state
							if ($target.hasClass("maxlength-display-target-parent")) {
								$target.find(".maxlength-display-target").each(function() {
									var $inner = $(this); // maxlength display target
									self.setToggledCss($inner, "vertical", false);
								});
							}
							else if ($target.hasClass("maxlength-display-target")) {
								self.setToggledCss($target, "vertical", false);
							}
							positionCss["top"] = parentPos.top - $target.outerHeight();
						}
						break;
				}
				break;
			case "bottom":
				switch (targetPin[0]) {
					case "top":
						if (parentPos.bottom + $target.outerHeight() > windowPos.bottom && parentPos.top < windowPos.bottom && canToggle) {
							// Set toggled state
							if ($target.hasClass("maxlength-display-target-parent")) {
								$target.find(".maxlength-display-target").each(function() {
									var $inner = $(this); // maxlength display target
									self.setToggledCss($inner, "vertical", true);
								});
							}
							else if ($target.hasClass("maxlength-display-target")) {
								self.setToggledCss($target, "vertical", true);
							}
							positionCss["top"] = parentPos.top - $target.outerHeight();
						}
						else {
							// Unset toggled state
							if ($target.hasClass("maxlength-display-target-parent")) {
								$target.find(".maxlength-display-target").each(function() {
									var $inner = $(this); // maxlength display target
									self.setToggledCss($inner, "vertical", false);
								});
							}
							else if ($target.hasClass("maxlength-display-target")) {
								self.setToggledCss($target, "vertical", false);
							}
							positionCss["top"] = parentPos.bottom;
						}
						break;
					case "bottom":
						if (parentPos.bottom > windowPos.bottom && parentPos.top < windowPos.bottom && canToggle) {
							// Set toggled state
							if ($target.hasClass("maxlength-display-target-parent")) {
								$target.find(".maxlength-display-target").each(function() {
									var $inner = $(this); // maxlength display target
									self.setToggledCss($inner, "vertical", true);
								});
							}
							else if ($target.hasClass("maxlength-display-target")) {
								self.setToggledCss($target, "vertical", true);
							}
							positionCss["top"] = parentPos.top;
						}
						else {
							// Unset toggled state
							if ($target.hasClass("maxlength-display-target-parent")) {
								$target.find(".maxlength-display-target").each(function() {
									var $inner = $(this); // maxlength display target
									self.setToggledCss($inner, "vertical", false);
								});
							}
							else if ($target.hasClass("maxlength-display-target")) {
								self.setToggledCss($target, "vertical", false);
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
						if (parentPos.left < windowPos.left && parentPos.right > windowPos.left && canToggle) {
							// Set toggled state
							if ($target.hasClass("maxlength-display-target-parent")) {
								$target.find(".maxlength-display-target").each(function() {
									var $inner = $(this); // maxlength display target
									self.setToggledCss($inner, "horizontal", true);
								});
							}
							else if ($target.hasClass("maxlength-display-target")) {
								self.setToggledCss($target, "horizontal", true);
							}
							positionCss["left"] = parentPos.right - $target.outerWidth();
						}
						else {
							// Unset toggled state
							if ($target.hasClass("maxlength-display-target-parent")) {
								$target.find(".maxlength-display-target").each(function() {
									var $inner = $(this); // maxlength display target
									self.setToggledCss($inner, "horizontal", false);
								});
							}
							else if ($target.hasClass("maxlength-display-target")) {
								self.setToggledCss($target, "horizontal", false);
							}
							positionCss["left"] = parentPos.left;
						}
						break;
					case "right":
						if (parentPos.left - $target.outerWidth() < windowPos.left && parentPos.right > windowPos.left && canToggle) {
							// Set toggled state
							if ($target.hasClass("maxlength-display-target-parent")) {
								$target.find(".maxlength-display-target").each(function() {
									var $inner = $(this); // maxlength display target
									self.setToggledCss($inner, "horizontal", true);
								});
							}
							else if ($target.hasClass("maxlength-display-target")) {
								self.setToggledCss($target, "horizontal", true);
							}
							positionCss["left"] = parentPos.right;
						}
						else {
							// Unset toggled state
							if ($target.hasClass("maxlength-display-target-parent")) {
								$target.find(".maxlength-display-target").each(function() {
									var $inner = $(this); // maxlength display target
									self.setToggledCss($inner, "horizontal", false);
								});
							}
							else if ($target.hasClass("maxlength-display-target")) {
								self.setToggledCss($target, "horizontal", false);
							}
							positionCss["left"] = parentPos.left - $target.outerWidth();
						}
						break;
				}
				break;
			case "right":
				switch (targetPin[1]) {
					case "left":
						if (parentPos.right + $target.outerWidth() > windowPos.right && parentPos.left < windowPos.right && canToggle) {
							// Set toggled state
							if ($target.hasClass("maxlength-display-target-parent")) {
								$target.find(".maxlength-display-target").each(function() {
									var $inner = $(this); // maxlength display target
									self.setToggledCss($inner, "horizontal", true);
								});
							}
							else if ($target.hasClass("maxlength-display-target")) {
								self.setToggledCss($target, "horizontal", true);
							}
							positionCss["left"] = parentPos.left - $target.outerWidth();
						}
						else {
							// Unset toggled state
							if ($target.hasClass("maxlength-display-target-parent")) {
								$target.find(".maxlength-display-target").each(function() {
									var $inner = $(this); // maxlength display target
									self.setToggledCss($inner, "horizontal", false);
								});
							}
							else if ($target.hasClass("maxlength-display-target")) {
								self.setToggledCss($target, "horizontal", false);
							}
							positionCss["left"] = parentPos.right;
						}
						break;
					case "right":
						if (parentPos.right > windowPos.right && parentPos.left < windowPos.right && canToggle) {
							// Set toggled state
							if ($target.hasClass("maxlength-display-target-parent")) {
								$target.find(".maxlength-display-target").each(function() {
									var $inner = $(this); // maxlength display target
									self.setToggledCss($inner, "horizontal", true);
								});
							}
							else if ($target.hasClass("maxlength-display-target")) {
								self.setToggledCss($target, "horizontal", true);
							}
							positionCss["left"] = parentPos.left;
						}
						else {
							// Unset toggled state
							if ($target.hasClass("maxlength-display-target-parent")) {
								$target.find(".maxlength-display-target").each(function() {
									var $inner = $(this); // maxlength display target
									self.setToggledCss($inner, "horizontal", false);
								});
							}
							else if ($target.hasClass("maxlength-display-target")) {
								self.setToggledCss($target, "horizontal", false);
							}
							positionCss["left"] = parentPos.right - $target.outerWidth();
						}
						break;
				}
				break;
		}
		
		$target.css(positionCss);
	};
		
	MaxLengthDisplay.prototype.setToggledCss = function($target, direction, toggledState) {
		var	self = this,
			toggleData = $target.data("maxlength-display-toggle-" + direction);
		if (
			(toggledState && toggleData != "active")
			|| (!toggledState && toggleData == "active")
		) {
			// We need to toggle the css state on this object
			if (toggleData == "active") {
				$target
					.data("maxlength-display-toggle-" + direction, "")
					.removeClass("maxlength-display-toggle-" + direction);
			}
			else {
				$target
					.data("maxlength-display-toggle-" + direction, "active")
					.addClass("maxlength-display-toggle-" + direction);
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
	};
		
	MaxLengthDisplay.prototype.objectifyCssString = function(attString) {
		var cssObject = {},
			rules = attString.split(';');
			
		for (var index in rules) {
			var rule = $.trim(rules[index]).split(':');
			if (rule.length == 2) {
				cssObject[$.trim(rule[0])] = $.trim(rule[1]);
			}
		}
		
		return cssObject;
	};
	
	$.fn.maxLengthDisplay = function(params) {
		if (params == null)
			params = {};
		new MaxLengthDisplay(params, this);
		return this;
	}
	
})(jQuery);
