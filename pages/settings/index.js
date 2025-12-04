const Repo = require('../../utils/repo');

Page({
  data: {
    limitKB: 0,
    usedKB: 0
  },
  onShow() {
    const info = Repo.capacity();
    this.setData({ limitKB: info.limitKB, usedKB: info.usedKB });
  },
  refresh() {
    const info = Repo.capacity();
    this.setData({ limitKB: info.limitKB, usedKB: info.usedKB });
  }
});
