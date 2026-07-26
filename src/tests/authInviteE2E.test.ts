import fs from 'fs';
import path from 'path';
import http from 'http';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Absolute imports to target source directories
import { User } from '../../../server/src/models/User';
import { Team } from '../../../server/src/models/Team';
import { Invite } from '../../../server/src/models/Invite';
import { devEmailsList } from '../../../server/src/utils/mailer';
import authRoutes from '../../../server/src/routes/auth';
import teamRoutes from '../../../server/src/routes/teams';

// Global assertion helper
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

export async function runAuthInviteE2ETests() {
  console.log('================================================================================');
  console.log('       AETHER GOOGLE OAUTH & EMAIL TEAM INVITATIONS E2E HARNESS');
  console.log('================================================================================\n');

  const results: TestResult[] = [];

  async function runCase(name: string, fn: () => void | Promise<void>) {
    const start = Date.now();
    try {
      await fn();
      const durationMs = Date.now() - start;
      results.push({ name, passed: true, durationMs });
      console.log(`  [PASS] ${name} (${durationMs}ms)`);
    } catch (err: any) {
      const durationMs = Date.now() - start;
      results.push({ name, passed: false, error: err.message, durationMs });
      console.error(`  [FAIL] ${name}: ${err.message}`);
    }
  }

  // Setup dynamic test server
  const testMongoUri = 'mongodb://127.0.0.1:27017/aether_auth_invite_test';
  
  // Clear any existing connection and reconnect
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(testMongoUri);
  
  // Clear test DB tables
  await User.deleteMany({});
  await Team.deleteMany({});
  await Invite.deleteMany({});
  devEmailsList.length = 0; // Clear dev mailbox

  const app = express();
  app.use(express.json());
  app.use('/api/auth', (authRoutes as any).default || authRoutes);
  app.use('/api/teams', (teamRoutes as any).default || teamRoutes);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });
  const address = server.address() as { port: number };
  const baseUrl = `http://localhost:${address.port}/api`;

  let adminUser: any;
  let adminToken: string;
  let createdTeam: any;
  let generatedInviteToken: string;

  // 1. Compile and schema setup
  await runCase('File verification for newly added models and utilities', () => {
    const projectRoot = process.cwd();
    assert(fs.existsSync(path.join(projectRoot, 'server', 'src', 'models', 'Invite.ts')), 'Invite.ts model exists');
    assert(fs.existsSync(path.join(projectRoot, 'server', 'src', 'utils', 'mailer.ts')), 'mailer.ts utility exists');
  });

  // 2. Google OAuth Mock authentication
  await runCase('Verify POST /api/auth/google registering a mock Google user', async () => {
    const email = 'jane.doe@aether.io';
    const name = 'Jane Doe';

    const res = await fetch(`${baseUrl}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credential: 'mock_google_jwt_token_12345',
        mockName: name,
        mockEmail: email
      })
    });

    assert(res.ok, 'Google login API returned OK status');
    const data = await res.json();
    assert(data.token !== undefined, 'Returned JWT token');
    assert(data.user !== undefined, 'Returned User object');
    assert(data.user.email === email, 'Email matches Google payload email');
    assert(data.user.name === name, 'Name matches Google payload name');

    // Confirm stored in DB
    const dbUser = await User.findOne({ email });
    assert(dbUser !== null, 'User saved to MongoDB');
    assert(dbUser!.name === name, 'DB user name matches');
  });

  // 3. Team invitation token generation & simulated delivery
  await runCase('Verify POST /api/teams/:teamId/invite generates token and saves invitation details', async () => {
    // 3.1 Create admin user to execute invitation
    const passwordHash = await bcrypt.hash('adminpassword123', 10);
    adminUser = new User({
      name: 'Alex Rivera Admin',
      email: 'alex.admin@aether.io',
      passwordHash,
      role: 'Product Lead'
    });
    await adminUser.save();

    const jwtSecret = process.env.JWT_SECRET || 'aether_jwt_secret_token_12345!';
    adminToken = jwt.sign({ userId: adminUser._id }, jwtSecret, { expiresIn: '7d' });

    // 3.2 Create team owned by admin
    createdTeam = new Team({
      name: 'Aether Engineering Team',
      description: 'Main product team workspace',
      owner: adminUser._id,
      members: [{ user: adminUser._id, role: 'owner' }]
    });
    await createdTeam.save();

    // 3.3 Trigger invite endpoint
    const inviteEmail = 'jane.invitation@aether.io';
    const res = await fetch(`${baseUrl}/teams/${createdTeam._id}/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ email: inviteEmail, role: 'member' })
    });

    assert(res.ok, 'Invite API returned success');
    const data = await res.json();
    assert(data.inviteLink !== undefined, 'Returned simulated invite join link');
    assert(data.inviteLink.includes('?inviteToken='), 'Link contains inviteToken query parameter');

    // Parse token from link
    const url = new URL(data.inviteLink);
    generatedInviteToken = url.searchParams.get('inviteToken') || '';
    assert(generatedInviteToken !== '', 'Extracted generated token');

    // Verify Invite database entry
    const dbInvite = await Invite.findOne({ token: generatedInviteToken });
    assert(dbInvite !== null, 'Saved Invite record to MongoDB');
    assert(dbInvite!.email === inviteEmail, 'DB email matches invited address');
    assert(dbInvite!.status === 'pending', 'Status initialized as pending');

    // Verify Simulated Dev Mailbox
    const resMailbox = await fetch(`${baseUrl}/auth/dev/emails`);
    assert(resMailbox.ok, 'Dev mailbox endpoint returned OK');
    const mailboxEmails = await resMailbox.json();
    assert(mailboxEmails.length > 0, 'Dev mailbox received invitation email');
    assert(mailboxEmails[0].to === inviteEmail, 'Mail recipient matched');
    assert(mailboxEmails[0].link === data.inviteLink, 'Mail payload includes correct join link');
  });

  // 4. Invite public details lookup
  await runCase('Verify GET /api/teams/invites/details/:token lookup', async () => {
    const res = await fetch(`${baseUrl}/teams/invites/details/${generatedInviteToken}`);
    assert(res.ok, 'Details lookup returned OK status');
    
    const details = await res.json();
    assert(details.teamName === 'Aether Engineering Team', 'Returned correct team name');
    assert(details.inviterName === 'Alex Rivera Admin', 'Returned correct inviter name');
    assert(details.email === 'jane.invitation@aether.io', 'Returned correct target email');
  });

  // 5. Accept invitation and auto-join
  await runCase('Verify POST /api/teams/invites/accept accepts token and auto-joins team', async () => {
    const inviteEmail = 'jane.invitation@aether.io';

    // 5.1 Create invited user session
    const resUser = await fetch(`${baseUrl}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credential: 'mock_google_jwt_token_invited_user',
        mockName: 'Jane Invitation',
        mockEmail: inviteEmail
      })
    });
    const authData = await resUser.json();
    const inviteeToken = authData.token;

    // 5.2 Attempt to accept invitation with mismatched user first
    const resMismatched = await fetch(`${baseUrl}/teams/invites/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}` // Alex Admin tries to accept Jane's invite
      },
      body: JSON.stringify({ token: generatedInviteToken })
    });
    assert(!resMismatched.ok, 'Accept fails when logged-in user email doesn\'t match');
    const failData = await resMismatched.json();
    assert(failData.error.includes('mismatch') || failData.error.includes('switch accounts') || failData.error.includes('does not match'), 'Correct email mismatch error returned');

    // 5.3 Accept invitation with correct user
    const resSuccess = await fetch(`${baseUrl}/teams/invites/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${inviteeToken}`
      },
      body: JSON.stringify({ token: generatedInviteToken })
    });
    assert(resSuccess.ok, 'Accept invitation succeeded');
    
    // Verify Team members list in DB
    const dbTeam = await Team.findById(createdTeam._id);
    assert(dbTeam !== null, 'Team fetched');
    const isMember = dbTeam!.members.some(m => m.user.toString() === authData.user.id);
    assert(isMember, 'Invited user successfully added to Team members array');

    // Verify Invite status updated
    const dbInvite = await Invite.findOne({ token: generatedInviteToken });
    assert(dbInvite!.status === 'accepted', 'Invite status updated to accepted');
  });

  // Cleanup server and database
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
  await mongoose.connection.close();

  console.log('\n================================================================================');
  console.log('                          E2E TEST HARNESS SUMMARY REPORT');
  console.log('================================================================================');
  const passedCount = results.filter(r => r.passed).length;
  console.log(`  Total Executed Tests : ${results.length}`);
  console.log(`  Passed               : ${passedCount}`);
  console.log(`  Failed               : ${results.length - passedCount}`);
  console.log('================================================================================\n');

  if (passedCount !== results.length) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Trigger directly in ES module scope
runAuthInviteE2ETests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
