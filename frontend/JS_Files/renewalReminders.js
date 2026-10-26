/* Member 3: renewal date calculations. Dates are interpreted in local calendar time. */
window.CoveRenewalReminders = {
  nextDate(subscription, now = new Date()) {
    if (!subscription || !subscription.renewalDate) return null;
    const date = new Date(`${subscription.renewalDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    let guard = 0;
    while (date < today && guard < 1000) {
      if (subscription.billingCycle === 'weekly') date.setDate(date.getDate() + 7);
      else if (subscription.billingCycle === 'yearly') date.setFullYear(date.getFullYear() + 1);
      else date.setMonth(date.getMonth() + 1);
      guard += 1;
    }
    return date;
  },
  daysUntil(date, now = new Date()) {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    return Math.round((date - today) / 86400000);
  },
  upcoming(subscriptions, withinDays = null, now = new Date()) {
    return subscriptions.map((subscription) => {
      const nextDate = this.nextDate(subscription, now);
      return nextDate ? { subscription, nextDate, days: this.daysUntil(nextDate, now) } : null;
    }).filter(Boolean)
      .filter((item) => item.days >= 0 && (withinDays === null || item.days <= withinDays))
      .sort((a, b) => a.nextDate - b.nextDate);
  }
};
