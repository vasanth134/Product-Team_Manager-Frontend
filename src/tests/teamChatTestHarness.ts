/**
 * Team Chat Test Harness Re-export & Execution Wrapper
 */
import { runTeamChatE2ETests } from './teamChatE2E.test';
export { runTeamChatE2ETests };

if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].includes('teamChatTestHarness')) {
  runTeamChatE2ETests()
    .then((summary) => {
      if (!summary.success) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    })
    .catch((err: any) => {
      console.error('Fatal Harness Error:', err);
      process.exit(1);
    });
}
