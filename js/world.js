game.service ('World', function () {
    this.data = null;

    this.getItem = function (itemName) {
        /* Retrieve an item specification object by name. */

        var item = this.data.items[itemName];
        return item;
    };
    
    return this;
});
