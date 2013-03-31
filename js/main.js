

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
  		commentsID: '#comments',
  		statusID: '#status',
  		mainID: '#main', // main div to opreate in
  		preloadID: '#others', // pre load images into this div
  		preload: 3, // number of images to preload
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
  		}
  	};

  	var PageRequest = function(parent, page) {
  		if (typeof page == 'undefined') {
  			page = 0;
  		} 

  		this.parent = parent;
  		this.page = page;
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
		this.send = function () {
			console.log('sending');
			this.getPosts(endPoint(settings, 'images', this.page));
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
  		this.draw = function () {
  			if (!this.enabled) return; 
  			this.el.html(
  			'Page ' + this.curPage + '/' + this.maxPages
  			+ '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
  			+ 'Image ' + this.curImage + '/' + this.maxImages
  			+ '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
  			+ 'comments:' + this.comment_count
  			+ '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
  			+ 'id_number:' + this.imageID 
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

  	


  	function endPoint(settings, method, page) {
  		comp = [settings.url, method, 'page', page.toString()];
  		return  comp.join('/') + '.json';
  	}
  	
	var PreLoader = function (parent, id, num) {
		this.parent = parent;
		this.containter = $(id);
		this.num = num;
		this.imgs = [];
		this.load = function () {
			this.imgs = [];
			var i = 1;
			var load_next = false;
			while (i <= this.num) {
				var id = cache.ids.get(cache.ids.getPointer() + i);
				console.log(id + ':' +cache.ids.getPointer() + '-' + i);
				if (id !== false) {
					this.imgs.push("<img src=\"" + cache.get(id).image + "\" />");
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
			this.containter.html(this.imgs.join(''));
		}
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
		this.updateComments = function(img) {
			var commentHTML = '';
			var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
			if (img.comment_count > 0) {
				for (var i = img.comments.length - 1; i >= 0; i--) {
					var comment = img.comments[i];
					var date = new Date(comment.posted_at);
					commentHTML += '<div class="comment"><span class="author">' + comment.author
					+ '</span><span class="date">' + date.getHours() + ':' + date.getMinutes() + ' ' + days[date.getDay()]
					+ '</span><br /><span class="body">' + comment.body 
					+ '</span></div>';
				};
			}
			else {
				commentHTML = "<h3>No Comments Brony. :(</h3>";
			}

			this.el.html(commentHTML);
		}
	}

	var Mane = function (settings) {
		this.page = 0;
		this.mainID = settings.mainID;
		this.height = settings.height;
		this.width = settings.width;
		this.current = null;
		this.preloader = new PreLoader(this, settings.preloadID, settings.preload);
		this.status = new Status(this, settings.statusID);
		this.request = null;
		this.comments = new Comments(this, settings.commentsID);
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
			console.log(img);
			this.current = img;
			var main = $(this.mainID);
			if ((img.width / img.height) > (this.width / this.height)) {
				var img_width = Math.min(img.width, this.width);
				var img_height = img_width / (img.width / img.height)			
			}
			else {
				var img_height = Math.min(img.height, this.height);
				var img_width = img_height * (img.width / img.height)			
			}
			//console.log(this.width + ':' + this.height + '-' + (this.width / this.height));
			//console.log(img.width + ':' + img.height + '-' + (img.width / img.height));
			//console.log(img_width + ':' + img_height + '-' + (img_width / img_height));
			main.html("<span class=\"wapper\"><img width=\"" + img_width + "\" height=\"" + img_height + "\" src=\"" + img.image + "\" /></span>");

		}
		this.toggleComments = function() {
			this.comments.toggle();
		}
		this.toggleStatus = function() {
			this.status.toggle();
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
			this.request = new PageRequest(this, this.page);
			this.request.send();
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
	}

	function main() {
		var mane = new Mane(settings);
		mane.next(); // init load
		$(document).keypress(function (event) {
			console.log(event.keyCode);
			switch (event.keyCode) {
				case 99: // c
					mane.toggleComments();
					break;
				case 106: // j
					mane.prev();
					break;
				case 107: // k
					mane.next();
					break;
				case 115: // s
					mane.toggleStatus();
					break;
			}

		});
	}

	main();

  });
}) (jQuery);
 
