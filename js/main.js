

(function($) {
	$(document).ready(function(){
	jQuery.fn.center = function () {
		this.css("position","absolute");
		this.css("top", Math.max(0, (($(window).height() - $(this).outerHeight()) / 2) + 
																						$(window).scrollTop()) + "px");
		this.css("left", Math.max(0, (($(window).width() - $(this).outerWidth()) / 2) + 
																						$(window).scrollLeft()) + "px");
		return this;
	}
		var interfaces = {
			derpiboo: {
				url: 'http://derpibooru.org',
				urlencodings: 1,
				posturl: '/',
				image_prefix: 'http:',
				endpoints: {
					index: {
						page: '/images.json',
						pageArg: 'page',
					},
					search: {
						page: '/search.json',
						pageArg: 'page',
						queryArg: 'q'
					}
				},
				postAttributes: {
					image: {
						url: 'image',
						id: 'id_number'
					}
				}
			},
		};
		var settings = {
			interface: interfaces.derpiboo,
			height: $(window).height(),
			width: $(window).width(),
			tagsID: '#tags',
			commentsID: '#comments',
			statusID: '#status',
			mainID: '#main', // main div to opreate in
			preloadID: '#others', // pre load images into this div
			ImgInfoID: '#imageinfo',
			preload: 20, // number of images to preload
			preloadMeta: 3, // number of pages of meta date to load
			backgroundColor: '#000',
			imagesPerPage: 15,
			strings: {
				no_comments: 'Nopony has made comments. :(',
				days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
				page: 'Page',
				link: 'Link:', 
				number_of_comments: '# of Comments',
				image_id: 'Image Id',
				image: 'Image',
				tags: 'Tags',
				uploader: 'Uploaded by:',
				description: 'Description:',
				created_at: 'Created:',
				updated_at: 'Updated:',
				upvotes: 'Upvotes:',
				downvotes: 'Downvotes:',
				source_url: 'Source:',
				score: 'Score:',
				comment_count: 'Comments:',
				license: 'License:'
			}
		};
		function updateDimentions(obj) {
			obj.height = $(window).height();
			obj.width = $(window).width();
		}

		function eventChainer (el, event, listener) {
			var _arguments = arguments;
			var _self = this;
			console.log(el[event]);
			if (el[event] != null) {
				var old = el[event];
				el[event] = function () {
					listener.apply(_self, _arguments);
					old.apply(_self, _arguments);;
				}
			}
			else {
				el[event] = function () {
					listener.apply(_self, _arguments);
				}
			}
		}

		var OrderedSet = function () {
			this.list = [];
			this.pointer = 0;
			this.needsSorting = true;
			this.add = function (id) {
				this.list.push(id);
				this.needsSorting = true;
			}
			this.setPointer = function (id) {
				for (var i = this.list.length - 1; i >= 0; i--) {
					if (id == this.list[i]) {
						this.pointer = i;
						return true;
					}
				};
				return false;
			}
			this.sort = function () {
				return;
				if (this.needsSorting) {
					this.list = this.list.sort(function(a,b) {
						if (a < b) {
							return 1;
						}
						else if (a > b) { 
							return -1;
						}
						return 0;
					});
					this.needsSorting = false;
				}
			}
			this.getPointer = function () {
				this.sort();
				return this.pointer;
			}
			this.current = function () {
				this.sort();
				return this.list[this.pointer];
			}
			this.get = function (index) {
				if (index < 0 || index > this.list.length - 1) {
					return false;
				}
				this.sort();
				return this.list[index];
			}
			this.next = function () {
				if (this.pointer < this.list.length - 1) {
					this.pointer++;
					return true;
				}
				return false;
			}
			this.prev = function () {
				if (this.pointer > 0) {
					this.pointer--;
					return true;
				}
				return false;
			}
			this.length = function () {
				return this.list.length;
			}
			this.clear = function () {
				this.list = [];
				this.pointer = 0;
			}
		};

		var cache = {
			data: {},
			ids: new OrderedSet(),
			get: function (id) {
				if (typeof this.data[id] !== 'undefined') {
					return this.data[id];
				}
				else {
					return 0;
				}
			},
			set: function (id, data) {
				if (typeof this.data[id] == 'undefined') {
					this.ids.add(id);
				}
				this.data[id] = data;
			},
			length: function () {
				return this.ids.length();
			},
			getCurrent: function () {
				return this.get(this.ids.current());
			},
			clear: function () {
				this.data = {};
				this.ids.clear();
			}
		};

		var PageRequest = function(parent, page, endPoint) {
			if (typeof page == 'undefined') {
				page = 0;
			} 

			this.parent = parent;
			this.page = page;
			this.endPoint = endPoint;
			this.status = 'pennding';
			this.getPosts = function(url) {

				var url = 'CrossDomain.php?url=' + encodeURIComponent(url);

				$.ajax({
					dataType: "json",
					url: url,
					success: this.readPosts,
					complete: this.complete
			});
			}
			this.complete = function (jqXHR, textStatus) {
				this.status = textStatus;
			}
			this.complete = this.complete.bind(this);
			this.readPosts = function (data) {
				if (typeof data.images != 'undefined') {
					data = data.images; // updated api
				}
				
				if (data.length == 0) {
					console.log('No Posts');
				}
				else {
					console.log('new posts');
				}
				for (var i = 0; i < data.length; i++) {

					cache.set(data[i][settings.interface.postAttributes.image.id], data[i]);
				};
				if (this.parent.current == null) {
					this.parent.updateMainImage(data.shift());
					this.parent.status.updateImageNum(1, data.length);
					this.parent.preloader.load();
				}
				
				this.parent.status.updatePageNum(this.page, 'idk');
				//console.log(cache);
			}
			this.readPosts = this.readPosts.bind(this);
			this.send = function (method) {
				console.log('Requesting new posts');
				this.getPosts(this.endPoint.getURL(method, this.page));
			}
		}

		var Status = function (parent, statusID) {
			this.parent = parent;
			this.statusID = statusID;
			this.curPage = 0;
			this.maxPages = 0;
			this.curImage = 0;
			this.maxImages = 0;
			this.imageID = 0;
			this.comment_count = 0;
			this.tags = '';
			this.enabled = false;
			this.el = $(statusID);
			this.updatePageNum = function(cur, max) {
				this.curPage = cur;
				this.maxPages = max;
				this.draw();
			}
			this.updateImageNum = function(cur, max) {
				this.curImage = cur;
				this.maxImages = max;
				this.draw();
			}
			this.updateImageID = function(id) {
				this.imageID = id;
				this.draw();
			}
			this.updateCommentNum = function (count) {
				this.comment_count = count;
				this.draw();
			}
			this.updateTags = function (tags) {
				this.tags = tags;
				this.draw();
			}
			this.draw = function () {
				if (!this.enabled) return; 
				str = settings.strings;
				this.el.html(
				str.page + ' ' + this.curPage + '/' + this.maxPages
				+ '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
				+ str.image + ' ' + this.curImage + '/' + this.maxImages
				+ '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
				+ str.number_of_comments + ' ' + this.comment_count
				+ '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
				+ str.image_id + ' ' + this.imageID	
				+ '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
				+ str.link + ' <a href="' + settings.interface.url + settings.interface.posturl + this.imageID + '" >' + settings.interface.url + settings.interface.posturl + this.imageID + '</a>'
				+ '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
				+ str.tags + ' <span class="tags">' + this.tags + '</span>'
				);
			}
			this.toggle = function () {
				if (this.enabled) {
					this.el.addClass('visuallyhidden');
					this.enabled = false;
				}
				else {
					this.enabled = true;
					this.draw();
					this.el.removeClass('visuallyhidden');
				}
			}
		}

		var ImgInfo = function (parent, imginfoID) {
			this.parent = parent;
			this.imginfoID = imginfoID;
			this.el = $(this.imginfoID);
			this.enabled = false;
		this.toggle = function () {
			if (this.enabled) {
				this.el.addClass('visuallyhidden');
				this.enabled = false;
			}
			else {
				if (this.parent.current != null) {
					this.update(this.parent.current);
				}
				this.el.removeClass('visuallyhidden');
				this.enabled = true;
			}
		}
			this.update = function (img) {
				console.log(img);
				this.el.html(
					'<span class="label">' + settings.strings.uploader + '</span>' + img.uploader + '<br />'
					+ '<span class="label">' + settings.strings.description + '</span>' + img.description + '<br />' 
					+ '<span class="label">' + settings.strings.created_at + '</span>' + new DateFormater(img.created_at).format('g:i l Y') + '<br />' 
					+ '<span class="label">' + settings.strings.updated_at + '</span>' + new DateFormater(img.updated_at).format('g:i l Y') + '<br />' 
					+ '<span class="label">' + settings.strings.license + '</span>' + img.license + '<br />' 
					+ '<span class="label">' + settings.strings.score + '</span>' + img.score + '<br />' 
					+ '<span class="label">' + settings.strings.upvotes + '</span>' + img.upvotes + '<br />' 
					+ '<span class="label">' + settings.strings.downvotes + '</span>' + img.downvotes + '<br />' 
					+ '<span class="label">' + settings.strings.tags + '</span>' + img.tags + '<br />' 
					+ '<span class="label">' + settings.strings.comment_count + '</span>' + img.comment_count + '<br />' 
					+ '<span class="label">' + settings.strings.link + '</span>' + '<a href="' + settings.interface.url + settings.interface.posturl + img[settings.interface.postAttributes.image.id] + '" >' + settings.interface.url + settings.interface.posturl + img[settings.interface.postAttributes.image.id] + '</a>' + '<br />' 
					+ '<span class="label">' + settings.strings.source_url + '</span>' + '<a href="' + img.source_url + '" >' + img.source_url + '</a>' + '<br />'
				);
			}
		}

		var Endpoint = function (parent, interface) {
			this.parent = parent;
			this.interface = interface;
			this.getTags = function () {
				return this.parent.tags.val();
			}
			this.getURL = function (method, page) {
				var eps = this.interface.endpoints;
				var url = this.interface.url + eps[method].page;

				switch (method) {
					case 'search':
						url += '?' + eps[method].queryArg + '='
							+ this.getTags().replace(' ', encodeURIComponent('+'))
							+ '&' + eps[method].pageArg + '=' + page;
						break;
					case 'index':
						url += '?' + eps[method].pageArg + '=' + page;
						break;
				}
				return url;
			}
		}
		
	var PreLoader = function (parent, id, imageNum, pageNum) {
		this.parent = parent;
		this.containter = $(id);
		this.imageNum = imageNum;
		this.pageNum = pageNum;
		this.imgs = [];
		this.tracker = null;
		this.loadedlist = [];
		this.load = function () {
			this.imgs = [];
			var i = 1;
			var load_next = false;
			while (i <= this.imageNum) {
				var id = cache.ids.get(cache.ids.getPointer() + i);
				//console.log(id + ':' +cache.ids.getPointer() + '-' + i);
				if (id !== false) {
					var image = cache.get(id)[settings.interface.postAttributes.image.url];
					if (!this.hasLoaded(image)) {
						this.imgs.push(image);
						this.addToLoaded(image);
					}
				}
				else {
					load_next = true;
				}
				i++;
			}
			if (load_next || !cache.ids.get(cache.ids.getPointer() + (this.pageNum * settings.imagesPerPage))) {
				this.parent.nextPage();
			}
			//console.log(this.imgs);
			this.tracker = new Tracker(this.imgs, GetImage, this.updateDisplay);
			this.tracker.start();
		}
		this.addToLoaded = function (image) {
			if (this.loadedlist.length > this.imageNum * 2) {
				this.loadedlist.shift();
			}
			this.loadedlist.push(image);
		}
		this.hasLoaded = function (image) {
			for (var i = this.loadedlist.length - 1; i >= 0; i--) {
				if (this.loadedlist[i] === image) {
					return true;
				}
			}
			return false;
		}
		this.updateDisplay = function (items) {
			var imgs = [];
			for (var i = items.length - 1; i >= 0; i--) {
				imgs.push("<img src=\"" + items[i].data + "\" />");
			};
			this.containter.html(imgs.join(''));
		}
		this.updateDisplay = this.updateDisplay.bind(this);
	}
	var Tracker = function(list, command, finish) {
		this.list = list;
		this.listStatus = {};
		this.command = command;
		this.finish = finish;
		this.start = function() {
			//console.log(list);
			for (var i = 0; i < this.list.length; i++) {
				var item = this.list[i];
				this.listStatus[item] = {item:item, status:'start', data: null};
				var command_instance = new this.command(item);
				command_instance.setTracker(this);
				command_instance.run();
				//console.log(i);
			};
		}
		this.update = function (item, data, status) {
			this.listStatus[item].status = status;
			this.listStatus[item].data = data;
			this.listStatus[item].item = item;
			this.check();
		}
		this.update = this.update.bind(this);
		this.check = function () {
			var items = [];
			for (var item in this.listStatus) {
				if (this.listStatus[item].status === 'start') {
					return;
				}
				items.push(this.listStatus[item]);
			}
			this.finish(items);
		}
	}
	var GetImage = function(url) {
		this.tracker = null;
		this.img = null;
		this.status = 'pennding';
		this.callback = null;
		this.url = url;
		this.setCallback = function (callback) {
			this.callback = callback;
		}
		this.setTracker = function (tracker) {
			this.tracker = tracker;
		}
		this.run = function () {
			$.ajax({
					dataType: "json",
					url: this.proccessedURL,
					success: this.success,
					complete: this.complete
			});
		}
		this.urlPreproccess = function (url) {
			url = settings.interface.image_prefix + url;
			return 'CrossDomain.php?img=' + encodeURIComponent(url) + '&encodings=' + settings.interface.urlencodings;
		}
		this.proccessedURL = this.urlPreproccess(url);
		this.success = function(data) {
			console.log(data);
			if (this.tracker !== null) {
				this.tracker.update(this.url, data.img, true);
			}
			if (this.callback !== null) {
				this.callback(data);
			}
			this.img = data.img;
		}
		this.success = this.success.bind(this);
		this.complete = function (jqXHR, textStatus) {
			this.status = textStatus;
			if (textStatus !== 'success') {
				if (this.tracker !== null) {
					this.tracker.update(this.url, null, false);
				}
			}
		}
		this.complete = this.complete.bind(this);
	}

	var Comments = function (parent, commentsID) {
		this.parent = parent;
		this.commentsID = commentsID;
		this.el = $(commentsID);
		this.enabled = false;
		this.currentComments = null;
		this.toggle = function () {
			if (this.enabled) {
				this.el.addClass('visuallyhidden');
				this.enabled = false;
			}
			else {
				if (this.parent.current != null) {
					this.updateComments(this.parent.current);
				}
				this.el.removeClass('visuallyhidden');
				this.enabled = true;
			}
		}
		this.commentPreProccess = function(commentbody) {
			
			var re = /([\!\"]{1}.+[\!\"]{1})\:(\S+)/g; // linker
			while (true) {
				var ar = re.exec(commentbody);
				//console.log(ar);
				if (ar == null || ar[2].length < 5) break;
				var image = '<a href="' + ar[2] + '">' + ar[1] + '</a>';
				commentbody = commentbody.substring(0,ar.index) + image + commentbody.substring(ar.index + ar[1].length + ar[2].length + 1, commentbody.length);
			}

			var re = /\!([^\!\s]+)\!/g; //imager
			while (true) {
				var ar = re.exec(commentbody);
				//console.log(ar);
				if (ar == null || ar[1].length < 5) break;
				var image = '<img src="' + ar[1] + '" />';
				commentbody = commentbody.substring(0,ar.index) + image + commentbody.substring(ar.index + ar[1].length + 2, commentbody.length);
			}

			return commentbody;
		}
		this.updateComments = function(img) {
			var commentHTML = '';
			var days = settings.strings.days;
			if (img.comment_count > 0) {
				for (var i = img.comments.length - 1; i >= 0; i--) {
					var comment = img.comments[i];
					commentHTML += '<div class="comment"><span class="author">' + comment.author
					+ '</span><span class="date">' + new DateFormater(comment.posted_at).format('g:i l')
					+ '</span><br /><span class="body">' + this.commentPreProccess(comment.body)
					+ '</span></div>';
				};
			}
			else {
				commentHTML = "<h3>" + settings.strings.no_comments + "</h3>";
			}

			this.el.html(commentHTML);
		}
	}
	var Tags = function (parent, tagsID) {
		this.parent = parent;
		this.tagsID = tagsID;
		this.el = $(tagsID);
		this.input = $(this.el.find('input[type=textfield]')[0]);
		this.display = $(this.el.find('.current_tags')[0]);
		this.enabled = false;
		this.value = '';
		this.toggle = function () {
			if (this.enabled) {
				$('html').removeClass('tags'); 
				this.el.addClass('visuallyhidden');
				this.enabled = false;
				var _self = this;
				setTimeout(function(){_self.input.blur();}, 300);
			}
			else {
				$('html').addClass('tags');
				this.el.removeClass('visuallyhidden');
				this.enabled = true;
				var _self = this;
				setTimeout(function(){_self.input.focus();_self.input.select();}, 300);
			}
		}
		this.get = function () {
			this.blur();
			this.value = this.input.val();
			this.display.html(this.val());
			this.parent.status.updateTags(this.val());
		}
		this.blur = function () {
			this.input.blur();
		}
		this.val = function () {
			return this.value;
		}
		this.submit = function () {
			var oldtags = this.val();
			this.get();
			if (oldtags != this.val()) {
				parent.reset();
				parent.next();
			}
		}
	}

	var DateFormater = function (datestr) {
		this.date = new Date(datestr);
		this.days = settings.strings.days;
		this.format = function (format) {
			var formatedDate = '';
			for (var i = 0; i < format.length; i++) {
				switch (format[i]) {
					case 'l':
						formatedDate += this.days[this.date.getDay()];
						break;
					case 'g':
						var hours = String(this.date.getHours());
						if (hours.length == 1) {
							hours = '0' + hours;
						}
						formatedDate += hours;
						break;
					case 'G':
						formatedDate += this.date.getHours();
						break;
					case 'i':
						var minuntes = String(this.date.getMinutes());
						console.log(minuntes);
						if (minuntes.length == 1) {
							minuntes = '0' + minuntes;
						}
						formatedDate += minuntes;
						break;
					case 'Y':
						formatedDate += this.date.getFullYear();
						break;
					case 'y':
						var year = String(this.date.getFullYear());
						year = year.substr(2,2);
						formatedDate += year;
						break;
					default:
						formatedDate += format[i];
						break;
				}
			}
			return formatedDate;
		}
	}

	var Mane = function (settings) {
		this.page = 0;
		this.cache = cache;
		this.enabledColorChange = false;
		this.mainID = settings.mainID;
		this.el = $(this.mainID);
		this.imgEl = null;
		this.height = settings.height;
		this.width = settings.width;
		this.current = null;
		this.preloader = new PreLoader(this, settings.preloadID, settings.preload, settings.preloadMeta);
		this.status = new Status(this, settings.statusID);
		this.request = null;
		this.comments = new Comments(this, settings.commentsID);
		this.tags = new Tags(this, settings.tagsID);
		this.endPoint = new Endpoint(this, settings.interface);
		this.imgInfo = new ImgInfo(this, settings.ImgInfoID);
		this.updateMainImage = function (img) {
			if (typeof img == 'undefined') {
				console.log('None valid image passed to mane.updateMainImage');
				return;
			}

			this.status.updateImageID(img[settings.interface.postAttributes.image.id]);
			this.status.updateCommentNum(img.comment_count);
			if (this.comments.enabled) {
				this.comments.updateComments(img);
			}
			if (this.imgInfo.enabled) {
				this.imgInfo.update(img);
			}

			this.current = img;
			var imageGetter = new GetImage(img[settings.interface.postAttributes.image.url]);
			imageGetter.setCallback(this.drawMainImage);
			imageGetter.run();
		}
		this.drawMainImage = function(data) {
			var url = data.img;
			var img = this.current;

			var img_ratio = (img.width / img.height);
			var this_ratio = (this.width / this.height);

			if (img_ratio > this_ratio) {
				var img_width = Math.min(img.width, this.width);
				var img_height = img_width / img_ratio;
			}
			else {
				var img_height = Math.min(img.height, this.height);
				var img_width = img_height * img_ratio;
			}
			//console.log(this.width + ':' + this.height + '-' + (this.width / this.height));
			//console.log(img.width + ':' + img.height + '-' + (img.width / img.height));
			//console.log(img_width + ':' + img_height + '-' + (img_width / img_height));
			this.el.html("<span class=\"wapper\"><img width=\"" + img_width + "\" height=\"" + img_height + "\" src=\"" + url + "\" /></span>");
			// zome magic
			this.imgEl = $('img', this.el);
			if (this.enabledColorChange) {
				this.imgEl.load(function() {
					var bg_color = ColorThief.getDominantColor(this.imgEl);
					$('body').css('background-color', 'rgb(' + bg_color.join(',') + ')' );
				});
			}
		}
		this.drawMainImage = this.drawMainImage.bind(this);
		this.moveImage = function (dir, increment) {
			this.imgEl.css('margin-' + dir, parseInt(this.imgEl.css('margin-' + dir).replace(/[^-\d\.]/g, '')) + increment + 'px');
		}
		this.moveImageUP = function () {
			this.moveImage('top', -25);
		}
		this.moveImageDown = function () {
			this.moveImage('top', +25);
		}
		this.moveImageLeft = function () {
			this.moveImage('left', -25);
		}
		this.moveImageRight = function () {
			this.moveImage('left', +25);
		}
		this.zoomIn = function () {
			this.zoom('in', 10);
		}
		this.zoomOut = function () {
			this.zoom('out', 10);
		}
		this.zoom = function (dir, percent) {
			if (this.current === null) { return false; }

			var width = this.imgEl.width();

			if(dir == 'in') {
				var new_width = width + (width / percent);
			}
			else if (dir == 'out') {
				var new_width = width - (width / percent);
			}
			else {
				//zoom has no dir
				return false;
			}

			this.imgEl.width(new_width);
			this.imgEl.height(new_width / (this.current.width / this.current.height));
			return true;
		}
		this.toggleComments = function() {
			this.comments.toggle();
		}
		this.toggleStatus = function() {
			this.status.toggle();
		}
		this.toggleTags = function() {
			this.tags.toggle();
		}
		this.toggleInfo = function () {
			this.imgInfo.toggle();
		}
		this.toggleBackgroundColor = function() {
			if (this.enabledColorChange) {
				$('body').css('background-color', settings.backgroundColor);
			}
			this.enabledColorChange = !this.enabledColorChange;
		}
		this.next = function () {
			if (cache.ids.next()) {
				this.updateMainImage(cache.getCurrent());
				this.preloader.load();
				this.status.updateImageNum(cache.ids.getPointer() + 1, cache.length());
			}
			else {
				this.nextPage();
			}
		}
		this.prev = function () {
			if (cache.ids.prev()) {
				this.updateMainImage(cache.getCurrent());
				this.status.updateImageNum(cache.ids.getPointer() + 1, cache.length());
			}
			else {
				this.prevPage();
			}
		}
		this.getPage = function () {
			if (this.request != null && this.request.status == 'pennding') {
				return false;
			}
			var method = 'index';
			if (this.tags.val() != '') {
				method = 'search';
			}
			this.request = new PageRequest(this, this.page, this.endPoint);
			this.request.send(method);
			return true;
		}
		this.nextPage = function () {
			this.page++;
			if (this.getPage()) {
				return true;
			}
			else {
				this.page--;
				return false
			}
		}
		this.prevPage = function () {
			if (this.page > 0) {
				this.page--;
				this.getPage();
				return true;
			}
			return false;
		}
		this.reset = function () {
			cache.clear();
			this.current = null;
			this.request = null;
			this.page = 0;
		}
	}
	
	var keyMapper = function () {
		this.mappings = {};
		this.addMapping = function (mapping) {
			if (mapping.length > 2) {
				mapping[1] = mapping[1][mapping[2]].bind(mapping[1]);
			}
			if (typeof mapping[1] !== "function") {
				throw new TypeError(mapping[1] + " is not a function");
			}
			if (typeof mapping[0] === "string") {
				mapping[0] = mapping[0].charCodeAt(0);
			}
			this.mappings[mapping[0]] = mapping[1];
		}
		this.addMappings = function(mappings) {
			mappings.map(this.addMapping, this);
		}
		this.reacteToEvent = function(event) {
			var key = event.keyCode;

			if (key in this.mappings) {
				this.mappings[key]();
			}
		}
	}


	function main() {
		var mane = new Mane(settings);
		window.derpibrow = mane;
		mane.next(); // init load
		
		eventChainer(window, 'onresize', function() {
			updateDimentions(mane);
		});

		var keyMappings = [
			['B', mane, 'toggleBackgroundColor'],
			['C', mane, 'toggleComments'],
			['I', mane, 'toggleInfo'],
			['J', mane, 'prev'],
			['K', mane, 'next'],
			['S', mane, 'toggleStatus'],
			['T', mane, 'toggleTags'],
			[40, mane, 'moveImageUP'], // up
			[37, mane, 'moveImageRight'], // right
			[38, mane, 'moveImageDown'], // down
			[39, mane, 'moveImageLeft'], // left
			['Z', mane, 'zoomIn'],
			['X', mane, 'zoomOut'],
			[27, mane.tags, 'blur'], // Esc
			[13, mane.tags, 'submit'] // Enter
		];
		keymapper = new keyMapper();
		keymapper.addMappings(keyMappings);

		var doc = $(document);

		doc.keydown(function (event) {
			if (event.target.tagName.toLowerCase() == 'input'
					&& event.keyCode >= 65
					&& event.keyCode <= 90) {
				return; // Don't catch text input
			}
			else {
				keymapper.reacteToEvent(event);
			}
		});

		doc.mousewheel(function (event, delta) {
				if (delta > 0) {
					mane.zoomIn();
				}
				else {
					mane.zoomOut();
				}
		});
	}

	main();

	});
}) (jQuery);
 
