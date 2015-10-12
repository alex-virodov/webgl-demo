function FlowQueue(jqueue, cssClass) {

	var queue = [];
	var counter = 0; // for debug
	
	var widthQueue = jqueue.width();
	
	// Get element width by adding to the container and immediately removing
	var widthElem  =  (function() { 
		var elem = $('<div/>').addClass(cssClass).hide().appendTo(jqueue);
		var width = elem.outerWidth();
		elem.remove();
		return width;
	})();

	var allowPopDuringAnimation = false;
	var isPopAnimation = false;

	// no support for insert positon at zero - just 1 and on
	var insertPosition = 0;
	
	function recomputePosition() {
		for (var i in queue) {
			var newPosition;
			if (insertPosition > 0 && i >= insertPosition) {
				newPosition = widthQueue - widthElem * ((+i) + 1 + 1);
			} else {
				newPosition = widthQueue - widthElem * ((+i) + 1);
			}
			
			queue[i].positionChanged = /*true if*/(queue[i].position != newPosition);
			queue[i].position = newPosition;
			
			// console.log("widthQueue=", widthQueue, " widthElem=", widthElem, " i=", i, " position=", queue[i].position, "typeof i", typeof i);
		}
	}
	
	function setInsertPosition(pos) {
		insertPosition = pos;
		recomputePosition();
		$.each(queue, function() {
			if (this.positionChanged) {
				this.stop(true, false);
				this.animate({left: this.position}, 500);
			}
		});
	}
	
	function setInsertPositionFromOffset(offset) {
		// console.log(jqueue.offset(), offset);
		pos = Math.round(-1+(widthQueue - (offset.left - jqueue.offset().left)) / widthElem);
		setInsertPosition(pos);
	}
	
	function addElement(name, position)
	{
		var element = $("<div class='queueElement'>"+name+"</div>");
		queue.splice(position, 0, element);
		recomputePosition();
		
		element.css("left", element.position);
		jqueue.append(element);
		return element;
	}
	
	function insertAtInsertPosition(name) {
		var position = insertPosition;
		insertPosition = 0;
		addElement(name, position);
	}
	
	
	// todo: make filters so that only draggables marked by this queue are droppable here
	jqueue.droppable( {
		over: function(event, ui) { 
			ui.helper.queueInsertFunction = setInsertPositionFromOffset;
		},
		
		out: function(event, ui) {
			ui.helper.queueInsertFunction = undefined;
			setInsertPosition(0);
		},
		
		drop: function(event, ui) {
			insertAtInsertPosition(ui.helper.html());
		}
	});
	
	// public interface
	return {
		push: function(name) {
			if (name == undefined) {
				name = counter++;
			}
			
			addElement(name, /*position=*/queue.length);
		},
			
		pop: function() {
			if (!allowPopDuringAnimation && isPopAnimation) { return null; }
		
			var popped = queue.shift();
			
			if (popped) {
				recomputePosition();
				isPopAnimation = true;
				popped.fadeOut(500, function() { popped.remove(); isPopAnimation = false; });
				
				$.each(queue, function() {
					this.animate({left: this.position}, 500);
				});
			}
			
			return popped;
		},
		
		getLength : function() {
			return queue.length;
		},
			
		makeDraggable: function(jelement) {
			jelement.draggable({ 
				helper: "clone", 
				// refreshPositions: true,
				drag: function(event, ui) {
					if (ui.helper.queueInsertFunction) {
						ui.helper.queueInsertFunction(ui.offset);
					}
				},
			});
		}
	}
}
