// Extended automated test suite for CampusFlix Phase 1-13 Enhancements
const BASE_URL = "http://localhost:5000/api";

async function runEnhancementTests() {
  console.log("==================================================================");
  console.log("       CAMPUSFLIX - ENHANCEMENTS VERIFICATION TEST SUITE          ");
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // PHASE 1 & 2: Manual Match Check API & Smart Explanation
    // -------------------------------------------------------------
    console.log("--- PHASE 1 & 2: Manual Match Check & Explanation ---");
    // Seed a lost item to match against
    const seedLost = await fetch(`${BASE_URL}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemName: "Blue Dell Inspiron Laptop Charger",
        type: "Lost",
        category: "Electronics",
        description: "65W Dell barrel pin power adapter with blue velcro tie",
        location: "Computer Labs 301-304",
        date: new Date().toISOString().slice(0, 10),
        contact: "tech.student@mitaoe.ac.in",
        imageUrl: ""
      })
    }).then(r => r.json());

    assert(seedLost.success && seedLost.data._id, "Seed lost item created for match check.");

    // Verify mandatory photo required before checking matches for Found items
    const blockedCheck = await fetch(`${BASE_URL}/matches/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemName: "Dell Laptop Charger 65W",
        category: "Electronics",
        description: "Dell round pin charger cable found under desk",
        location: "Computer Labs 301-304",
        date: new Date().toISOString().slice(0, 10),
        type: "Found",
        imageUrl: ""
      })
    }).then(r => r.json());
    assert(blockedCheck.success === false, "Found item match check blocked when photograph is missing.");

    // Call /api/matches/check with valid photograph
    const checkRes = await fetch(`${BASE_URL}/matches/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemName: "Dell Laptop Charger 65W",
        category: "Electronics",
        description: "Dell round pin charger cable found under desk",
        location: "Computer Labs 301-304",
        date: new Date().toISOString().slice(0, 10),
        type: "Found",
        imageUrl: "/uploads/dell-charger.jpg"
      })
    }).then(r => r.json());

    assert(checkRes.success === true && Array.isArray(checkRes.data), "/api/matches/check returns matches list.");
    const chargerMatch = checkRes.data.find(m => String(m.item._id) === String(seedLost.data._id));
    assert(chargerMatch && chargerMatch.confidenceScore >= 60, "Found matching candidate with confidence score >= 60%.");
    assert(
      chargerMatch?.explanation &&
      Array.isArray(chargerMatch.explanation.reasons) &&
      chargerMatch.explanation.reasons.length > 0 &&
      chargerMatch.explanation.disclaimer,
      "Smart match explanation includes specific reasons and ownership disclaimer."
    );

    // -------------------------------------------------------------
    // PHASE 3: Duplicate Report Detection
    // -------------------------------------------------------------
    console.log("\n--- PHASE 3: Duplicate Report Detection ---");
    const dupCheckRes = await fetch(`${BASE_URL}/items/check-duplicate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemName: "Blue Dell Inspiron Laptop Charger",
        category: "Electronics",
        description: "Dell power adapter barrel pin",
        location: "Computer Labs 301-304",
        date: new Date().toISOString().slice(0, 10),
        type: "Lost"
      })
    }).then(r => r.json());

    assert(
      dupCheckRes.success === true && dupCheckRes.hasDuplicate === true,
      "Duplicate report correctly flagged with hasDuplicate === true."
    );
    assert(
      dupCheckRes.existingItem && dupCheckRes.existingItem.itemName.includes("Dell"),
      "Duplicate check returns existing report details for user review."
    );
    assert(!dupCheckRes.existingItem.contact, "Duplicate check protects reporter privacy (no contact exposed).");

    // Check with completely unique item
    const uniqueCheckRes = await fetch(`${BASE_URL}/items/check-duplicate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemName: "Ancient Roman Coin Replica 999",
        category: "Other",
        description: "Special coin replica never seen before",
        location: "Main Gate",
        date: new Date().toISOString().slice(0, 10),
        type: "Lost"
      })
    }).then(r => r.json());
    assert(
      uniqueCheckRes.success === true && uniqueCheckRes.hasDuplicate === false,
      "Unique item reports no duplicate."
    );

    // -------------------------------------------------------------
    // PHASE 5 & 10: Ownership Checks on Edit and Delete
    // -------------------------------------------------------------
    console.log("\n--- PHASE 5 & 10: Item Ownership Security ---");
    // User A posts an item
    const itemOwner = "owner.charlie@mitaoe.ac.in";
    const charlieItem = await fetch(`${BASE_URL}/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-data": JSON.stringify({ email: itemOwner, role: "student", id: "user-charlie-1" })
      },
      body: JSON.stringify({
        itemName: "Charlie's Scientific Calculator",
        type: "Lost",
        category: "Electronics",
        description: "Grey Casio fx-82MS with Charlie sticker",
        location: "Central Library",
        date: new Date().toISOString().slice(0, 10),
        contact: itemOwner,
        imageUrl: ""
      })
    }).then(r => r.json());

    const charlieItemId = charlieItem.data._id;

    // User B attempts to edit Charlie's item
    const attackerRes = await fetch(`${BASE_URL}/items/${charlieItemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-data": JSON.stringify({ email: "attacker.bob@mitaoe.ac.in", role: "student", id: "user-bob-2" })
      },
      body: JSON.stringify({
        itemName: "Hacked Item Name"
      })
    });
    assert(attackerRes.status === 403, "Student B forbidden from editing Student A's report (403 Forbidden).");

    // User B attempts to delete Charlie's item
    const attackerDeleteRes = await fetch(`${BASE_URL}/items/${charlieItemId}`, {
      method: "DELETE",
      headers: {
        "x-user-data": JSON.stringify({ email: "attacker.bob@mitaoe.ac.in", role: "student", id: "user-bob-2" })
      }
    });
    assert(attackerDeleteRes.status === 403, "Student B forbidden from deleting Student A's report (403 Forbidden).");

    // Charlie can edit their own item
    const charlieEditRes = await fetch(`${BASE_URL}/items/${charlieItemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-data": JSON.stringify({ email: itemOwner, role: "student", id: "user-charlie-1" })
      },
      body: JSON.stringify({
        description: "Updated: Grey Casio fx-82MS with Charlie sticker and blue mark"
      })
    }).then(r => r.json());
    assert(charlieEditRes.success === true, "Owner successfully allowed to edit their own report.");

    // -------------------------------------------------------------
    // PHASE 7: QR-Based Claim Handover Lifecycle
    // -------------------------------------------------------------
    console.log("\n--- PHASE 7: QR-Based Claim Handover Lifecycle ---");
    // 1. Post a Found item
    const foundWatch = await fetch(`${BASE_URL}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemName: "Titan Neo Chronograph Watch",
        type: "Found",
        category: "Accessories",
        description: "Brown leather strap with silver dial found near water cooler",
        location: "Central Library",
        date: new Date().toISOString().slice(0, 10),
        contact: "finder.watch@mitaoe.ac.in",
        imageUrl: "/uploads/titan-watch.jpg"
      })
    }).then(r => r.json());

    // 2. Submit a Claim
    const claimantEmail = "claimant.david@mitaoe.ac.in";
    const claimRes = await fetch(`${BASE_URL}/claims`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-data": JSON.stringify({ email: claimantEmail, name: "David M", role: "student" })
      },
      body: JSON.stringify({
        foundItemId: foundWatch.data._id,
        claimantName: "David M",
        claimantEmail: claimantEmail,
        verificationDetails: "Engraved initials DM on the buckle and scratch on 4 o'clock glass."
      })
    }).then(r => r.json());

    assert(claimRes.success === true && claimRes.data._id, "Claim submitted successfully.");
    const claimId = claimRes.data._id;

    // 3. Admin approves claim -> triggers unique claimReference generation
    const approveRes = await fetch(`${BASE_URL}/claims/${claimId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-admin-123",
        "x-user-data": JSON.stringify({ role: "admin", email: "admin@mitaoe.ac.in" })
      },
      body: JSON.stringify({
        status: "approved",
        reviewNotes: "Ownership verified by matching initials on buckle."
      })
    }).then(r => r.json());

    assert(
      approveRes.success === true &&
      approveRes.data.status === "approved" &&
      approveRes.data.claimReference &&
      approveRes.data.claimReference.startsWith("CLM-"),
      `Claim approved and unique reference generated: ${approveRes.data?.claimReference}.`
    );
    const claimRef = approveRes.data.claimReference;

    // Item should NOT be returned yet! Handover is still pending
    const checkItemBeforeHandover = await fetch(`${BASE_URL}/items/${foundWatch.data._id}`).then(r => r.json());
    assert(
      checkItemBeforeHandover.data.status !== "Returned",
      "Item remains active before physical security handover confirmation."
    );

    // 4. Security Desk scans/verifies claim reference
    const verifyRefRes = await fetch(`${BASE_URL}/claims/verify-ref/${claimRef}`).then(r => r.json());
    assert(
      verifyRefRes.success === true &&
      verifyRefRes.data.claim.claimReference === claimRef &&
      verifyRefRes.data.isHandoverCompleted === false,
      "Security claim verification endpoint resolves valid pending claim."
    );
    assert(
      !verifyRefRes.data.claim.verificationDetails,
      "Verification response does not leak private claimant answers."
    );

    // 5. Security completes physical handover
    const handoverRes = await fetch(`${BASE_URL}/claims/complete-handover`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-admin-123",
        "x-user-data": JSON.stringify({ role: "admin", email: "security.desk@mitaoe.ac.in", name: "Officer R. Sharma" })
      },
      body: JSON.stringify({ claimReference: claimRef })
    }).then(r => r.json());

    assert(
      handoverRes.success === true &&
      handoverRes.data.handoverStatus === "handed_over" &&
      handoverRes.data.handoverBy.includes("Officer R. Sharma"),
      "Handover confirmed by security officer with timestamp."
    );

    // 6. Item is now marked Returned!
    const checkItemAfterHandover = await fetch(`${BASE_URL}/items/${foundWatch.data._id}`).then(r => r.json());
    assert(
      checkItemAfterHandover.data.status === "Returned",
      "Item status transitioned to 'Returned' upon physical handover confirmation."
    );

    // 7. Prevent reuse of completed claim reference
    const reuseAttempt = await fetch(`${BASE_URL}/claims/complete-handover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimReference: claimRef })
    });
    const reuseJson = await reuseAttempt.json();
    assert(
      reuseAttempt.status === 400 && reuseJson.message.includes("already been verified"),
      "Reusing an already handed over claim reference is rejected with 400."
    );

    // -------------------------------------------------------------
    // PHASE 8: Notification Preferences
    // -------------------------------------------------------------
    console.log("\n--- PHASE 8: User Notification Preferences ---");
    const testUserEmail = "pref.student@mitaoe.ac.in";
    const getPrefRes = await fetch(`${BASE_URL}/notifications/preferences?userEmail=${testUserEmail}`).then(r => r.json());
    assert(
      getPrefRes.success === true &&
      getPrefRes.data.potentialMatches === true &&
      getPrefRes.data.claimUpdates === true,
      "Notification preferences retrieved with default values."
    );

    // Update preferences (turn off unresolved reminders)
    const updatePrefRes = await fetch(`${BASE_URL}/notifications/preferences`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-data": JSON.stringify({ email: testUserEmail, role: "student" })
      },
      body: JSON.stringify({
        unresolvedReminders: false,
        potentialMatches: true
      })
    }).then(r => r.json());

    assert(
      updatePrefRes.success === true &&
      updatePrefRes.data.unresolvedReminders === false &&
      updatePrefRes.data.claimUpdates === true,
      "Preferences updated: optional alerts toggled off while mandatory claimUpdates remain true."
    );

    // -------------------------------------------------------------
    // PHASE 9: Admin Dashboard Analytics
    // -------------------------------------------------------------
    console.log("\n--- PHASE 9: Admin Live Analytics Aggregations ---");
    const analyticsRes = await fetch(`${BASE_URL}/admin/analytics`, {
      headers: {
        Authorization: "Bearer token-admin-123",
        "x-user-data": JSON.stringify({ role: "admin", email: "admin@mitaoe.ac.in" })
      }
    }).then(r => r.json());

    assert(analyticsRes.success === true && analyticsRes.data, "Admin analytics retrieved successfully.");
    const data = analyticsRes.data;
    const summary = data.summary;
    assert(
      typeof summary.totalLost === "number" &&
      typeof summary.totalFound === "number" &&
      typeof summary.totalReturned === "number" &&
      typeof summary.activeUnresolved === "number" &&
      typeof summary.pendingClaims === "number",
      "Analytics KPI summary counts computed from actual records."
    );
    assert(
      Array.isArray(data.monthlyComparison) &&
      Array.isArray(data.categoryDistribution) &&
      Array.isArray(data.campusHotspots) &&
      typeof data.unresolvedByPriority === "object",
      "Analytics visual breakdown structures (monthly, category, hotspots, priorities) present."
    );
    console.log(`Analytics summary: Lost: ${summary.totalLost}, Found: ${summary.totalFound}, Returned: ${summary.totalReturned}, Hotspots: ${data.campusHotspots.length}`);

  } catch (err) {
    console.error("Enhancement test exception:", err);
    failed++;
  }

  console.log("\n==================================================================");
  console.log(`ENHANCEMENT SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) process.exit(1);
}

runEnhancementTests();
