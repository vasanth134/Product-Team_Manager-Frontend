/**
 * Edge Case Empirical Test Harness for ViewSwitcher, TableView, and Kanban components.
 */
import { formatDateForInput, resolveAssignee } from '../utils/helpers';

// 1. Test Date ISO Conversion safety
function testDateISOConversion(dueDate: string | null | undefined): { safe: boolean; result?: string; error?: string } {
  try {
    const formatted = formatDateForInput(dueDate);
    return { safe: true, result: formatted };
  } catch (err: any) {
    return { safe: false, error: err.message };
  }
}

// 2. Test TableView sorting logic with edge cases
function testTableViewSort(
  tasks: Array<{ title?: string; storyPoints?: number; dueDate?: string | null }>,
  field: 'title' | 'storyPoints' | 'dueDate',
  order: 'asc' | 'desc'
) {
  const result = [...tasks];
  result.sort((a, b) => {
    let valA: any = a[field];
    let valB: any = b[field];

    if (field === 'title') {
      valA = (valA || '').toLowerCase();
      valB = (valB || '').toLowerCase();
    } else if (field === 'storyPoints') {
      valA = valA || 0;
      valB = valB || 0;
    } else if (field === 'dueDate') {
      const dA = valA ? new Date(valA).getTime() : 0;
      const dB = valB ? new Date(valB).getTime() : 0;
      valA = isNaN(dA) ? 0 : dA;
      valB = isNaN(dB) ? 0 : dB;
    }

    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  });
  return result;
}

// 3. Test localStorage viewMode loader logic
function testLocalStorageLoader(savedValue: string | null): string {
  try {
    if (savedValue === 'table' || savedValue === 'kanban') {
      return savedValue;
    }
  } catch {
    // ignore
  }
  return 'kanban';
}

// Run Empirical Tests
console.log('=== EMPIRICAL TEST HARNESS RUN ===');

// Test 1: Date ISO conversion
const dateTestCases = [
  '2026-07-26',
  '2026-07-26T12:00:00.000Z',
  '',
  null,
  undefined,
  'invalid-date-string',
  '2026-99-99',
];

console.log('\n--- Date Parsing Test Results ---');
dateTestCases.forEach(tc => {
  const res = testDateISOConversion(tc as any);
  console.log(`Input: ${JSON.stringify(tc)} => Safe: ${res.safe}, Result: ${res.result}, Error: ${res.error || 'none'}`);
});

// Test 2: LocalStorage view loader
const lsTestCases = ['kanban', 'table', 'invalid_mode', '', null, 'XYZ_123'];
console.log('\n--- LocalStorage View Loader Results ---');
lsTestCases.forEach(tc => {
  const res = testLocalStorageLoader(tc);
  console.log(`Input: ${JSON.stringify(tc)} => ViewMode: ${res}`);
});

// Test 3: TableView sort with invalid date
const invalidDateTasks = [
  { title: 'Task A', storyPoints: 3, dueDate: '2026-07-20' },
  { title: 'Task B', storyPoints: 1, dueDate: 'invalid-date-1' },
  { title: 'Task C', storyPoints: 5, dueDate: '2026-07-25' },
  { title: 'Task D', storyPoints: undefined, dueDate: null },
];
console.log('\n--- TableView Sort by dueDate with Invalid Dates ---');
try {
  const sorted = testTableViewSort(invalidDateTasks, 'dueDate', 'asc');
  console.log('Sorted order:', sorted.map(t => `${t.title} (${t.dueDate})`));
} catch (err: any) {
  console.error('Sort crashed:', err.message);
}

// Test 4: Assignee Resolution Test
console.log('\n--- Assignee Resolution Test Results ---');
const sampleMembers = [
  { user: { _id: 'u1', name: 'Alice', email: 'alice@test.com', avatarUrl: 'https://avatar.com/alice.png' } },
  { user: { _id: 'u2', name: 'Bob', email: 'bob@test.com', avatarUrl: 'https://avatar.com/bob.png' } }
];

const assigneeCases = [
  null,
  undefined,
  'u1',
  'u999',
  { _id: 'u2', name: 'Bob', avatarUrl: 'https://avatar.com/bob.png' }
];

assigneeCases.forEach(ac => {
  const resolved = resolveAssignee(ac, sampleMembers);
  console.log(`Input: ${JSON.stringify(ac)} => Resolved: ${JSON.stringify(resolved)}`);
});

console.log('\n=== EMPIRICAL TEST HARNESS COMPLETE ===');
