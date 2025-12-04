const Repo = require('../../utils/repo');

Page({
  data: {
    mode: 'create',
    id: '',
    title: '',
    description: '',
    priorities: ['低', '中', '高', '紧急'],
    priorityIndex: 1,
    priority: '中',
    statusRange: ['待处理', '处理中', '已完成', '延期'],
    statusIndex: 0,
    status: '待处理',
    assignee: '',
    dueDate: ''
  },
  onLoad(options) {
    const mode = options.mode || 'create';
    const id = options.id || '';
    this.setData({ mode, id });
    wx.setNavigationBarTitle({ title: mode === 'edit' ? '编辑工单' : '新增工单' });
    if (mode === 'edit' && id) {
      const t = Repo.get(id);
      if (t) {
        const currentStatus = (t.status === '已解决' || t.status === '已关闭') ? '已完成' : t.status;
        const si = Math.max(0, this.data.statusRange.indexOf(currentStatus));
        const pi = Math.max(0, this.data.priorities.indexOf(t.priority));
        this.setData({
          title: t.title || '',
          description: t.description || '',
          priorityIndex: pi,
          priority: this.data.priorities[pi] || '中',
          statusIndex: si,
          status: this.data.statusRange[si] || '待处理',
          assignee: t.assignee || '',
          dueDate: t.dueDate || ''
        });
      }
    }
  },
  onInput(e) {
    const key = e.currentTarget.dataset.key;
    const val = e.detail.value;
    const data = {}; data[key] = val; this.setData(data);
  },
  onPriorityChange(e) {
    const i = Number(e.detail.value);
    this.setData({ priorityIndex: i, priority: this.data.priorities[i] });
  },
  onStatusChange(e) {
    const i = Number(e.detail.value);
    this.setData({ statusIndex: i, status: this.data.statusRange[i] });
  },
  onDueDateChange(e) {
    this.setData({ dueDate: e.detail.value });
  },
  save() {
    const base = {
      id: this.data.id,
      title: this.data.title,
      description: this.data.description,
      priority: this.data.priority,
      status: this.data.status,
      assignee: this.data.assignee,
      dueDate: this.data.dueDate,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    if (this.data.mode === 'edit' && this.data.id) {
      Repo.update(this.data.id, base);
    } else {
      Repo.save(base);
    }
    wx.showToast({ title: '已保存' });
    wx.navigateBack();
  }
});
