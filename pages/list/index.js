const Repo = require('../../utils/repo');

Page({
  data: {
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    statusRange: ['全部', '待处理', '处理中', '已完成', '延期'],
    statusIndex: 0,
    canLoadMore: false,
    stats: { total: 0, pending: 0, month: 0 }
  },
  onLoad() {
    Repo.init();
    this.computeStats();
    this.load();
  },
  onShow() {
    this.refresh();
  },
  statusBadge(s) {
    if (s === '待处理') return 'badge-warning';
    if (s === '处理中') return 'badge-info';
    if (s === '已完成') return 'badge-success';
    if (s === '延期') return 'badge-error';
    return 'badge-info';
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
  load() {
    const filter = {};
    const status = this.data.statusRange[this.data.statusIndex];
    if (status !== '全部') filter.status = status;
    const res = Repo.list({ page: this.data.page, pageSize: this.data.pageSize, filter });
    const maxPage = Math.ceil(res.total / this.data.pageSize) || 1;
    const now = new Date();
    const items = res.items.map(t => {
      let status = (t.status === '已解决' || t.status === '已关闭') ? '已完成' : t.status;
      if (status !== t.status) {
        Repo.update(t.id, { status });
      }
      const dueDate = t.dueDate || '';
      let dueAlert = false;
      if (dueDate) {
        const dueEnd = new Date(dueDate + 'T23:59:59');
        const diffDays = Math.floor((dueEnd - now) / 86400000);
        const isDone = status === '已完成';
        if (!isDone && diffDays >= 0 && diffDays <= 2) dueAlert = true;
        if (!isDone && now > dueEnd && status !== '延期') {
          status = '延期';
          Repo.update(t.id, { status });
        }
      }
      return {
        ...t,
        status,
        dueDate,
        dueAlert,
        statusClass: this.statusBadge(status),
        updatedText: this.formatTime(t.updatedAt || t.createdAt),
        dotClass: status === '待处理' ? 'status-dot-warning' : status === '处理中' ? 'status-dot-info' : status === '已完成' ? 'status-dot-success' : status === '延期' ? 'status-dot-error' : 'status-dot-error',
        descPreview: (t.description || '').slice(0, 80)
      };
    });
    this.setData({ items, total: res.total, canLoadMore: this.data.page < maxPage });
    this.computeStats();
  },
  refresh() {
    this.setData({ page: 1 });
    this.computeStats();
    this.load();
  },
  loadMore() {
    const next = this.data.page + 1;
    const filter = {};
    const status = this.data.statusRange[this.data.statusIndex];
    if (status !== '全部') filter.status = status;
    const res = Repo.list({ page: next, pageSize: this.data.pageSize, filter });
    const maxPage = Math.ceil(res.total / this.data.pageSize) || 1;
    if (next <= maxPage) {
      const now = new Date();
      const items = res.items.map(t => {
        let status = (t.status === '已解决' || t.status === '已关闭') ? '已完成' : t.status;
        if (status !== t.status) {
          Repo.update(t.id, { status });
        }
        const dueDate = t.dueDate || '';
        let dueAlert = false;
        if (dueDate) {
          const dueEnd = new Date(dueDate + 'T23:59:59');
          const diffDays = Math.floor((dueEnd - now) / 86400000);
          const isDone = status === '已完成';
          if (!isDone && diffDays >= 0 && diffDays <= 2) dueAlert = true;
          if (!isDone && now > dueEnd && status !== '延期') {
            status = '延期';
            Repo.update(t.id, { status });
          }
        }
        return {
          ...t,
          status,
          dueDate,
          dueAlert,
          statusClass: this.statusBadge(status),
          updatedText: this.formatTime(t.updatedAt || t.createdAt),
          dotClass: status === '待处理' ? 'status-dot-warning' : status === '处理中' ? 'status-dot-info' : status === '已完成' ? 'status-dot-success' : status === '延期' ? 'status-dot-error' : 'status-dot-error',
          descPreview: (t.description || '').slice(0, 80)
        };
      });
      this.setData({ items: this.data.items.concat(items), page: next, total: res.total, canLoadMore: next < maxPage });
    }
  },
  computeStats() {
    const items = Repo.all();
    const total = items.length;
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    let pending = 0;
    let month = 0;
    items.forEach(t => {
      const s = (t.status === '已解决' || t.status === '已关闭') ? '已完成' : t.status;
      if (s === '待处理' || s === '处理中' || s === '延期') pending++;
      const ts = t.createdAt || t.updatedAt;
      if (ts) {
        const d = new Date(ts);
        if (d.getFullYear() === y && d.getMonth() === m) month++;
      }
    });
    this.setData({ stats: { total, pending, month } });
  },
  onStatusTap(e) {
    const idx = Number(e.currentTarget.dataset.index);
    this.setData({ statusIndex: idx, page: 1 });
    this.load();
  },
  onCreate() {
    wx.navigateTo({ url: '/pages/edit/index?mode=create' });
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/detail/index?id=' + id });
  }
});
