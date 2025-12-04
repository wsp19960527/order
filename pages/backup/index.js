const Repo = require('../../utils/repo');

Page({
  data: {
    exportText: '',
    importText: ''
  },
  doExport() {
    const s = Repo.export();
    this.setData({ exportText: s });
  },
  onImportText(e) {
    this.setData({ importText: e.detail.value });
  },
  doImport() {
    try {
      const n = Repo.import(this.data.importText);
      wx.showToast({ title: '导入' + n + '条' });
      this.setData({ importText: '' });
    } catch (e) {
      wx.showToast({ title: '导入失败', icon: 'error' });
    }
  }
});
