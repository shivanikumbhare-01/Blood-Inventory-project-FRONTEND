export const bloodGroups = [
    { group: 'A+', available: 245, used: 32, required: 200, expiry: '15 Sep 2026', days: 14, predicted: 182, status: 'Healthy' },
    { group: 'A-', available: 64, used: 18, required: 90, expiry: '08 Sep 2026', days: 7, predicted: 96, status: 'Warning' },
    { group: 'B+', available: 145, used: 25, required: 120, expiry: '20 Sep 2026', days: 19, predicted: 112, status: 'Healthy' },
    { group: 'B-', available: 38, used: 10, required: 60, expiry: '12 Sep 2026', days: 11, predicted: 58, status: 'Warning' },
    { group: 'AB+', available: 92, used: 14, required: 70, expiry: '22 Sep 2026', days: 21, predicted: 62, status: 'Healthy' },
    { group: 'AB-', available: 26, used: 6, required: 35, expiry: '06 Sep 2026', days: 5, predicted: 31, status: 'Warning' },
    { group: 'O+', available: 354, used: 45, required: 280, expiry: '18 Sep 2026', days: 17, predicted: 156, status: 'Healthy' },
    { group: 'O-', available: 18, used: 12, required: 80, expiry: '05 Sep 2026', days: 4, predicted: 82, status: 'Critical' },
];

export const usageData = [
    { date: 'Aug 26', usage: 108, collection: 132, predicted: null },
    { date: 'Aug 27', usage: 122, collection: 128, predicted: null },
    { date: 'Aug 28', usage: 115, collection: 145, predicted: null },
    { date: 'Aug 29', usage: 136, collection: 120, predicted: null },
    { date: 'Aug 30', usage: 128, collection: 138, predicted: null },
    { date: 'Aug 31', usage: 142, collection: 152, predicted: 148 },
    { date: 'Sep 01', usage: null, collection: 124, predicted: 156 },
    { date: 'Sep 02', usage: null, collection: null, predicted: 161 },
    { date: 'Sep 03', usage: null, collection: null, predicted: 166 },
    { date: 'Sep 04', usage: null, collection: null, predicted: 172 },
    { date: 'Sep 05', usage: null, collection: null, predicted: 178 },
    { date: 'Sep 06', usage: null, collection: null, predicted: 184 },
];

export const alerts = [
    { id: 1, type: 'Critical', title: 'O- blood stock critically low', description: 'Only 18 units of O- available. Safety threshold is 80 units.', time: '12 min ago', icon: 'alert' },
    { id: 2, type: 'Warning', title: 'A+ units expiring soon', description: '12 units of A+ expire within the next 3 days.', time: '48 min ago', icon: 'clock' },
    { id: 3, type: 'Critical', title: 'Predicted shortage detected', description: 'O+ demand is expected to exceed current inventory in 7 days.', time: '2 hrs ago', icon: 'trend' },
    { id: 4, type: 'Normal', title: 'Inventory updated successfully', description: '42 newly collected units were added to the central bank.', time: 'Yesterday', icon: 'check' },
];

export const recommendations = [
    { id: 1, group: 'O-', amount: 75, priority: 'High', title: 'Restock O- units', reason: 'Current stock is below safety threshold and predicted demand is increasing.', bullets: ['High historical usage', 'Current stock below safety threshold', 'Increasing predicted demand'] },
    { id: 2, group: 'A-', amount: 35, priority: 'Medium', title: 'Restock A- units', reason: 'Projected demand will approach the minimum required level by next week.', bullets: ['Moderate weekly usage', 'Low donor availability', 'Expiry window approaching'] },
    { id: 3, group: 'B+', amount: 0, priority: 'Normal', title: 'Inventory sufficient', reason: 'Current inventory comfortably covers the next 7 days of expected demand.', bullets: ['Healthy stock coverage', 'Stable usage pattern', 'No action required'] },
];