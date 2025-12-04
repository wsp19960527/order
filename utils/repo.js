

function getCapacityInfo() {
  var info = wx.getStorageInfoSync();
  return { limitKB: info.limitSize, usedKB: info.currentSize };
}



function readChunks(baseKey) {
  var i = 0, parts = [];
  while (true) {
    var k = baseKey + ":" + i;
    var v = wx.getStorageSync(k);
    if (!v) break;
    parts.push(v);
    i++;
  }
  return parts.length ? JSON.parse(parts.join('')) : null;
}

function genId12() {
  var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var id = '';
  for (var i = 0; i < 12; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

var Repo = {
  init: function () {
    var meta = wx.getStorageSync('app:meta');
    if (!meta) wx.setStorageSync('app:meta', JSON.stringify({ schemaVersion: 1 }));
    var arrStr = wx.getStorageSync('app:tickets');
    if (!arrStr) {
      var migrated = [];
      var idsStr = wx.getStorageSync('app:index:tickets');
      if (idsStr) {
        var ids = JSON.parse(idsStr || '[]');
        ids.forEach(function (id) {
          var v = wx.getStorageSync('app:tickets:' + id);
          var obj = v ? JSON.parse(v) : readChunks('app:tickets:' + id);
          if (obj) migrated.push(obj);
        });
      }
      wx.setStorageSync('app:tickets', JSON.stringify(migrated));
    }
  },

  all: function () {
    return JSON.parse(wx.getStorageSync('app:tickets') || '[]');
  },

  list: function (opts) {
    var page = (opts && opts.page) || 1;
    var pageSize = (opts && opts.pageSize) || 20;
    var filter = (opts && opts.filter) || {};
    var all = Repo.all();
    var now = Date.now();
    var changed = false;
    for (var i = 0; i < all.length; i++) {
      var t = all[i];
      var status = (t.status === '已解决' || t.status === '已关闭') ? '已完成' : t.status;
      if (t.dueDate && status !== '已完成') {
        var dueEnd = new Date(t.dueDate + 'T23:59:59').getTime();
        if (now > dueEnd && status !== '延期') {
          status = '延期';
        }
      }
      if (status !== t.status) {
        all[i] = Object.assign({}, t, { status: status, updatedAt: t.updatedAt || now });
        changed = true;
      }
    }
    if (changed) wx.setStorageSync('app:tickets', JSON.stringify(all));
    var rows = all;
    if (filter.status) rows = rows.filter(function (t) { return t.status === filter.status; });
    var total = rows.length;
    var start = (page - 1) * pageSize;
    var items = rows.slice(start, start + pageSize);
    return { total: total, items: items };
  },

  get: function (id) {
    var all = Repo.all();
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) return all[i];
    }
    return null;
  },

  save: function (ticket) {
    var all = Repo.all();
    if (!ticket.id) {
      var id;
      do { id = genId12(); } while (all.some(function (x) { return x.id === id; }));
      ticket.id = id;
      ticket.createdAt = ticket.createdAt || Date.now();
    }
    ticket.updatedAt = Date.now();
    all.push(ticket);
    wx.setStorageSync('app:tickets', JSON.stringify(all));
    return ticket.id;
  },

  update: function (id, patch) {
    var all = Repo.all();
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) {
        var next = Object.assign({}, all[i], patch, { updatedAt: Date.now() });
        all[i] = next;
        wx.setStorageSync('app:tickets', JSON.stringify(all));
        return next;
      }
    }
    return null;
  },

  delete: function (id) {
    var all = Repo.all();
    var next = all.filter(function (x) { return x.id !== id; });
    wx.setStorageSync('app:tickets', JSON.stringify(next));
  },

  syncIndexes: function (ticket) {
    // no-op in array storage mode
  },

  export: function () {
    var items = Repo.all();
    return JSON.stringify({ meta: JSON.parse(wx.getStorageSync('app:meta') || '{}'), items: items });
  },

  import: function (json) {
    var data = JSON.parse(json);
    wx.setStorageSync('app:meta', JSON.stringify(data.meta || { schemaVersion: 1 }));
    var items = data.items || [];
    wx.setStorageSync('app:tickets', JSON.stringify(items));
    return items.length;
  },

  capacity: function () {
    return getCapacityInfo();
  }
};

module.exports = Repo;
