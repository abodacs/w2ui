/************************************************************************
*   Library: Web 2.0 UI for jQuery (using prototypical inheritance)
*   - Following objects defined
* 		- w2ui.w2field 	- various field controls
*		- $.w2field		- jQuery wrapper
*   - Dependencies: jQuery, w2utils
*
*  == 1.2 chanses
*  - new type list/select
*  - added a way to add customTypes
* 
************************************************************************/

(function ($) {

	/* SINGELTON PATTERN */

	var w2field = new (function () {
		this.customTypes = [];
	});

	// ====================================================
	// -- Registers as a jQuery plugin
	
	$.fn.w2field = function(method) {
		// Method calling logic
		if (w2field[method]) {
			return w2field[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object') {
			return w2field.init.apply( this, arguments );
		} else if ( typeof method === 'string') {
			return w2field.init.apply( this, [{ type: method }] );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.w2field' );
		}    
	};
	
	$.extend(w2field, {
		// CONTEXT: this - is jQuery object
		init: function (options) { 		
			var obj = w2field;
			return $(this).each(function (field, index) {
				// Check for Custom Types
				if (typeof w2field.customTypes[options.type.toLowerCase()] == 'function') {
					w2field.customTypes[options.type.toLowerCase()].call(this, options);
					return;
				}  
				// Common Types
				switch (options.type.toLowerCase()) {

					case 'clear': // removes any previous field type
						$(this).off('keypress').off('focus').off('blur');
						if ($(this).prev().hasClass('w2ui-list')) {	// if enum
							$(this).prev().remove();
							$(this).removeAttr('tabindex');
						}
						break;

					case 'text':
						break;

					case 'int':
						$(this).on('keypress', function (event) { // keyCode & charCode differ in FireFox
							if (event.metaKey || event.ctrlKey || event.altKey || (event.charCode != event.keyCode && event.keyCode > 0)) return;
							var ch = String.fromCharCode(event.charCode);
							if (!w2utils.isInt(ch) && ch != '-') {
								if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;
								return false;
							}
						});
						$(this).on('blur', function (event)  { // keyCode & charCode differ in FireFox
							if (this.value != '' && !w2utils.isInt(this.value)) { 
								$(this).w2tag(w2utils.lang('Not an integer'));
							}
						});
						break;
						
					case 'float':
						$(this).on('keypress', function (event) { // keyCode & charCode differ in FireFox
							if (event.metaKey || event.ctrlKey || event.altKey || (event.charCode != event.keyCode && event.keyCode > 0)) return;
							var ch = String.fromCharCode(event.charCode);
							if (!w2utils.isInt(ch) && ch != '.' && ch != '-') {
								if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;
								return false;
							}
						});
						$(this).on('blur', function (event)  { 
							if (this.value != '' && !w2utils.isFloat(this.value)) {
								$(this).w2tag(w2utils.lang('Not a float'));
							} 
						});
						break;
						
					case 'money':
						$(this).on('keypress', function (event) { // keyCode & charCode differ in FireFox	
							if (event.metaKey || event.ctrlKey || event.altKey || (event.charCode != event.keyCode && event.keyCode > 0)) return;
							var ch = String.fromCharCode(event.charCode);
							if (!w2utils.isInt(ch) && ch != '.' && ch != '-' && ch != '$' && ch != '€' && ch != '£' && ch != '¥') {
								if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;
								return false;
							}
						});
						$(this).on('blur', function (event)  { 
							if (this.value != '' && !w2utils.isMoney(this.value)) { 
								$(this).w2tag(w2utils.lang('Not in money format'));
							} 
						});
						break;
						
					case 'hex':
						$(this).on('keypress', function (event) { // keyCode & charCode differ in FireFox	
							if (event.metaKey || event.ctrlKey || event.altKey || (event.charCode != event.keyCode && event.keyCode > 0)) return;
							var ch = String.fromCharCode(event.charCode);
							if (!w2utils.isHex(ch)) {
								if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;
								return false;
							}
						});
						$(this).on('blur', function (event)  { 
							if (this.value != '' && !w2utils.isHex(this.value)) { 
								$(this).w2tag(w2utils.lang('Not a hex number'));
							}
						});
						break;
						 
					case 'alphanumeric':
						$(this).on('keypress', function (event) { // keyCode & charCode differ in FireFox
							if (event.metaKey || event.ctrlKey || event.altKey || (event.charCode != event.keyCode && event.keyCode > 0)) return;
							var ch = String.fromCharCode(event.charCode);
							if (!w2utils.isAlphaNumeric(ch)) {
								if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;
								return false;
							}
						});
						$(this).on('blur', function (event)  { 
							if (this.value != '' && !w2utils.isAlphaNumeric(this.value)) { 
								$(this).w2tag(w2utils.lang('Not alpha-numeric')) 
							} 
						});
						break;
						
					case 'date':
						var obj = this;
						var defaults = {
							format 		: w2utils.settings.date_format, // date format
							start   	: '',				// start of selectable range
							end 		: '',				// end of selectable range
							blocked     : {}, 				// {'4/11/2011': 'yes'}
							colored     : {}				// {'4/11/2011': 'red:white'} 
						}
						options = $.extend({}, defaults, options);

						// -- insert div for calendar
						if ($(this).length == 0 || $('#'+$(this)[0].id).length != 1) {
							console.error('The date field must have a unique id in w2field(\'date\').');
							return;
						}
						$(this) // remove transtion needed for functionality
							.css( { 'transition': 'none', '-webkit-transition': 'none', '-moz-transition': 'none', '-ms-transition': 'none', '-o-transition': 'none' })
							.data("options", options)
							.on('focus', function () {
								var top  = parseFloat($(obj).offset().top) + parseFloat(obj.offsetHeight);
								var left = parseFloat($(obj).offset().left);
								$('#global_calendar_div').remove();
								$('body').append('<div id="global_calendar_div" style="top: '+ (top + parseInt(obj.offsetHeight)) +'px; left: '+ left +'px;" '+
									' class="w2ui-reset w2ui-calendar" '+
									' onmousedown="'+
									'		if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true; '+
									'		if (event.preventDefault) event.preventDefault(); else return false;">'+
									'</div>');
								$('#global_calendar_div')
									.html($().w2field('calendar_get', obj.value, options))
									.css({
										left: left + 'px',
										top: top + 'px'
									})
									.data('el', obj)
									.show();
								// monitors
								var mtimer = setInterval(function () { 
									// monitor if moved
									if ($('#global_calendar_div').data('position') != ($(obj).offset().left) + 'x' + ($(obj).offset().top  + obj.offsetHeight)) {
										$('#global_calendar_div').css({
											'-webkit-transition': '.2s',
											left: ($(obj).offset().left) + 'px',
											top : ($(obj).offset().top + obj.offsetHeight) + 'px'
										}).data('position', ($(obj).offset().left) + 'x' + ($(obj).offset().top + obj.offsetHeight));
									}
									// monitor if destroyed
									if ($(obj).length == 0 || ($(obj).offset().left == 0 && $(obj).offset().top == 0)) {
										clearInterval(mtimer);
										$('#global_calendar_div').remove();
										return;
									}
								}, 100);
								$(obj).data('mtimer', mtimer);
							})
							.on('blur', function (event) {
								// trim empty spaces
								$(obj).val($.trim($(obj).val()));
								// check if date is valid
								if ($.trim($(obj).val()) != '' && !w2utils.isDate($(obj).val(), options.format)) {
									$(this).w2tag(w2utils.lang('Not a valid date') + ': '+ options.format);
								}
								clearInterval($(obj).data('mtimer'));
								$('#global_calendar_div').remove();
							})
							.on('keypress', function (event) {
								var obj = this;
								setTimeout(function () {
									$('#global_calendar_div').html( $().w2field('calendar_get', obj.value, options) );
								}, 10);
							});
						break;
						
					case 'time':
						break;

					case 'datetime':
						break;
						
					case 'color':
						break;

					case 'select':
					case 'list':
						if (this.tagName != 'SELECT') {
							console.log('ERROR: You can only apply $().w2field(\'list\') to a SELECT element');
							return;
						}
						var defaults = {
							items 		: [],
							value 		: null,
							showNone    : true
						};
						var settings = $.extend({}, defaults, options);
						var html =  '';
						var items = w2field.cleanItems(settings.items);
						if (settings.showNone) html = '<option value="">- '+ w2utils.lang('none') +' -</option>';
						for (var i in items) {
							if (!settings.showNone && settings.value == null) settings.value = items[i].id;
							html += '<option value="'+ items[i].id +'">'+ items[i].text + '</option>';
						}
						settings.items = items;
						$(this).data('settings', settings);
						$(this).html(html);
						$(this).val(settings.value);
						if (settings.value != null) $(this).change();
						break;

					case 'enum':
						if (this.tagName != 'INPUT') {
							console.log('ERROR: You can only apply $().w2field(\'enum\') to an INPUT element');
							return;
						}
						var defaults = {
							url			: '',
							items		: [],
							selected 	: [],		// preselected items
							max 		: 0,		// maximum number of items that can be selected 0 for unlim
							maxHeight 	: 72, 		// max height for input control to grow
							showAll		: false,	// if true then show selected item in drop down
							maxCache 	: 500,		// number items to cache
							onRender 	: null,		// -- not implemented
							onSelect 	: null		// -- not implemented
						}
						var obj	= this;
						var settings = $.extend({}, defaults, options);

						// normalize items and selected
						settings.items 	  = w2field.cleanItems(settings.items);
						settings.selected = w2field.cleanItems(settings.selected);

						$(this).data('selected', settings.selected); 
						$(this).css({ 'border-color': 'transparent' });

						// add item to selected
						this.add = function (item) {
							var selected = $(this).data('selected');
							if (!$.isArray(selected)) selected = [];
							if (settings.max != 0 && settings.max <= selected.length) {
								// if max reached, replace last
								selected.splice(selected.length - 1, 1);
							}
							selected.push(item);
							$(this).data('selected', selected);
							$(this).data('last_del', null);
							$(this).trigger('change');
						}

						this.show = function () {
							// insert global div
							if ($('#w2ui-global-items').length == 0) {
								$('body').append('<div id="w2ui-global-items" class="w2ui-reset w2ui-items"></div>');
							} else {
								// ignore second click
								return;	
							}
							var div = $('#w2ui-global-items');
							div.css({
									display : 'block',
									left 	: ($(obj).offset().left) + 'px',
									top 	: ($(obj).offset().top + obj.offsetHeight) + 'px'
								})
								.width(w2utils.getSize(obj, 'width'))
								.data('position', ($(obj).offset().left) + 'x' + ($(obj).offset().top + obj.offsetHeight));

							// show drop content
							w2field.list_render.call(obj);

							// monitors
							var monitor = function () { 
								var div = $('#w2ui-global-items');
								// monitor if destroyed
								if ($(obj).length == 0 || ($(obj).offset().left == 0 && $(obj).offset().top == 0)) {
									clearInterval($(obj).data('mtimer'));
									hide(); 
									return;
								}
								// monitor if moved
								if (div.data('position') != ($(obj).offset().left) + 'x' + ($(obj).offset().top  + obj.offsetHeight)) {
									div.css({
										'-webkit-transition': '.2s',
										left: ($(obj).offset().left) + 'px',
										top : ($(obj).offset().top + obj.offsetHeight) + 'px'
									})
									.data('position', ($(obj).offset().left) + 'x' + ($(obj).offset().top + obj.offsetHeight));
									// if moved then resize
									setTimeout(function () {
										w2field.list_render.call(obj, $(obj).data('last_search'));
									}, 200);
								}
								if (div.length > 0) $(obj).data('mtimer', setTimeout(monitor, 100));
							};
							$(obj).data('mtimer', setTimeout(monitor, 100));
						}						

						this.hide = function () {
							clearTimeout($(obj).data('mtimer'));
							$('#w2ui-global-items').remove();
						}

						// render controls with all items in it
						this.refresh = function () {
							var obj = this;
							// remove all items
							$($(this).data('selected-div')).remove();
							// rebuild it
							var margin = 'margin-top: ' + $(this).css('margin-top') + '; ' +
										 'margin-bottom: ' + $(this).css('margin-bottom') + '; ' +
										 'margin-left: ' + $(this).css('margin-left') + '; ' +
										 'margin-right: ' + $(this).css('margin-right') + '; '+
										 'width: ' + (w2utils.getSize(this, 'width') 
										 		   - parseInt($(this).css('margin-left')) 
										 		   - parseInt($(this).css('margin-right'))) + 'px; ';
							var html = '<div class="w2ui-list" style="'+ margin + ';">'+
									   '<ul>';
							var selected = $(this).data('selected');
							for (var s in selected) {
								html += '<li style="'+ ($(this).data('last_del') == s ? 'opacity: 0.5' : '') +'">'+
										'<div title="'+ w2utils.lang('Remove') +'" index="'+ s +'">&nbsp;&nbsp;</div>'+
										selected[s].text +
										'</li>';
							}
							html += '<li><input type="text"></li>';
							html += '</ul></div>';
							$(this).before(html);
							// adjust height
							var div = $(this).prev();
							$(this).data('selected-div', div);
							var cntHeight = w2utils.getSize(div, 'height')
								- parseInt($(div).css('margin-top')) 
								- parseInt($(div).css('margin-bottom'));
							if (cntHeight < 23) cntHeight = 23;
							if (cntHeight > settings.maxHeight) cntHeight = settings.maxHeight;
							$(div).height(cntHeight);
							if (div.length > 0) div[0].scrollTop = 1000;
							$(this).height(cntHeight);

							$(div).on('click', function (event) {
								var el = event.target;
								if (el.title == w2utils.lang('Remove')) {
									$(obj).data('selected').splice($(el).attr('index'), 1);
									$(el.parentNode).remove();
									obj.refresh(); 
									w2field.list_render.call(obj);
									$(obj).trigger('change');
									if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;
								}
								$(this).find('input').focus();
							});
							$(div).find('input')
								.on('focus', function (event) {
									$(div).css({ 'outline': 'auto 5px -webkit-focus-ring-color', 'outline-offset': '-2px' });
									obj.show();
									if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;
								})
								.on('blur', function (event) {
									$(div).css('outline', 'none');
									obj.hide();
									if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;
								});
						}
						// init control
						$(this).data('settings', settings).attr('tabindex', -1);
						this.refresh();
						break;

					case 'upload':
						if (this.tagName != 'DIV') {
							// rebuild it
							var margin = 'margin-top: ' + $(this).css('margin-top') + '; ' +
										 'margin-bottom: ' + $(this).css('margin-bottom') + '; ' +
										 'margin-left: ' + $(this).css('margin-left') + '; ' +
										 'margin-right: ' + $(this).css('margin-right') + '; '+
										 'width: ' + (w2utils.getSize(this, 'width') 
										 		   - parseInt($(this).css('margin-left')) 
										 		   - parseInt($(this).css('margin-right'))) + 'px; ';
							var html = '<div style="'+ margin + ';"></div>';
							$(this).css('display', 'none').before(html);
							$(this).data('div', $(this).prev());
							$(this).prev().w2field(options);
							return;
						}
						var defaults = {
							url			: '',
							onProgress	: null,
							onComplete	: null
						}
						var obj	= this;
						var settings = $.extend({}, defaults, options);

						$(this).data('settings', settings); 
						$(this).css({ 'border-color': 'transparent' });

						w2field.upload_init.call(this);
						break;

					default: 
						console.log('Error w2field does not recognize "'+ options.type + '" field type.');
						break;
				}
			});
		},
		
		// ******************************************************
		// -- Implementation

		addType: function (type, handler) {
			w2field.customTypes[type] = handler;
		},

		cleanItems: function (items) {
			var newItems = [];
			for (var i in items) {
				var id   = '';
				var text = '';
				var opt  = items[i];
				if (opt == null) continue;
				if ($.isPlainObject(items)) {
					id 	 = i;
					text = opt;
				} else {
					if (typeof opt == 'string') {
						if (String(opt) == '') continue;
						id   = opt;
						text = opt;
					}
					if (typeof opt == 'object') {
					 	if (typeof opt.id != 'undefined')    id = opt.id;
						if (typeof opt.value != 'undefined') id = opt.value;
						if (typeof opt.txt != 'undefined')   text = opt.txt;
						if (typeof opt.text != 'undefined')  text = opt.text;
					}
				}
				if (w2utils.isInt(id)) id = parseInt(id);
				if (w2utils.isFloat(id)) id = parseFloat(id);
				newItems.push({ id: id, text: text });
			}
			return newItems;
		},

		// ******************************************************
		// -- Upload

		upload_init: function () {
			var obj = this;
			// inset controls
			$(obj)
				.addClass('w2ui-upload')
				.append('<span>'+ w2utils.lang('Attach files by dragging and dropping or Click to Select') +'</span>')
				.append('<ul class="file-list"></ul>')
				.append('<input class="file-input" type="file" name="attachment" multiple style="display: none">');

			// if user selects files through input control
			$(obj).find('.file-input').on('change', function () {
				if (typeof this.files !== "undefined") {
					for (var i = 0, l = this.files.length; i < l; i++) {
						w2field.upload_add.call(obj, this.files[i]);
					}
				}
			});

			// if user clicks drop zone
			$(obj)
				.on('click', function (event) {
					if (event.target.tagName == 'LI' || $(event.target).hasClass('file-size')) {
						return;
					}
					if ($(event.target).hasClass('file-delete')) {
						$(event.target.parentNode).remove();
						return;
					}
					$(obj).find('.file-input')[0].click();
				})
				.on('dragenter', function (event) {
					$(obj).addClass('dragover');
				})
				.on('dragleave', function (event) {
					$(obj).removeClass('dragover');
				})
				.on('drop', function (event) {
					$(obj).removeClass('dragover');
					var files = event.originalEvent.dataTransfer.files;
					for (var i=0, l=files.length; i<l; i++) w2field.upload_add.call(obj, files[i]);
					// cancel to stop browser behaviour
					event.preventDefault();
					event.stopPropagation();
				})
				.on('dragover', function (event) { 
					// cancel to stop browser behaviour
					event.preventDefault();
					event.stopPropagation();
				});
		},

		upload_add: function (file) {
			// add li element
			var cnt = $(this).find('.file-list li').length;
			$(this).find('> span:first-child').remove();
			$(this).find('.file-list').append('<li id="file-' + cnt + '">' + 
				'	<div class="file-delete">&nbsp;&nbsp;</div>' + 
				'	<span class="file-name">' + file.name + '</span>' +
				'	<span class="file-size"> - ' + w2utils.size(file.size) + '</span>'+
				'</li>');
			var li = $(this).find('.file-list #file-' + cnt);
			var previewHTML = "";
			if ((/image/i).test(file.type)) { // image
				previewHTML = '<div style="padding: 2px;">'+
					'	<img src="##FILE##" onload="var w = $(this).width(); var h = $(this).height(); '+
					'		if (w < 300 & h < 300) return; '+
					'		if (w > h && w > 300) $(this).width(300); else $(this).height(300);">'+
					'</div>';
			}
			var td1 = 'style="padding: 3px; text-align: right; color: #777;"';
			var td2 = 'style="padding: 3px"';
			previewHTML += '<div style="padding: 5px;">'+
				'	<table cellpadding="2">'+
				'	<tr><td '+ td1 +'>Name:</td><td '+ td2 +'>'+ file.name +'</td></tr>'+
				'	<tr><td '+ td1 +'>Size:</td><td '+ td2 +'>'+ w2utils.size(file.size) +'</td></tr>'+
				'	<tr><td '+ td1 +'>Type:</td><td '+ td2 +'>' +
				'		<span style="width: 200px; display: block-inline; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">'+ file.type +'</span>'+
				'	</td></tr>'+
				'	<tr><td '+ td1 +'>Modified:</td><td '+ td2 +'>'+ w2utils.date(file.lastModifiedDate) +'</td></tr>'+
				'	</table>'+
				'</div>';
			li.data('file', file)
				.on('mouseover', function () {
					$(this).w2overlay(
						//previewHTML.replace('##FILE##', $(this).data('fileType') + ',' + $(this).data('fileContents')),
						previewHTML.replace('##FILE##', $(this).data('fileContents')),
						{ top: -4 }
					);
				})
				.on('mouseout', function () {
					$(this).w2overlay();
				});

			// read file as base64
			if (typeof FileReader !== "undefined") {
				var reader = new FileReader();
				// need a closure
				reader.onload = (function (li) {
					return function (event) {
						// var fl  = event.target.result;
						// var ind = fl.indexOf(',');
						// li.data('fileType', fl.substr(0, ind));
						// li.data('fileContents', fl.substr(ind+1));
						li.data('fileContents', event.target.result);
					};
				})(li);
				reader.readAsDataURL(file);
			}
		},

		// ******************************************************
		// -- Enum

		list_render: function (search) {
			var obj 	 = this;
			var div 	 = $('#w2ui-global-items');
			var settings = $(this).data('settings');
			var items 	 = settings.items;
			var selected = $(this).data('selected');
			if (div.length == 0) return; // if it is hidden

			// build overall html
			if (typeof search == 'undefined') {
				var html 	 = '';
				html += '<div class="w2ui-items-list"></div>';						
				div.html(html);
				search = '';
			}
			$(this).data('last_search', search);
			if (typeof $(obj).data('last_index') == 'undefined' || $(obj).data('last_index') == null) $(obj).data('last_index', 0);

			// pull items from url
			if (typeof settings.last_total == 'undefined') settings.last_total = -1;
			if (typeof settings.last_search_len == 'undefined') settings.last_search_len = 0;
			if (typeof settings.last_search_match == 'undefined') settings.last_search_match = -1;
			if (settings.url != '' && ( 
					   (items.length == 0 && settings.last_total != 0) 
					|| (search.length > settings.last_search_len && settings.last_total > settings.maxCache)
					|| (search.length < settings.last_search_match && search.length != settings.last_search_len)
				)
			) {
				var match = false;
				if (settings.last_total < settings.maxCache) match = true;
				$.ajax({
					type 		: 'GET',
					dataType	: 'text',
					url 		: settings.url,
					data : {
						search 	: search,
						max 	: settings.maxCache
					},
					complete: function (xhr, status) {
						settings.last_total = 0;
						if (status == 'success') {
							var data = $.parseJSON(xhr.responseText);
							if (match == false && data.total < settings.maxCache) { settings.last_search_match = search.length; }
							settings.last_search_len = search.length;
							settings.last_total = data.total
							settings.items      = data.items;
							w2field.list_render.call(obj, search);
						}
					}
				});
			}
			
			// build items
			var i = 0;
			var ihtml = '<ul>';
			// get ids of all selected items
			var ids	  = [];
			for (var a in selected) ids.push(w2utils.isInt(selected[a].id) ? parseInt(selected[a].id) : String(selected[a].id))
			// build list
			for (var a in items) {
				var id  = items[a].id;
				var txt = items[a].text;
				// if already selected
				if ($.inArray(w2utils.isInt(id) ? parseInt(id) : String(id), ids) != -1 && settings.showAll !== true) continue;
				// check match with search
				var txt1 = String(search).toLowerCase();
				var txt2 = txt.toLowerCase();
				if (txt1.length <= txt2.length && txt2.substr(0, txt1.length) == txt1) {
					if (typeof settings['render'] == 'function') {
						txt = settings['render'](items[a]);
					}
					ihtml += '\n<li index="'+ a +'" value="'+ id +'" '+
							 '  onmouseover="$(this).parent().find(\'li\').removeClass(\'selected\'); $(this).addClass(\'selected\'); "'+
							 '	class="'+ (i % 2 ? 'w2ui-item-even' : 'w2ui-item-odd') + (i == $(obj).data('last_index') ? " selected" : "") +'">'+ 
							 txt +'</li>';
					if (i == $(obj).data('last_index')) $(obj).data('last_item', items[a]);
					i++;
				}
			}
			ihtml += '</ul>';
			if (i == 0) { 
				ihtml   = '<div class="w2ui-empty-list">'+ w2utils.lang('No items found') +'</div>';
				var noItems = true;
			}
			div.find('.w2ui-items-list').html(ihtml);
			$(this).data('last_max', i-1);	

			// scroll selected into view
			if (div.find('li.selected').length > 0) div.find('li.selected')[0].scrollIntoView(false);

			// if menu goes off screen - add scrollbar
			div.css({ '-webkit-transition': '0s', height : 'auto' }); 
			var max_height = parseInt($(document).height()) - parseInt(div.offset().top) - 8;
			if (parseInt(div.height()) > max_height) {
				div.css({ 
					height 	: (max_height - 5) + 'px', 
					overflow: 'show' 
				});
				$(div).find('.w2ui-items-list').css({
					height 	: (max_height - 15) + 'px', 
					overflow: 'auto' 
				});
			}

			// add events
			$(div)
				.off('mousedown')
				.on('mousedown', function (event) {
					var id 	 = $(event.target).attr('index');
					var item = settings.items[id];
					if (typeof id == 'undefined') { if (event.preventDefault) event.preventDefault(); else return false; }
					obj.add(item);
					$(obj).data('last_index', 0);
					obj.refresh();
					w2field.list_render.call(obj, '');
				}
			);
			$(obj).prev().find('li > input')
				.val(search)
				.css('max-width', ($(div).width() - 25) + 'px')
				.width(((search.length + 2) * 6) + 'px')
				.focus()
				.on('click', function (event) {
					if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;
				})
				.off('keyup')
				.on('keyup', function (event) {
					var inp = this;
					setTimeout(function () { 
						var curr = $(obj).data('last_index');						
						switch (event.keyCode) {
							case 38: // up
								curr--;
								if (curr < 0) curr = 0;
								$(obj).data('last_index', curr);
								if (event.preventDefault) event.preventDefault();
								break;
							case 40: // down
								curr++;
								if (curr > $(obj).data('last_max')) curr = $(obj).data('last_max');
								$(obj).data('last_index', curr);
								if (event.preventDefault) event.preventDefault(); 
								break;
							case 13: // enter
								if (typeof $(obj).data('last_item') == 'undefined' || $(obj).data('last_item') == null || noItems === true) break;
								var selected = $(obj).data('selected'); 
								obj.add($(obj).data('last_item'));
								// select next
								if (curr > $(obj).data('last_max') - 1) curr = $(obj).data('last_max')-1;
								$(obj).data('last_index', curr);
								$(obj).data('last_item', null);
								// refrech
								$(inp).val('');
								obj.refresh();
								if (event.preventDefault) event.preventDefault();
								break;
							case 8: // backspace
								if (String(inp.value) == '') {
									if (typeof $(obj).data('last_del') == 'undefined' || $(obj).data('last_del') == null) {
										// mark for deletion
										var selected = $(obj).data('selected'); 
										if (!$.isArray(selected)) selected = [];
										$(obj).data('last_del', selected.length-1);
										// refrech
										obj.refresh();
									} else {
										// delete marked one
										var selected = $(obj).data('selected'); 
										if (!$.isArray(selected)) selected = [];
										if (selected.length > 0) {
											selected.splice(selected.length-1, 1);
										}
										$(obj).data('selected', selected);
										$(obj).data('last_del', null);
										// refrech
										obj.refresh();
										$(obj).trigger('change');
									}
								}
								break;
							default: 
								$(obj).data('last_index', 0);
								$(obj).data('last_del', null);
								break;
						}
						// adjust height
						var div = $(obj).prev();
						div.css('height', 'auto');
						var cntHeight = w2utils.getSize(div, 'height')
							- parseInt($(div).css('margin-top')) 
							- parseInt($(div).css('margin-bottom'));
						if (cntHeight < 23) cntHeight = 23;
						if (cntHeight > settings.maxHeight) cntHeight = settings.maxHeight;
						$(div).height(cntHeight);
						if (div.length > 0) div[0].scrollTop = 1000;
						$(obj).height(cntHeight);
						// refresh menu
						if (!(event.keyCode == 8 && String(inp.value) == '')) { 
							$(obj).prev().find('li').css('opacity', '1');
							$(obj).data('last_del', null);
						}
						if ($.inArray(event.keyCode, [16,91,37,39]) == -1) { // command and shift keys and arrows
							w2field.list_render.call(obj, inp.value); 
						}
					}, 10);
				})
		},
		
		// ******************************************************
		// -- Calendar
		
		calendar_get: function (date, options) {
			var td = new Date();
			var today = (Number(td.getMonth())+1) + '/' + td.getDate() + '/' + (String(td.getYear()).length > 3 ? td.getYear() : td.getYear() + 1900);
			if (String(date) == '' || String(date) == 'undefined') date = w2utils.formatDate(today, options.format); 
			if (!w2utils.isDate(date, options.format)) date = w2utils.formatDate(today, options.format);
			
			if (options.format.toLowerCase() == 'dd/mm/yyyy' || options.format.toLowerCase() == 'dd-mm-yyyy' 
					|| options.format.toLowerCase() == 'dd.mm.yyyy') {
				var tmp = date.replace(/-/g, '/').replace(/\./g, '/').split('/');
				var dt  = new Date(tmp[2] + '-' + tmp[1] + '-' + tmp[0]);
			} else {				
				var dt = new Date(date);
			}
			var html =  '<table cellpadding="0" cellspacing="0"><tr>' +
						'<td>'+ $().w2field('calendar_month', (dt.getMonth() + 1), dt.getFullYear(), options) +'</td>'+
						// '<!--td valign="top" style="background-color: #f4f4fe; padding: 8px; padding-bottom: 0px; padding-top: 22px; border: 1px solid silver; border-left: 0px;">'+
						// '	Jan <br> Feb <br> Mar <br> Apr <br> May <br> Jun <br> Jul <br> Aug <br> Sep <br> Oct <br> Nov <br> Dec'+
						// '</td>'+
						// '<td valign="top" style="background-color: #f4f4fe; padding: 6px; padding-bottom: 0px; padding-top: 22px; border: 1px solid silver; border-left: 0px;">'+
						// '	2001 <br> 2002 <br> 2003 <br> 2004'+
						// '</td-->'+
						'</tr></table>';
			return html;
		},
		
		calendar_next: function(month_year) {
			var tmp = String(month_year).split('/');
			var month = tmp[0];
			var year  = tmp[1];
			if (parseInt(month) < 12) {
				month = parseInt(month) + 1;
			} else {
				month = 1;
				year  = parseInt(year) + 1;
			}
			var options = $($('#global_calendar_div.w2ui-calendar').data('el')).data('options');
			$('#global_calendar_div.w2ui-calendar').html( $().w2field('calendar_get', w2utils.formatDate(month+'/1/'+year, options.format), options) );
		},
		
		calendar_previous: function(month_year) {
			var tmp = String(month_year).split('/');
			var month = tmp[0];
			var year  = tmp[1];
			if (parseInt(month) > 1) {
				month = parseInt(month) - 1;
			} else {
				month = 12;
				year  = parseInt(year) - 1;
			}
			var options = $($('#global_calendar_div.w2ui-calendar').data('el')).data('options');
			$('#global_calendar_div.w2ui-calendar').html( $().w2field('calendar_get', w2utils.formatDate(month+'/1/'+year, options.format), options) );
		},
		
		calendar_month: function(month, year, options) {
			var td = new Date();
			var months 		= w2utils.settings.fullmonths;
			var days  		= w2utils.settings.fulldays;
			var daysCount   = ['31', '28', '31', '30', '31', '30', '31', '31', '30', '31', '30', '31'];
			var today		= (Number(td.getMonth())+1) + '/' + td.getDate() + '/' + (String(td.getYear()).length > 3 ? td.getYear() : td.getYear() + 1900);
			
			year  = Number(year);
			month = Number(month);
			if (year  === null || year  === '') year  = String(td.getYear()).length > 3 ? td.getYear() : td.getYear() + 1900;
			if (month === null || month === '') month = Number(td.getMonth())+1;
			if (month > 12) { month = month - 12; year++; }
			if (month < 1 || month == 0)  { month = month + 12; year--; }
			if (year/4 == Math.floor(year/4)) { daysCount[1] = '29'; } else { daysCount[1] = '28'; }
			if (year  == null) { year  = td.getYear(); }
			if (month == null) { month = td.getMonth()-1; }
			
			// start with the required date
			var td = new Date();
			td.setDate(1);
			td.setMonth(month-1);
			td.setYear(year);
			var weekDay = td.getDay();
			var tabDays = w2utils.settings.shortdays;
                        var dayTitle = '';
                        for ( var i = 0, len = tabDays.length; i < len; i++) {
                            dayTitle += '<td>' + tabDays[i] + '</td>'; 
                        }
			var html  = 
				'<div class="w2ui-calendar-title">'+
				'	<div class="w2ui-calendar-previous" onclick="$().w2field(\'calendar_previous\', \''+ month +'/'+ year +'\')"> <- </div>'+
				'	<div class="w2ui-calendar-next" onclick="$().w2field(\'calendar_next\', \''+ month +'/'+ year +'\')"> -> </div> '+ 
						months[month-1] +', '+ year + 
				'</div>'+
				'<table class="w2ui-calendar-days" onclick="" cellspacing="0">'+
				'	<tr class="w2ui-day-title">' + dayTitle + '</tr>'+
				'	<tr>';
					
			var day = 1;
			for (var ci=1; ci<43; ci++) {
				if (weekDay == 0 && ci == 1) {
					for (var ti=0; ti<6; ti++) html += '<td class="w2ui-day-empty">&nbsp;</td>';
					ci += 6;
				} else {
					if (ci < weekDay || day > daysCount[month-1]) {
						html += '<td class="w2ui-day-empty">&nbsp;</td>';
						if ((ci)%7 == 0) html += '</tr><tr>';
						continue;
					}
				}
				var dt  = month + '/' + day + '/' + year;
				
				var className = ''; 
				if (ci % 7 == 6) className = 'w2ui-saturday';
				if (ci % 7 == 0) className = 'w2ui-sunday';
				if (dt == today) className += ' w2ui-today';
				
				var dspDay 	= day;			
				var col 	= '';
				var bgcol 	= '';
				var blocked = '';
				if (options.colored) if (options.colored[dt] != undefined) { // if there is predefined colors for dates
					tmp   = options.colored[dt].split(':');
					bgcol = 'background-color: ' + tmp[0] + ';';
					col   = 'color: ' + tmp[1] + ';';
				}
				var noSelect = false;
				// enable range 
				if (options.start || options.end) {
					var start 	= new Date(options.start);
					var end   	= new Date(options.end);
					var current = new Date(dt);
					if (current < start || current > end) {
						blocked  = ' w2ui-blocked-date';
						noSelect = true;
					} 
				}
				// block predefined dates
				if (options.blocked && $.inArray(dt, options.blocked) != -1) {
					blocked  = ' w2ui-blocked-date';
					noSelect = true;
				} 
				html += '<td class="'+ className + blocked +'" style="'+ col + bgcol + '" id="'+ this.name +'_date_'+ dt +'" date="'+ dt +'"';
				if (noSelect === false) {
					html += 'onclick="var el = $(\'#global_calendar_div.w2ui-calendar\').data(\'el\'); '+
							'	$(el).val(\''+ w2utils.formatDate(dt, options.format) +'\').trigger(\'change\').trigger(\'blur\'); '+
							'	 if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;'+
							'	 if (event.preventDefault) event.preventDefault(); else return false;'+
							'"';
				}

				html +=	'>'+ dspDay + '</td>';
				if (ci % 7 == 0 || (weekDay == 0 && ci == 1)) html += '</tr><tr>';
				day++;
			}
			html += '</tr></table>';
			return html;
		}
	});

	w2obj.w2field = w2field;

}) (jQuery);
