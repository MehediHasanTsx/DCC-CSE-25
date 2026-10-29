import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
    passed++;
  } catch (err) {
    console.error(`  \x1b[31m✗\x1b[0m ${name}`);
    console.error(`    \x1b[31m${err.message}\x1b[0m`);
    failed++;
  }
}

async function runSuite() {
  console.log('\n\x1b[1m\x1b[36m=======================================================');
  console.log('       DCC CSE 25 - COMPREHENSIVE AUTOMATED TEST SUITE');
  console.log('=======================================================\x1b[0m\n');

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\x1b[1m1. ACADEMIC GPA & CGPA ENGINE TESTS\x1b[0m');

  function round(val, decimals = 2) {
    const factor = 10 ** decimals;
    return Math.round(val * factor) / factor;
  }

  function calculateSemesterGpa(results) {
    if (results.length === 0) return { totalCredits: 0, earnedCredits: 0, totalGradePoints: 0, gpa: 0 };
    let totalCredits = 0;
    let totalGradePoints = 0;
    let earnedCredits = 0;
    for (const r of results) {
      totalCredits += r.credits;
      totalGradePoints += r.credits * r.gradePoint;
      if (r.gradePoint > 0) earnedCredits += r.credits;
    }
    const gpa = totalCredits > 0 ? round(totalGradePoints / totalCredits) : 0;
    return { totalCredits, earnedCredits, totalGradePoints: round(totalGradePoints), gpa };
  }

  function calculateTargetCgpa(currentCgpa, completedCredits, remainingCredits, targetCgpa) {
    const totalCredits = completedCredits + remainingCredits;
    const currentPoints = currentCgpa * completedCredits;
    const targetPoints = targetCgpa * totalCredits;
    const requiredPoints = targetPoints - currentPoints;
    const requiredGpa = remainingCredits > 0 ? round(requiredPoints / remainingCredits) : 0;
    const isPossible = requiredGpa >= 0 && requiredGpa <= 4.0;
    return { requiredGpa, isPossible };
  }

  test('Calculates semester GPA accurately with standard National University 4.00 scale', () => {
    const sampleResults = [
      { credits: 3.0, gradePoint: 4.00 }, // A+
      { credits: 3.0, gradePoint: 3.75 }, // A
      { credits: 3.0, gradePoint: 3.50 }, // A-
      { credits: 1.5, gradePoint: 4.00 }, // Lab
    ];
    const res = calculateSemesterGpa(sampleResults);
    assert.equal(res.totalCredits, 10.5);
    assert.equal(res.earnedCredits, 10.5);
    // (3*4 + 3*3.75 + 3*3.5 + 1.5*4) / 10.5 = (12 + 11.25 + 10.5 + 6) / 10.5 = 39.75 / 10.5 = 3.7857... -> 3.79
    assert.equal(res.gpa, 3.79);
  });

  test('Handles failed course (0 grade point) without granting earned credits', () => {
    const sampleResults = [
      { credits: 3.0, gradePoint: 3.50 },
      { credits: 3.0, gradePoint: 0.00 }, // F
    ];
    const res = calculateSemesterGpa(sampleResults);
    assert.equal(res.totalCredits, 6.0);
    assert.equal(res.earnedCredits, 3.0);
    assert.equal(res.gpa, 1.75); // 10.5 / 6 = 1.75
  });

  test('Target CGPA calculation determines feasibility correctly', () => {
    // Current: 3.50 with 60 credits. Target: 3.70 with 40 remaining credits.
    // Total credits: 100. Target points: 370. Current points: 210. Remaining needed: 160. Required GPA: 160 / 40 = 4.00.
    const feasible = calculateTargetCgpa(3.50, 60, 40, 3.70);
    assert.equal(feasible.isPossible, true);
    assert.equal(feasible.requiredGpa, 4.00);

    // Impossible target
    const impossible = calculateTargetCgpa(2.50, 60, 40, 3.80);
    assert.equal(impossible.isPossible, false);
    assert.ok(impossible.requiredGpa > 4.0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n\x1b[1m2. ATTENDANCE ENGINE & THRESHOLD TESTS\x1b[0m');

  const CONDUCTED_STATUSES = ['present', 'absent', 'late'];
  const ATTENDED_STATUSES = ['present', 'late'];

  function calculateStats(records) {
    const counts = { present: 0, absent: 0, late: 0, medical: 0, holiday: 0, noClass: 0 };
    for (const r of records) counts[r.status]++;
    const totalConducted = CONDUCTED_STATUSES.reduce((sum, s) => sum + counts[s], 0);
    const attended = ATTENDED_STATUSES.reduce((sum, s) => sum + counts[s], 0);
    const percentage = totalConducted > 0 ? Math.round((attended / totalConducted) * 100) : 100;
    return { totalConducted, attended, percentage };
  }

  function calculateTargetInfo(attended, totalConducted, targetPercent = 80) {
    const currentPercentage = totalConducted > 0 ? Math.round((attended / totalConducted) * 100) : 100;
    const isAboveTarget = currentPercentage >= targetPercent;
    let classesCanMiss = 0;
    let classesNeededToReachTarget = 0;
    if (isAboveTarget) {
      classesCanMiss = Math.floor((attended - (targetPercent / 100) * totalConducted) / (targetPercent / 100));
    } else {
      classesNeededToReachTarget = Math.ceil((targetPercent * totalConducted - 100 * attended) / (100 - targetPercent));
    }
    return { currentPercentage, isAboveTarget, classesCanMiss: Math.max(0, classesCanMiss), classesNeededToReachTarget: Math.max(0, classesNeededToReachTarget) };
  }

  test('Attendance statistics ignore holidays and cancelled classes from conducted count', () => {
    const records = [
      { status: 'present' },
      { status: 'present' },
      { status: 'late' },
      { status: 'absent' },
      { status: 'holiday' },
      { status: 'noClass' },
    ];
    const stats = calculateStats(records);
    assert.equal(stats.totalConducted, 4); // present + present + late + absent
    assert.equal(stats.attended, 3); // present + present + late
    assert.equal(stats.percentage, 75); // 3 / 4 = 75%
  });

  test('Attendance target projection calculates allowable absences when above target', () => {
    // 18 attended out of 20 conducted = 90%. Target is 80%.
    // To stay at or above 80%: (18) / (20 + M) >= 0.8 => 18 >= 16 + 0.8M => 0.8M <= 2 => M <= 2.5 => 2 classes can miss
    const targetInfo = calculateTargetInfo(18, 20, 80);
    assert.equal(targetInfo.isAboveTarget, true);
    assert.equal(targetInfo.classesCanMiss, 2);
  });

  test('Attendance target projection calculates required consecutive classes when below target', () => {
    // 14 attended out of 20 conducted = 70%. Target is 80%.
    // To reach 80%: (14 + N) / (20 + N) >= 0.8 => 14 + N >= 16 + 0.8N => 0.2N >= 2 => N >= 10 classes
    const targetInfo = calculateTargetInfo(14, 20, 80);
    assert.equal(targetInfo.isAboveTarget, false);
    assert.equal(targetInfo.classesNeededToReachTarget, 10);
  });

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n\x1b[1m3. ROUTINE CONFLICT & OVERLAP DETECTION TESTS\x1b[0m');

  function checkOverlap(activities, newStart, newEnd, excludeId) {
    for (const a of activities) {
      if (excludeId && a.id === excludeId) continue;
      if (newStart < a.endTime && newEnd > a.startTime) {
        return a;
      }
    }
    return null;
  }

  test('Detects direct and partial time overlaps accurately', () => {
    const existing = [
      { id: '1', title: 'Data Structures', startTime: '09:00', endTime: '10:30' },
      { id: '2', title: 'Algorithms Lab', startTime: '11:00', endTime: '13:00' },
    ];

    // Inside existing (09:15 - 09:45) -> Conflict
    assert.ok(checkOverlap(existing, '09:15', '09:45'));

    // Partial overlap start (08:30 - 09:30) -> Conflict
    assert.ok(checkOverlap(existing, '08:30', '09:30'));

    // Partial overlap end (10:00 - 10:45) -> Conflict
    assert.ok(checkOverlap(existing, '10:00', '10:45'));

    // Back-to-back non-overlapping (10:30 - 11:00) -> Safe!
    assert.equal(checkOverlap(existing, '10:30', '11:00'), null);

    // Self-edit with excludeId -> Safe!
    assert.equal(checkOverlap(existing, '09:00', '10:30', '1'), null);
  });

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n\x1b[1m4. MOBILE & CAPACITOR NATIVE ARCHITECTURE TESTS\x1b[0m');

  test('capacitor.config.ts has valid configuration pointing to production URL', () => {
    const content = fs.readFileSync(path.join(process.cwd(), 'capacitor.config.ts'), 'utf8');
    assert.ok(content.includes("appId: 'com.dcccse.app'"), 'App ID is configured');
    assert.ok(content.includes("url: 'https://dcc-cse-25.vercel.app/'"), 'Production Vercel URL is active');
    assert.ok(content.includes('LocalNotifications:'), 'LocalNotifications plugin is registered');
  });

  test('AndroidManifest.xml contains all critical background and alarm permissions', () => {
    const manifestPath = path.join(process.cwd(), 'android/app/src/main/AndroidManifest.xml');
    assert.ok(fs.existsSync(manifestPath), 'AndroidManifest.xml exists');
    const content = fs.readFileSync(manifestPath, 'utf8');
    assert.ok(content.includes('android.permission.POST_NOTIFICATIONS'), 'POST_NOTIFICATIONS permission present');
    assert.ok(content.includes('android.permission.SCHEDULE_EXACT_ALARM'), 'SCHEDULE_EXACT_ALARM permission present');
    assert.ok(content.includes('android.permission.RECEIVE_BOOT_COMPLETED'), 'RECEIVE_BOOT_COMPLETED permission present');
    assert.ok(content.includes('android.permission.VIBRATE'), 'VIBRATE permission present');
  });

  test('Hosted APK (dcc-cse-25.apk) exists in public/downloads/ with valid binary payload', () => {
    const apkPath = path.join(process.cwd(), 'public/downloads/dcc-cse-25.apk');
    assert.ok(fs.existsSync(apkPath), 'public/downloads/dcc-cse-25.apk exists');
    const stats = fs.statSync(apkPath);
    assert.ok(stats.size > 1_000_000, `APK file size is valid (${Math.round(stats.size / (1024 * 1024))} MB)`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n\x1b[1m5. ASSET, AUDIO & SOUND UTILITY TESTS\x1b[0m');

  test('Hawk-Cuckoo notification sounds exist in public/sounds directory', () => {
    const mp3 = path.join(process.cwd(), 'public/sounds/common-hawk-cuckoo.mp3');
    const mpeg = path.join(process.cwd(), 'public/sounds/common-hawk-cuckoo.mpeg');
    assert.ok(fs.existsSync(mp3), 'common-hawk-cuckoo.mp3 exists');
    assert.ok(fs.existsSync(mpeg), 'common-hawk-cuckoo.mpeg fallback exists');
  });

  test('PWA manifest icons are in place', () => {
    const icon192 = path.join(process.cwd(), 'public/icon-192.png');
    const icon512 = path.join(process.cwd(), 'public/icon-512.png');
    const manifest = path.join(process.cwd(), 'public/manifest.json');
    assert.ok(fs.existsSync(icon192), 'icon-192.png exists');
    assert.ok(fs.existsSync(icon512), 'icon-512.png exists');
    assert.ok(fs.existsSync(manifest), 'manifest.json exists');
  });

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n=======================================================');
  console.log(`TEST SUMMARY: \x1b[32m${passed} PASSED\x1b[0m, \x1b[31m${failed} FAILED\x1b[0m`);
  console.log('=======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Test Suite encountered an error:', err);
  process.exit(1);
});
