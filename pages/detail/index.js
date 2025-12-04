const Repo = require('../../utils/repo');

Page({
  data: {
    ticket: {}
  },
  onLoad(options) {
    const id = options.id;
    const t = Repo.get(id) || {};
    this.setData({ ticket: t, statusClass: this.statusBadge(t.status), dotClass: this.statusDotClass(t.status), updatedText: this.formatTime(t.updatedAt || t.createdAt) });
  },
  formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${y}-${m}-${day} ${hh}:${mm}`;
  },
  statusBadge(s) {
    if (s === '待处理') return 'badge-warning';
    if (s === '处理中') return 'badge-info';
    if (s === '已完成') return 'badge-success';
    if (s === '延期') return 'badge-error';
    return 'badge-info';
  },
  statusDotClass(s) {
    if (s === '待处理') return 'status-dot-warning';
    if (s === '处理中') return 'status-dot-info';
    if (s === '已完成') return 'status-dot-success';
    if (s === '延期') return 'status-dot-error';
    return 'status-dot-error';
  },
  setStatus(e) {
    const s = e.currentTarget.dataset.status;
    const id = this.data.ticket.id;
    const next = Repo.update(id, { status: s });
    if (next) this.setData({ ticket: next, statusClass: this.statusBadge(next.status), dotClass: this.statusDotClass(next.status), updatedText: this.formatTime(next.updatedAt || next.createdAt) });
  },
  edit() {
    wx.navigateTo({ url: '/pages/edit/index?id=' + this.data.ticket.id + '&mode=edit' });
  },
  remove() {
    const id = this.data.ticket.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复',
      confirmText: '删除',
      cancelText: '取消',
      confirmColor: '#f5222d',
      success: (res) => {
        if (res.confirm) {
          Repo.delete(id);
          wx.showToast({ title: '已删除' });
          wx.navigateBack();
        }
      }
    });
  }
});
