;
/**
 * jQuery MaxLength Plugin
 * Author: Steven Mathias
 * Description:
 * 	This plugin will create a pop-up notification of how many characters
 * 	are left before maxlength is reached. It will also update browsers
 *	which do not support max length on textareas to restrict the length
 *	of those fields.
 **/

// Ensure jQuery exists
(function($) {
	if (typeof jQuery == "undefined") {
		return;
	}

	$.maxLengthDisplay = {
		"target": "body",
		"pinDefault": {
			"child": "top-left",
			"parent": "top-right"
		},
		"style": {},

		"init": function() {
			// Private function to calculate remaining characters
			function _onValueChange($input, $target) {
				var currentLength = $input.val().length,
					maxLength = parseInt($input.attr('maxlength')),
					$target = $target.children('div'); // We want to target the inner div.
				if (currentLength > maxLength) {
					$input.val($input.val().substring(0, maxLength));
					currentLength = maxLength;
				}
				$target.html(maxLength - currentLength);
			}

			// Private function to set div position relative to input
			function _setChildPosition($parent, $child) {
				var childPoint = $child.data('maxlength-pin-position'),
					parentPoint = $parent.data('maxlength-pin-position'),
					isVisible = $child.is(':visible'),
					positionCss = { "position": "absolute" },
					pos = $parent.position(),
					windowPos = {},
					childHeight = 0,
					childWidth = 0;

				$child.show(); // Can't get outer height valid values without showing element
				childHeight = $child.outerHeight();
				childWidth = $child.outerWidth();
				if (!isVisible) { $child.hide(); }

				pos.right = pos.left + $parent.outerWidth();
				pos.bottom = pos.top + $parent.outerHeight();

				windowPos.top = window.scrollY;
				windowPos.bottom = windowPos.top + window.innerHeight;
				windowPos.left = window.scrollX;
				windowPos.right = windowPos.left + window.innerWidth;

				positionCss["top"] = pos[parentPoint[0]];
				positionCss["left"] = pos[parentPoint[1]];

				if (childPoint[0] == "bottom") {
					positionCss["top"] -= childHeight;
				}
				if (childPoint[1] == "right") {
					positionCss["left"] -= childWidth;
				}

				$inner = $child.children('div');

				if (parentPoint[0] == "top") {
					if (positionCss["top"] < windowPos.top) {
						// This position cannot be valid vertically.
						// Move it to the bottom
						position["top"] = pos.bottom;
						if ($child.data('maxlength-toggle-vertical') != "active") {
							// We need to set the toggle state
							$child.data('maxlength-toggle-vertical', 'active');
							var marginTop = $inner.css('margin-top'),
								marginBottom = $inner.css('margin-bottom');
							$inner.css('margin-top', marginBottom);
							$inner.css('margin-bottom', marginTop);
						}
					}
					else {
						// This can live in its normal place, so ensure it's not toggled
						if ($child.data('maxlength-toggle-vertical') == "active") {
							// Reset the toggle state
							$child.data('maxlength-toggle-vertical', '');
							var marginTop = $inner.css('margin-top'),
								marginBottom = $inner.css('margin-bottom');
							$inner.css('margin-top', marginBottom);
							$inner.css('margin-bottom', marginTop);
						}
					}
				}
				else if (parentPoint[0] == "bottom") {
					if ((positionCss["top"] + childHeight) > windowPos.bottom) {
						// This position cannot be valid vertically.
						// Move it to the bottom
						position["top"] = pos.top - childHeight;
						if ($child.data('maxlength-toggle-vertical') != "active") {
							// We need to set the toggle state
							$child.data('maxlength-toggle-vertical', 'active');
							var marginTop = $inner.css('margin-top'),
								marginBottom = $inner.css('margin-bottom');
							$inner.css('margin-top', marginBottom);
							$inner.css('margin-bottom', marginTop);
						}
					}
					else {
						// This can live in its normal place, so ensure it's not toggled
						if ($child.data('maxlength-toggle-vertical') == "active") {
							// Reset the toggle state
							$child.data('maxlength-toggle-vertical', '');
							var marginTop = $inner.css('margin-top'),
								marginBottom = $inner.css('margin-bottom');
							$inner.css('margin-top', marginBottom);
							$inner.css('margin-bottom', marginTop);
						}
					}
				}

				if (parentPoint[1] == "left") {
					if (positionCss["left"] < windowPos.left) {
						positionCss["left"] = pos.right;
						if ($child.data('maxlength-toggle-horizontal') != "active") {
							$child.data('maxlength-toggle-horizontal', "active");
							var marginLeft = $inner.css('margin-left'),
								marginRight = $inner.css('margin-right');
							$inner.css('margin-left', marginRight);
							$inner.css('margin-right', marginLeft);
						}
					}
					else {
						if ($child.data('maxlength-toggle-horizontal') == "active") {
							$child.data('maxlength-toggle-horizontal', '');
							var marginLeft = $inner.css('margin-left'),
								marginRight = $inner.css('margin-right');
							$inner.css('margin-left', marginRight);
							$inner.css('margin-right', marginLeft);
						}
					}
				}
				else if (parentPoint[1] == "right") {
					if ((positionCss["left"] + childWidth) > windowPos.right) {
						positionCss["left"] = pos.left - childWidth;
						if ($child.data('maxlength-toggle-horizontal') != "active") {
							$child.data('maxlength-toggle-horizontal', "active");
							var marginLeft = $inner.css('margin-left'),
								marginRight = $inner.css('margin-right');
							$inner.css('margin-left', marginRight);
							$inner.css('margin-right', marginLeft);
						}
					}
					else {
						if ($child.data('maxlength-toggle-horizontal') == "active") {
							$child.data('maxlength-toggle-horizontal', '');
							var marginLeft = $inner.css('margin-left'),
								marginRight = $inner.css('margin-right');
							$inner.css('margin-left', marginRight);
							$inner.css('margin-right', marginLeft);
						}
					}
				}

				positionCss["left"] += "px";
				positionCss["top"] += "px";

				$child.css(positionCss);
			}

			function _initializeChildPosition($parent, $child) {
				var parentPin = $.maxLengthDisplay.pinDefault.parent.split('-'),
					childPin = $.maxLengthDisplay.pinDefault.child.split('-'),
					overrideParentPin = ["top", "right"],
					overrideChildPin = ["top", "left"];

				// Allow per-element pin location overrides.
				if ($parent.data('maxlength-pins')) {
					var updatedPinLocation = $.trim($parent.data('maxlength-pins')).toLowerCase().split(' ');
					if (updatedPinLocation.length == 1) {
						// This value is for both the parent and the child corners
						parentPin = childPin = updatedPinLocation.split('-');
					}
					else if (updatedPinLocation.length > 1) {
						parentPin = updatedPinLocation[0].split('-');
						childPin = updatedPinLocation[1].split('-');
						if (updatedPinLocation.length > 2) {
							if (typeof console != "undefined") {
								console.warn('More than two location values found: "' + updatedPinLocation.join(' ') + '" - Only first two values used');
							}
						}
					}
				}

				// Validate pin locations, overriding invalid values;
				if (parentPin.length != 2) {
					if (typeof console != "undefined") {
						console.warn('Parent pin value "' + parentPin.join('-') + '" invalid. Using override value "' + overrideParentPin.join('-') + '"');
					}
					parentPin = overrideParentPin;
				}
				else {
					var newPosition = parentPin;
					if ($.inArray(parentPin[0], ["top", "bottom"]) == -1) {
						newPosition[0] = overrideParentPin[0];
					}
					if ($.inArray(parentPin[1], ["left", "right"]) == -1) {
						newPosition[1] = overrideParentPin[1];
					}
					if (newPosition[0] != parentPin[0] || newPosition[1] != parentPin[1]) {
						if (typeof console != "undefined") {
							console.warn('Parent pin value "' + parentPin.join('-') + '" invalid. Overridden to "' + newPosition.join('-') + '"');
						}
						parentPin = newPosition;
					}
				}
				if (childPin.length != 2) {
					if (typeof console != "undefined") {
						console.warn('Child pin value "' + childPin.join('-') + '" invalid. Using override value "' + overrideChildPin.join('-') + '"');
					}
					childPin = overrideChildPin;
				}
				else {
					var newPosition = childPin;
					if ($.inArray(childPin[0], ["top", "bottom"]) == -1) {
						newPosition[0] = overrideChildPin[0];
					}
					if ($.inArray(childPin[1], ["left", "right"]) == -1) {
						newPosition[1] = overrideChildPin[1];
					}
					if (newPosition[0] != childPin[0] || newPosition[1] != childPin[1]) {
						if (typeof console != "undefined") {
							console.warn('Child pin value "' + childPin.join('-') + '" invalid. Overridden to "' + newPosition.join('-') + '"');
						}
						childPin = newPosition;
					}
				}

				// Set pin location data on elements
				$parent.data('maxlength-pin-position', parentPin);
				$child.data('maxlength-pin-position', childPin);
			}

			var $target = $(this.target);
			if (typeof $target != "undefined") {
				$target
					.find('input[maxlength], textarea[maxlength]').not('.maxlength-display-activated')
						.each(function() {
							var $this = $(this); // Input or text area
							if ($this.attr('maxlength') !== undefined) {
								// Create the display box
								var myUniqueID = new Date().getTime(),
									$innerDiv = jQuery('<div></div>')
										.addClass('maxlength-display')
										.css($.maxLengthDisplay.style)
										.css('float', 'left'),
									$childDiv = jQuery('<div></div>')
										.addClass('maxlength-display-wrapper')
										.css({"float": "left", "overflow": "hidden"})
										.append($innerDiv);
								$this
									.data('maxlength-id', myUniqueID)
									.addClass('maxlength-display-activated')
									.before($childDiv)
									.focus(function() {
										_setChildPosition($this, $childDiv);
										$childDiv.show();
									})
									.blur(function() {
										$childDiv.hide();
									})
									.bind('keyup change', function() {
										_onValueChange($this, $childDiv);
									})
									.bind('keypress', function(e) {
										var maxLength = parseInt($this.attr('maxlength')),
											currentLength = $this.val().length;
										if (currentLength == maxLength) {
											// Prevent entry of the content
											e.stopPropagation();
											e.preventDefault();
										}
									});
								$(window).bind('scroll resize', function() {
									$(window).find('div.maxlength-display-wrapper:visible').each(function() {
										_setChildPosition($this, $childDiv);
									});
								});
								$target.bind('mouseup', function() {
									_setChildPosition($this, $childDiv);
								});
								_onValueChange($this, $childDiv);
								// Set the div width to a static value based on its current width.
								$innerDiv.width($innerDiv.width());
								_initializeChildPosition($this, $childDiv);
								$childDiv.hide();
							}
						});
			}
		}
	};
	$(document).ready(function() { $.maxLengthDisplay.init(); });
})(jQuery);
