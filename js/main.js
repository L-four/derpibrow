

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
  	var settings = {
  		url: 'http://www.derpiboo.ru',	// website to get pics
  		height: $(window).height(),	
  		width: $(window).width(),
  		tagsID: '#tags',
  		commentsID: '#comments',
  		statusID: '#status',
  		mainID: '#main', // main div to opreate in
  		preloadID: '#others', // pre load images into this div
  		preload: 3, // number of images to preload
  		strings: {
  			no_comments: 'Nopony has made comments. :(',
  			days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  			page: 'Page',
  			link: 'links', 
  			number_of_comments: '# of Comments',
  			image_id: 'Image Id',
  			image: 'Image',
  			tags: 'Tags',
  		}
  	};
  	console.log(settings);
  	function updateDimentions(obj) {
  		obj.height = $(window).height();
  		obj.width = $(window).width();
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
			if (data.length == 0) {
				console.log('No Posts');
			}
			for (var i = data.length - 1; i >= 0; i--) {
				cache.set(data[i].id_number, data[i]);
			};
			if (this.parent.current == null) {
				this.parent.updateMainImage(data.shift());
				this.parent.status.updateImageNum(1, data.length);
				this.parent.preloader.load();
			}
			else {
				//this.parent.next();
				console.log('new posts');
			}
			this.parent.status.updatePageNum(this.page, 'idk');
			console.log(cache);
		}
		this.readPosts = this.readPosts.bind(this);
		this.send = function (method) {
			console.log('sending');
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
  			+ str.link + ' <a href="' + settings.url + '/' + this.imageID + '" >' + settings.url + '/' + this.imageID + '</a>'
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
  	}

  	var Endpoint = function (parent, url) {
  		this.parent = parent;
  		this.url = url;
  		this.getTags = function () {
  			return this.parent.tags.val();
  		}
  		this.getURL = function (method, page) {
  			var url = '';
	  		switch (method) {
	  			case 'search':
	  				comp = [this.url, method].join('/');
	  				url = comp + '.json?q=' + this.getTags() + '&page=' + page;
	  				break;
	  			case 'images':
			  		comp = [this.url, method, 'page', page.toString()];
			  		url = comp.join('/') + '.json';
			  		break;
	  		}
	  		return  url;
  		}
  	}
  	
	var PreLoader = function (parent, id, num) {
		this.parent = parent;
		this.containter = $(id);
		this.num = num;
		this.imgs = [];
		this.tracker = null;
		this.load = function () {
			this.imgs = [];
			var i = 1;
			var load_next = false;
			while (i <= this.num) {
				var id = cache.ids.get(cache.ids.getPointer() + i);
				console.log(id + ':' +cache.ids.getPointer() + '-' + i);
				if (id !== false) {
					this.imgs.push(cache.get(id).image);
				}
				else {
					load_next = true;
				}
				i++;
			}
			if (load_next) {
				this.parent.nextPage();
			}
			console.log(this.imgs);
			this.tracker = new Tracker(this.imgs, GetImage, this.updateDisplay);
			this.tracker.start();
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
			console.log(list);
			for (var i = this.list.length - 1; i >= 0; i--) {
				var item = this.list[i];
				this.listStatus[item] = {item:item, status:'start', data: null};
				var command_instance = new this.command(item);
				command_instance.setTracker(this);
				command_instance.run();
				console.log(i);
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
			if (url[0] + url[1] === '//') {
				url = "http:" + url;
			}
			return 'CrossDomain.php?img=' + encodeURIComponent(url);
		}
		this.proccessedURL = this.urlPreproccess(url);
		this.success = function(data) {
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
				console.log(ar);
				if (ar == null || ar[2].length < 5) break;
				var image = '<a href="' + ar[2] + '">' + ar[1] + '</a>';
				commentbody = commentbody.substring(0,ar.index) + image + commentbody.substring(ar.index + ar[1].length + ar[2].length + 1, commentbody.length);
			}

			var re = /\!([^\!\s]+)\!/g; //imager
			while (true) {
				var ar = re.exec(commentbody);
				console.log(ar);
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
					var date = new Date(comment.posted_at);
					commentHTML += '<div class="comment"><span class="author">' + comment.author
					+ '</span><span class="date">' + date.getHours() + ':' + date.getMinutes() + ' ' + days[date.getDay()]
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
				this.el.addClass('visuallyhidden');
				this.enabled = false;
				var _self = this;
				setTimeout(function(){_self.input.blur();}, 300);
			}
			else {
				this.el.removeClass('visuallyhidden');
				this.enabled = true;
				var _self = this;
				setTimeout(function(){_self.input.focus();_self.input.select();}, 300);
			}
		}
		this.get = function () {
			this.input.blur();
			this.value = this.input.val();
			this.display.html(this.val());
			this.parent.status.updateTags(this.val());
		}
		this.val = function () {
			return this.value;
		}

	}

	var Mane = function (settings) {
		this.page = 0;
		this.enabledColorChange = false;
		this.mainID = settings.mainID;
		this.el = $(this.mainID);
		this.height = settings.height;
		this.width = settings.width;
		this.current = null;
		this.preloader = new PreLoader(this, settings.preloadID, settings.preload);
		this.status = new Status(this, settings.statusID);
		this.request = null;
		this.comments = new Comments(this, settings.commentsID);
		this.tags = new Tags(this, settings.tagsID);
		this.endPoint = new Endpoint(this, settings.url);
		this.updateMainImage = function (img) {
			if (typeof img == 'undefined') {
				console.log(cache);
				return;
			}

			this.status.updateImageID(img.id_number);
			this.status.updateCommentNum(img.comment_count);
			if (this.comments.enabled) {
				this.comments.updateComments(img);
			}

			this.current = img;
			var imageGetter = new GetImage(img.image);
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
			var imgEl = $('img', this.el);
			if (this.enabledColorChange) {
				imgEl.load(function() {
					var bg_color = ColorThief.getDominantColor(imgEl);
					$('body').css('background-color', 'rgb(' + bg_color.join(',') + ')' );
				});
			}
			var _self = this;
			imgEl.mousewheel(function (event, delta) {
				var item = $(this);
				if (delta > 0) {
					_self.zoom(item, 'in', img);
				}
				else {
					_self.zoom(item, 'out', img);
				}
			});
			$(document).keydown(function (event) {
				console.log('keydown:' + event.keyCode);

				var increment = 25;
				switch (event.keyCode) {
					case 40: // up
						imgEl.css('margin-top',parseInt(imgEl.css('margin-top').replace(/[^-\d\.]/g, '')) - increment + 'px');
						event.stopPropagation();
						break;

					case 37: // right
						imgEl.css('margin-left',parseInt(imgEl.css('margin-left').replace(/[^-\d\.]/g, '')) + increment + 'px');
						event.stopPropagation();
						break;
					case 38: // down
						imgEl.css('margin-top',parseInt(imgEl.css('margin-top').replace(/[^-\d\.]/g, '')) + increment + 'px');
						event.stopPropagation();
						break;
					case 39: // left
						imgEl.css('margin-left',parseInt(imgEl.css('margin-left').replace(/[^-\d\.]/g, '')) - increment + 'px');
						event.stopPropagation();
						break;
					case 90: // z
						_self.zoom(imgEl, 'in', img);
						break;
					case 88: // x
						_self.zoom(imgEl, 'out', img);
						break;
					case 27:
						_self.tags.input.blur();

				}
			});
		}
		this.drawMainImage = this.drawMainImage.bind(this);
		this.zoom = function (item, dir, img) {
			var width = item.width();

			if(dir == 'in') {
				var new_width = width + (width / 10);
			}
			else if (dir == 'out') {
				var new_width = width - (width / 10);
			}
			else {
				console.log('zoom has no dir');
				return false;
			}

			item.width(new_width);
			item.height(new_width / (img.width / img.height));	
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
		this.toggleBackgroundColor = function() {
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
				this.status.updateImageNum(cache.ids.getPointer()  + 1, cache.length());
			}
			else {
				this.prevPage();
			}
		}
		this.getPage = function () {
			if (this.request != null && this.request.status == 'pennding') {
				return false;		
			}
			var method = 'images';
			if (this.tags.val() != '') {
				method = 'search'
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

	function main() {
		var mane = new Mane(settings);
		mane.next(); // init load
		$(document).keypress(function (event) {
			console.log('keypress:' + event.keyCode);
			if (event.target.tagName.toLowerCase() == 'input') {
				if (event.keyCode == 13) {
					mane.reset();
					mane.tags.get();
					mane.next();
				}
				return;
			}
			else {

				// needs to discard on inputs
				switch (event.keyCode) {
					case 99: // c
						mane.toggleComments();
						event.stopPropagation();
						break;
					case 106: // j
						mane.prev();
						event.stopPropagation();
						break;
					case 107: // k
						mane.next();
						event.stopPropagation();
						break;
					case 115: // s
						mane.toggleStatus();
						event.stopPropagation();
						break;
					case 116: // t
						mane.toggleTags();
						event.stopPropagation();
						break;
					case 98: //b
						mane.toggleBackgroundColor();
						event.stopPropagation();
						break;
				}
			}

		});
	}

	main();

  });
}) (jQuery);
 
