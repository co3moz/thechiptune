define(function () {
  var favorites;

  try {
    favorites = JSON.parse(localStorage.getItem("favorites"));
    if (favorites == null) {
      favorites = {length: 0};
    }

    var length = 0;
    var properties = Object.getOwnPropertyNames(favorites);
    properties.forEach(function (propertie) {
      if (propertie == "length") return;
      if (favorites[propertie].constructor != Object) {
        delete favorites[propertie];
      } else {
        length++;
      }
    });

    favorites.length = length;
  } catch (e) {
    favorites = {length: 0};
  }

  return {
    toggle: function (item) {
      if (item.url == "length") return;
      if (favorites[item.url] == undefined) {
        favorites[item.url] = item;
        favorites.length++;
      } else {
        delete favorites[item.url];
        favorites.length--;
      }

      this.save();
    },

    hasIn: function (item) {
      return favorites[item.url] != undefined;
    },

    getList: function () {
      return favorites;
    },

    clearList: function () {
      Object.getOwnPropertyNames(favorites).forEach(function (attr) {
        delete favorites[attr];
      });

      favorites.length = 0;
    },

    loadFrom: function (data) {
      Object.getOwnPropertyNames(data.data).forEach(function (attr) {
        if (favorites[attr] == undefined) {
          favorites[attr] = data.data[attr];
          favorites.length++;
        }
      });

      this.save();
    },

    save: function () {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    }
  }
});