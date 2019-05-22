const List = function(maxItems = false) {
	var _self			= this;
	var _maxItems		= maxItems;
	var _items			= {};	// A container for all items loaded
	var _itemCounter	= 0;	// Used to create a unique ID for each item. Incremented with each new item
	var _order			= [];	// Stores item handles in their desired order
	var _disabled		= [];	// List of item handles to ignore when doing eachItem()
	var _currentIndex	= -1;	// Tracks position of "next" item

	/**
	 *
	 *
	 *
	 *
	 * @return	{boolean}
	 */
	_self.hasNextItem = function() {
		return (_currentIndex + 1 < _items.length);
	};

	/**
	 *
	 *
	 *
	 *
	 * @return	{object}
	 */
	_self.getNextItem = function() {
		if( _self.hasNextItem() ) {
			_currentIndex++;

			var handle = _order[_currentIndex];

			return _items[handle];
		}
	};

	_self.getRandomItem = function() {
		if( _order.length != 0 ) {
			var randIndex	= Math.floor( Math.random() * _order.length );
			var randHandle	= _order[randIndex];

			return _items[randHandle];
		}
	};

	/**
	 * Adds a supplied item to _items.
	 *
	 * @method	addItem
	 * @public
	 * @param		{object}		item			Any object to be stored
	 * @param		{string}		handle		A non-unique name for the item
	 * @param		{integer}		position		A specified order position for the item
	 * @param		{boolean}		disabled		Allows added item to be disabled upon addition
	 */
	_self.addItem = function(item, handle = false, position = false, disable = false) {
		if( _maxItems ) {
			if( _self.countItems() > _maxItems ) {
				return false;
			}
		}

		var generatedHandle = 'item-' + _itemCounter;

		// Use custom item handle if provided
		if( handle ) {
			generatedHandle = String(handle);
		}

		_items[generatedHandle] = item;
		_itemCounter++;
		_order.push(generatedHandle);

		if( !isNaN(position) ) {
			_self.reorderItem(generatedHandle, position);

			if( position <= _currentIndex ) {
				_currentIndex++;
			}
		}
		if( disable ) {
			_self.disableItem(generatedHandle);
		}

		return generatedHandle;
	};

	/**
	 * Removes an item from _items container.
	 *
	 * @method	removeItem
	 * @public
	 * @param		{string}	handle	The item's handle
	 * @return	{object}
	 */
	_self.removeItem = function(handle) {
		if( _items.hasOwnProperty(handle) ) {
			delete _items[handle];
		}

		var orderIndex = _order.indexOf(handle);

		if( orderIndex != -1 ) {
			_order.splice(orderIndex, 1);

			if( orderIndex < _currentIndex ) {
				_currentIndex--;
			}
			if( _currentIndex + 1 > _items.length ) {
				_currentIndex--;
			}
		}
	};

	/**
	 * Includes an item in the _disabled blacklist as one to ignore when doing eachItem().
	 *
	 * @method	enableItem
	 * @private
	 * @param		{string}	handle	Item handle
	 */
	_self.disableItem = function(handle) {
		var index = _disabled.indexOf(handle);

		if( index == -1 ) {
			_disabled.push(handle);
		}
	};

	/**
	 * Removes an item from the _disabled blacklist.
	 *
	 * @method	enableItem
	 * @private
	 * @param		{string}	handle	Item handle
	 */
	_self.enableItem = function(handle) {
		var index = _disabled.indexOf(handle);

		if( index != -1 ) {
			_disabled.splice(index, 1);
		}
	};

	/**
	 * Checks if an item is disabled or not by its handle's presence in _disabled.
	 *
	 * @method	isDisabled
	 * @public
	 * @param		{string}	handle	An item handle
	 * @return	{boolean}
	 */
	_self.isDisabled = function(handle) {
		return (_disabled.indexOf(handle) != -1);
	};

	/**
	 * Getter method for _items.
	 *
	 * @method	getItems
	 * @public
	 * @return	{object}
	 */
	_self.getItems = function() {
		return Object.values(_items);
	};

	_self.getOrderedItems = function() {
		const orderedItems = new Array(_self.countEnabledItems());
		var skipBlacklist	= (_disabled.length == 0) ? true : false;

		// Sort the items before passing them to the callback function
		sortLoop:
		for(var handle in _items) {
			var position	= _order.indexOf(handle);
			var item		= _items[handle];

			if( !skipBlacklist ) {
				if( _self.isDisabled(handle) ) {
					continue sortLoop;
				}
			}

			orderedItems[position] = item;
		}

		return orderedItems;
	};

	/**
	 * Gets an item by its handle.
	 *
	 * @method	getItem
	 * @public
	 * @param		{string}	handle	The item's handle
	 * @return	{object}			Returns false if no item by that handle exists
	 */
	_self.getItem = function(handle) {
		if( _items.hasOwnProperty(handle) ) {
			return _items[handle];
		}

		return false;
	};

	_self.countItems = function() {
		return _order.length;
	};

	_self.countEnabledItems = function() {
		return _order.length - _disabled.length;
	};

	_self.sortItems = function() {
		var orderedItems = {};

		// Sort the items before passing them to the callback function
		for(var handle in _items) {
			var position	= _order.indexOf(handle);
			var item		= _items[handle];

			orderedItems[position] = item;
		}

		_items = orderedItems;
	};

	/**
	 * Loops through all items and passes them to a callback function.
	 *
	 * @method	eachItem
	 * @public
	 * @param		{function}	callback		A callback function. Gets passed an item and its handle as arguments. Returning false will break the loop.
	 */
	_self.eachItem = function(callback) {
		const orderedItems = _self.getOrderedItems();

		// Pass each item to the callback function
		for(var index in orderedItems) {
			var data		= orderedItems[index];
			var response	= callback(data, _order[index], index);

			// Break if the callback returns false
			if( typeof(response) != 'undefined' ) {
				if( !response ) {
					break;
				}
			}
		}
	};

	/**
	 * Wrapper function for eachItem() and reset().
	 *
	 * @method	popEachItem
	 * @public
	 * @param		{function}	callback		A callback function to be passed to eachItem()
	 */
	_self.popEachItem = function(callback) {
		_self.eachItem(callback);
		_self.reset();
	};

	/**
	 * Clears all items and sets the counter back to zero.
	 *
	 * @method	reset
	 * @public
	 */
	_self.reset = function() {
		_items	= [];
		_order	= [];
		_disabled	= [];

		_itemCounter	= 0;
		_currentIndex	= -1;
	};

	/**
	 * Reorders an item's handle in _order.
	 *
	 * @method	reorderItem
	 * @public
	 * @param		{string}	handle		Item handle
	 * @param		{number}	newPosition	The new position for the item
	 */
	_self.reorderItem = function(handle, newPosition) {
		if( typeof(newPosition) != 'number' ) {
			return;
		}

		var index		= _order.indexOf(handle);
		var origLenth	= _order.length;

		// Exit if the new and current positions match
		if( newPosition == index ) {
			return;
		}

		// Remove the element
		_order.splice(index, 1);

		// Add the element at the desired position
		if( (newPosition + 1) >= origLenth ) {
			_order.push(handle);
		} else if( newPosition == 0 ) {
			_order.unshift(handle);
		} else {
			var piece1 = _order.slice(0, newPosition);
			var piece2 = _order.slice(newPosition);

			_order = [...piece1, handle, ...piece2];
		}
	};
};

module.exports = List;
