/**
 * Comprehensive State & Performance Stress Test Harness
 * Tests helpers, sorting, filtering, optimistic updates, and component state transitions.
 */

import { formatDateForInput, resolveAssignee } from '../utils/helpers';
import type { MemberUser, MemberLike } from '../utils/helpers';
import type { TaskType } from '../context/TeamContext';

// Helper for assertions
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

console.log('====================================================');
console.log('   EMPIRICAL STRESS TEST SUITE — CHALLENGER M1-2-V2');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passCount++;
  } catch (err: any) {
    console.error(`[FAIL] ${name}: ${err.message}`);
    failCount++;
  }
}

// -----------------------------------------------------------------
// TEST SECTION 1: formatDateForInput Stress Testing
// -----------------------------------------------------------------
runTest('formatDateForInput handles valid ISO & standard date strings', () => {
  assert(formatDateForInput('2026-07-26') === '2026-07-26', 'Standard YYYY-MM-DD date should format to YYYY-MM-DD');
  assert(formatDateForInput('2026-07-26T12:34:56.789Z') === '2026-07-26', 'ISO timestamp should split to YYYY-MM-DD');
  assert(formatDateForInput('1970-01-01T00:00:00.000Z') === '1970-01-01', 'Epoch start date should format properly');
  assert(formatDateForInput('2024-02-29') === '2024-02-29', 'Leap day should format properly');
});

runTest('formatDateForInput safely handles null, undefined, empty, and unparseable strings without throwing RangeError', () => {
  assert(formatDateForInput(null) === '', 'null should return empty string');
  assert(formatDateForInput(undefined) === '', 'undefined should return empty string');
  assert(formatDateForInput('') === '', 'empty string should return empty string');
  assert(formatDateForInput('invalid-date-string') === '', 'invalid date string should return empty string');
  assert(formatDateForInput('2026-99-99') === '', 'out of range date string should return empty string');
  assert(formatDateForInput('foo-bar-baz') === '', 'unparseable text should return empty string');
});

// -----------------------------------------------------------------
// TEST SECTION 2: resolveAssignee Stress Testing
// -----------------------------------------------------------------
const sampleMembers: MemberLike[] = [
  { user: { _id: 'u1', name: 'Alice Smith', email: 'alice@example.com', avatarUrl: 'https://api.avatar/alice.png' } },
  { user: { _id: 'u2', name: 'Bob Jones', email: 'bob@example.com', avatarUrl: 'https://api.avatar/bob.png' } },
  { user: { _id: 'u3', name: 'Charlie Brown', email: 'charlie@example.com', avatarUrl: '' } },
];

runTest('resolveAssignee handles null, undefined, and empty assignee inputs', () => {
  assert(resolveAssignee(null, sampleMembers) === null, 'null assignee should return null');
  assert(resolveAssignee(undefined, sampleMembers) === null, 'undefined assignee should return null');
  assert(resolveAssignee('', sampleMembers) === null, 'empty string assignee should return null');
  assert(resolveAssignee({}, sampleMembers) === null, 'empty object assignee should return null');
});

runTest('resolveAssignee preserves already populated User objects', () => {
  const aliceObj: MemberUser = { _id: 'u1', name: 'Alice Smith', email: 'alice@example.com', avatarUrl: 'url' };
  const res = resolveAssignee(aliceObj, sampleMembers);
  assert(res !== null && res._id === 'u1' && res.name === 'Alice Smith', 'Populated object should be returned directly');
});

runTest('resolveAssignee maps string user ID to matching team member user object', () => {
  const res = resolveAssignee('u2', sampleMembers);
  assert(res !== null && res._id === 'u2' && res.name === 'Bob Jones' && res.avatarUrl === 'https://api.avatar/bob.png', 'String ID u2 should resolve to Bob Jones member object');
});

runTest('resolveAssignee falls back gracefully when string ID is not found in team members', () => {
  const res = resolveAssignee('u999', sampleMembers);
  assert(res !== null && res._id === 'u999' && res.name === 'Assigned User', 'Unknown string ID should return fallback user object');
});

runTest('resolveAssignee handles undefined/null members array safely', () => {
  const res1 = resolveAssignee('u1', undefined);
  assert(res1 !== null && res1._id === 'u1' && res1.name === 'Assigned User', 'Undefined members array should fall back gracefully');
  
  const res2 = resolveAssignee('u1', null as any);
  assert(res2 !== null && res2._id === 'u1' && res2.name === 'Assigned User', 'Null members array should fall back gracefully');
});

// -----------------------------------------------------------------
// TEST SECTION 3: State Transitions & Optimistic Updates
// -----------------------------------------------------------------
runTest('Simulated updateTask optimistic resolution logic', () => {
  let taskState: TaskType = {
    _id: 'task_1',
    teamId: 'team_1',
    title: 'Initial Task',
    description: 'Desc',
    status: 'todo',
    priority: 'medium',
    assignee: null,
    storyPoints: 2,
    dueDate: '2026-08-01',
    updatedAt: new Date().toISOString(),
  };

  const simulateOptimisticUpdate = (updates: any) => {
    const optimisticUpdates = { ...updates };
    if (updates.assignee !== undefined) {
      if (typeof updates.assignee === 'string') {
        const member = sampleMembers.find(m => m.user && m.user._id === updates.assignee);
        optimisticUpdates.assignee = member ? member.user : { _id: updates.assignee, name: 'Assigned User', email: '', avatarUrl: '' };
      }
    }
    taskState = { ...taskState, ...optimisticUpdates };
  };

  // Transition 1: Assign to u1 string
  simulateOptimisticUpdate({ assignee: 'u1' });
  assert(typeof taskState.assignee === 'object' && taskState.assignee?._id === 'u1' && taskState.assignee?.name === 'Alice Smith', 'Optimistic update converted string u1 to user object');

  // Transition 2: Change to unassigned (null)
  simulateOptimisticUpdate({ assignee: null });
  assert(taskState.assignee === null, 'Optimistic update cleared assignee to null');

  // Transition 3: Change to unknown string ID
  simulateOptimisticUpdate({ assignee: 'u88' });
  assert(typeof taskState.assignee === 'object' && taskState.assignee?._id === 'u88' && taskState.assignee?.name === 'Assigned User', 'Optimistic update created fallback object for unknown string ID');

  // Transition 4: Multi-field update (status, priority, points, due date)
  simulateOptimisticUpdate({ status: 'done', priority: 'critical', storyPoints: 8, dueDate: '2026-09-15' });
  assert(taskState.status === 'done' && taskState.priority === 'critical' && taskState.storyPoints === 8 && taskState.dueDate === '2026-09-15', 'Multi-field optimistic update applied cleanly');
});

// -----------------------------------------------------------------
// TEST SECTION 4: High Volume Sorting, Filtering, and Performance (10,000 tasks)
// -----------------------------------------------------------------
runTest('Performance & Correctness: Sorting and Filtering 10,000 tasks', () => {
  const statuses: TaskType['status'][] = ['backlog', 'todo', 'in_progress', 'review', 'done'];
  const priorities: TaskType['priority'][] = ['low', 'medium', 'high', 'critical'];
  const dates = ['2026-01-01', '2026-06-15', '2026-12-31', 'invalid-date', null, '2025-05-20'];
  const assignees = [null, 'u1', 'u2', 'u3', 'u999', { _id: 'u1', name: 'Alice Smith', email: '', avatarUrl: '' }];

  const generateTasks = (count: number): TaskType[] => {
    const list: TaskType[] = [];
    for (let i = 0; i < count; i++) {
      list.push({
        _id: `task_${i}`,
        teamId: 'team_1',
        title: `Task ${i} - ${i % 3 === 0 ? 'Bugfix' : 'Feature'}`,
        description: `Description for task ${i}`,
        status: statuses[i % 5],
        priority: priorities[i % 4],
        assignee: assignees[i % 6] as any,
        storyPoints: (i * 3) % 20,
        dueDate: dates[i % 6],
        updatedAt: new Date().toISOString(),
      });
    }
    return list;
  };

  const largeDataset = generateTasks(10000);
  assert(largeDataset.length === 10000, 'Generated 10,000 tasks');

  // Filter & Sort logic identical to TableView.tsx
  const executeFilterAndSort = (
    tasks: TaskType[],
    searchQuery: string,
    filterStatus: string,
    filterAssignee: string,
    sortField: 'title' | 'storyPoints' | 'dueDate' | null,
    sortOrder: 'asc' | 'desc'
  ) => {
    let result = [...tasks];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    }

    if (filterStatus !== 'all') {
      result = result.filter(t => t.status === filterStatus);
    }

    if (filterAssignee !== 'all') {
      if (filterAssignee === 'unassigned') {
        result = result.filter(t => !resolveAssignee(t.assignee, sampleMembers));
      } else {
        result = result.filter(t => {
          const assigneeUser = resolveAssignee(t.assignee, sampleMembers);
          return assigneeUser?._id === filterAssignee;
        });
      }
    }

    if (sortField) {
      result.sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (sortField === 'title') {
          valA = (valA || '').toLowerCase();
          valB = (valB || '').toLowerCase();
        } else if (sortField === 'storyPoints') {
          valA = valA || 0;
          valB = valB || 0;
        } else if (sortField === 'dueDate') {
          const dA = valA ? new Date(valA).getTime() : 0;
          const dB = valB ? new Date(valB).getTime() : 0;
          valA = isNaN(dA) ? 0 : dA;
          valB = isNaN(dB) ? 0 : dB;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  };

  const startTime = Date.now();

  // Test 1: Title Sort Ascending
  const titleSorted = executeFilterAndSort(largeDataset, '', 'all', 'all', 'title', 'asc');
  assert(titleSorted.length === 10000, 'Title sort preserved all 10,000 tasks');

  // Test 2: Due Date Sort Descending with invalid dates mixed in
  const dateSorted = executeFilterAndSort(largeDataset, '', 'all', 'all', 'dueDate', 'desc');
  assert(dateSorted.length === 10000, 'Due date sort preserved all 10,000 tasks');

  // Test 3: Story Points Ascending
  const pointsSorted = executeFilterAndSort(largeDataset, '', 'all', 'all', 'storyPoints', 'asc');
  assert(pointsSorted.length === 10000, 'Story points sort preserved all 10,000 tasks');
  assert((pointsSorted[0].storyPoints || 0) <= (pointsSorted[9999].storyPoints || 0), 'First task points <= last task points');

  // Test 4: Multi-Filter (Search + Status + Assignee)
  // For i = 0: title="Task 0 - Bugfix" (Bugfix), status=statuses[0]='backlog', assignee=assignees[0]=null
  // For i = 6: title="Task 6 - Bugfix", status=statuses[1]='todo', assignee=assignees[0]=null
  // For i = 12: title="Task 12 - Bugfix", status=statuses[2]='in_progress', assignee=assignees[0]=null
  // For i = 18: title="Task 18 - Bugfix", status=statuses[3]='review', assignee=assignees[0]=null
  // For i = 24: title="Task 24 - Bugfix", status=statuses[4]='done', assignee=assignees[0]=null
  // For i = 30: title="Task 30 - Bugfix", status=statuses[0]='backlog', assignee=assignees[0]=null
  // Let's filter for search='Bugfix', status='todo', assignee='unassigned'
  const filtered = executeFilterAndSort(largeDataset, 'Bugfix', 'todo', 'unassigned', 'storyPoints', 'desc');
  assert(filtered.length > 0, `Multi-filter produced valid matching subset (count: ${filtered.length})`);
  filtered.forEach(t => {
    assert(t.title.includes('Bugfix'), 'Task title contains Bugfix');
    assert(t.status === 'todo', 'Task status is todo');
    const user = resolveAssignee(t.assignee, sampleMembers);
    assert(user === null, 'Task is unassigned');
  });

  const duration = Date.now() - startTime;
  console.log(`  └─ Performance: Filtered & sorted 10,000 tasks 4 times in ${duration}ms`);
  assert(duration < 500, `Filtering & sorting 10,000 tasks should be fast (< 500ms), actual: ${duration}ms`);
});

// -----------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------
console.log('\n====================================================');
console.log(`STRESS TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('====================================================\n');

if (failCount > 0) {
  throw new Error(`Stress test failed with ${failCount} errors.`);
}
