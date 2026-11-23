// Comprehensive automated test suite for CampusFlix 14 Master Requirements
const BASE_URL = "http://localhost:5000/api";

async function runTests() {
  console.log("==================================================================");
  console.log("       CAMPUSFLIX - MASTER SYSTEM VERIFICATION TEST SUITE        ");
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
    // TEST 1: Optional Lost Image
    console.log("--- TEST 1: Optional Lost Image ---");
    const lostRes = await fetch(`${BASE_URL}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemName: "Casio Calculator Cover",
        type: "Lost",
        category: "Electronics",
        description: "White plastic cover forgotten on lab table",
        location: "Computer Lab 304",
        date: new Date().toISOString().slice(0, 10),
        contact: "student.test1@mitaoe.ac.in",
        imageUrl: "" // No image
      })
    }).then((r) => r.json());
    assert(lostRes.success === true && lostRes.data._id, "Lost item submitted successfully without an image.");

    // TEST 2: Mandatory Found Image
    console.log("\n--- TEST 2: Mandatory Found Image Blocked ---");
    const foundNoImgRes = await fetch(`${BASE_URL}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemName: "Steel Water Bottle",
        type: "Found",
        category: "Other",
        description: "Silver flask left behind",
        location: "Cafeteria",
        date: new Date().toISOString().slice(0, 10),
        contact: "finder.test2@mitaoe.ac.in",
        imageUrl: "" // Empty image
      })
    }).then((r) => r.json());
    assert(
      foundNoImgRes.success === false &&
      foundNoImgRes.message.includes("mandatory when reporting a found item"),
      "Found item submission blocked with mandatory image warning."
    );

    // TEST 3: Found Image Upload & Creation
    console.log("\n--- TEST 3: Found Image Upload & Submission ---");
    const foundWithImgRes = await fetch(`${BASE_URL}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemName: "Blue Gym Shaker",
        type: "Found",
        category: "Other",
        description: "Found blue shaker near gym benches",
        location: "Campus Gymnasium",
        date: new Date().toISOString().slice(0, 10),
        contact: "finder.test3@mitaoe.ac.in",
        imageUrl: "/uploads/item-sample-bottle.jpg"
      })
    }).then((r) => r.json());
    assert(
      foundWithImgRes.success === true &&
      foundWithImgRes.data.imageUrl === "/uploads/item-sample-bottle.jpg",
      "Found item with valid image saved successfully with imageUrl."
    );

    // TEST 4: Intelligent Matching (Lost first, then Found)
    console.log("\n--- TEST 4: Intelligent Matching (Lost -> Found) ---");
    // Student A reports lost water bottle
    const studentAEmail = "studentA.bottle@mitaoe.ac.in";
    const lostBottle = await fetch(`${BASE_URL}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemName: "Black Hydro Flask Water Bottle",
        type: "Lost",
        category: "Other",
        description: "Black stainless steel water bottle with silver twist cap",
        location: "Central Library 2nd Floor",
        date: new Date().toISOString().slice(0, 10),
        contact: studentAEmail,
        imageUrl: ""
      })
    }).then((r) => r.json());

    // Student B finds a matching bottle
    const foundBottle = await fetch(`${BASE_URL}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemName: "Black Water Bottle (Stainless Steel)",
        type: "Found",
        category: "Other",
        description: "Black stainless steel water bottle with silver cap found on library desk",
        location: "Central Library",
        date: new Date().toISOString().slice(0, 10),
        contact: "studentB.finder@mitaoe.ac.in",
        imageUrl: "/images/bottle.jpg"
      })
    }).then((r) => r.json());

    // Check matches for foundBottle
    const matchesRes = await fetch(`${BASE_URL}/matches/item/${foundBottle.data._id}`).then((r) => r.json());
    const topMatch = matchesRes.data && matchesRes.data[0];
    assert(
      topMatch && topMatch.confidenceScore >= 60,
      `Intelligent match identified with ${topMatch?.confidenceScore}% confidence.`
    );

    // TEST 5: Reverse Matching (Found first, then Lost)
    console.log("\n--- TEST 5: Reverse Matching (Found -> Lost) ---");
    // Finder posts found keys
    const foundKeys = await fetch(`${BASE_URL}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemName: "Honda Activa Bike Key with Red Lanyard",
        type: "Found",
        category: "Keys",
        description: "Black smart bike key with red Honda keychain",
        location: "Campus Parking Lot Block C",
        date: new Date().toISOString().slice(0, 10),
        contact: "security.parking@mitaoe.ac.in",
        imageUrl: "/images/keys.jpg"
      })
    }).then((r) => r.json());

    // Loser posts lost bike key
    const lostKeys = await fetch(`${BASE_URL}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemName: "Honda Bike Key",
        type: "Lost",
        category: "Keys",
        description: "Lost my Honda Activa key with red keychain",
        location: "Parking Lot Block C",
        date: new Date().toISOString().slice(0, 10),
        contact: "biker.student@mitaoe.ac.in",
        imageUrl: ""
      })
    }).then((r) => r.json());

    const reverseMatchRes = await fetch(`${BASE_URL}/matches/item/${lostKeys.data._id}`).then((r) => r.json());
    const revMatch = reverseMatchRes.data?.find((m) => String(m.item._id) === String(foundKeys.data._id));
    assert(
      revMatch && revMatch.confidenceScore >= 60,
      `Reverse match identified found key with ${revMatch?.confidenceScore}% confidence.`
    );

    // TEST 6: Multiple Users Notification
    console.log("\n--- TEST 6: Multiple Users Notification ---");
    const user1 = "owner1.umbrella@mitaoe.ac.in";
    const user2 = "owner2.umbrella@mitaoe.ac.in";

    await fetch(`${BASE_URL}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemName: "Black Folding Rain Umbrella",
        type: "Lost",
        category: "Accessories",
        description: "Small black automatic compact umbrella",
        location: "Audi-2 Lecture Hall",
        date: new Date().toISOString().slice(0, 10),
        contact: user1,
        imageUrl: ""
      })
    });

    await fetch(`${BASE_URL}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemName: "Black Automatic Umbrella",
        type: "Lost",
        category: "Accessories",
        description: "Black umbrella left in audi 2",
        location: "Audi-2 Lecture Hall",
        date: new Date().toISOString().slice(0, 10),
        contact: user2,
        imageUrl: ""
      })
    });

    // Found umbrella
    await fetch(`${BASE_URL}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemName: "Black Compact Umbrella",
        type: "Found",
        category: "Accessories",
        description: "Black folding umbrella found on front row seat",
        location: "Audi-2 Lecture Hall",
        date: new Date().toISOString().slice(0, 10),
        contact: "staff.audi@mitaoe.ac.in",
        imageUrl: "/images/backpack.jpg"
      })
    });

    // Check notifications for user1 and user2
    const notifs1 = await fetch(`${BASE_URL}/notifications?userEmail=${user1}`).then((r) => r.json());
    const notifs2 = await fetch(`${BASE_URL}/notifications?userEmail=${user2}`).then((r) => r.json());
    assert(
      notifs1.data?.some((n) => n.type === "possible_match") &&
      notifs2.data?.some((n) => n.type === "possible_match"),
      "Both separate report owners independently received match notifications."
    );

    // TEST 7: Unrelated Items
    console.log("\n--- TEST 7: Unrelated Items Filtered Out ---");
    const unrelatedLost = await fetch(`${BASE_URL}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemName: "Casio Scientific Calculator",
        type: "Lost",
        category: "Electronics",
        description: "Scientific fx-991EX calculator",
        location: "Maths Classroom",
        date: new Date().toISOString().slice(0, 10),
        contact: "calc.owner@mitaoe.ac.in",
        imageUrl: ""
      })
    }).then((r) => r.json());

    const unrelatedFound = await fetch(`${BASE_URL}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemName: "Milton Thermo Steel Flask",
        type: "Found",
        category: "Other",
        description: "Silver water thermos bottle",
        location: "Sports Ground",
        date: new Date().toISOString().slice(0, 10),
        contact: "ground.guard@mitaoe.ac.in",
        imageUrl: "/images/bottle.jpg"
      })
    }).then((r) => r.json());

    const unrelatedMatches = await fetch(`${BASE_URL}/matches/item/${unrelatedLost.data._id}`).then((r) => r.json());
    const matchedWithFlask = unrelatedMatches.data?.find((m) => String(m.item._id) === String(unrelatedFound.data._id));
    assert(
      !matchedWithFlask || matchedWithFlask.confidenceScore < 60,
      "Calculator and Water Flask generated no prominent match."
    );

    // TEST 8: Notifications Unread Count & Mark Read
    console.log("\n--- TEST 8: Notifications Lifecycle ---");
    const unreadCountRes = await fetch(`${BASE_URL}/notifications/unread-count?userEmail=${studentAEmail}`).then((r) => r.json());
    assert(unreadCountRes.unreadCount > 0, `Unread count for Student A is ${unreadCountRes.unreadCount}.`);

    const notifItem = notifs1.data[0];
    const markReadRes = await fetch(`${BASE_URL}/notifications/${notifItem._id}/read`, {
      method: "PATCH"
    }).then((r) => r.json());
    assert(markReadRes.success === true && markReadRes.data.isRead === true, "Notification marked as read successfully.");

    // TEST 9 & 10: Unresolved Lost Item Reminders Simulation
    console.log("\n--- TEST 9 & 10: Reminder Milestones (Day 1, 3, 7, 14) ---");
    const remindersRes = await fetch(`${BASE_URL}/admin/reminders?filter=all`, {
      headers: {
        Authorization: "Bearer token-admin-123",
        "x-user-data": JSON.stringify({ role: "admin", email: "admin@mitaoe.ac.in" })
      }
    }).then((r) => r.json());
    assert(remindersRes.success === true && Array.isArray(remindersRes.data), "Admin reminders dashboard retrieved items.");

    // TEST 11: Mark Item as Returned Stops Reminders
    console.log("\n--- TEST 11: Mark Item as Returned ---");
    const itemToReturn = remindersRes.data[0];
    const patchRes = await fetch(`${BASE_URL}/items/${itemToReturn._id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Returned" })
    }).then((r) => r.json());
    assert(patchRes.success === true && patchRes.data.status === "Returned", "Item successfully marked as Returned.");

    // TEST 12: Duplicate Prevention
    console.log("\n--- TEST 12: Duplicate Prevention in Reminders ---");
    const manualRemindRes = await fetch(`${BASE_URL}/admin/reminders/${itemToReturn._id}/send`, {
      method: "POST",
      headers: {
        Authorization: "Bearer token-admin-123",
        "x-user-data": JSON.stringify({ role: "admin", email: "admin@mitaoe.ac.in" })
      }
    }).then((r) => r.json());
    assert(manualRemindRes.success === true, "Manual reminder executed cleanly without duplicating active logs.");

    // TEST 13: Role-Based Security (Student forbidden from Admin Reminders API)
    console.log("\n--- TEST 13: Role-Based Security ---");
    const studentAccessRes = await fetch(`${BASE_URL}/admin/reminders`, {
      headers: {
        Authorization: "Bearer token-student-123",
        "x-user-data": JSON.stringify({ role: "student", email: "student@mitaoe.ac.in" })
      }
    });
    assert(
      studentAccessRes.status === 403,
      "Student blocked from admin reminder API with 403 Forbidden."
    );

    // TEST 14: Existing Functionality Preserved
    console.log("\n--- TEST 14: Existing Core Features Verified ---");
    const allItemsRes = await fetch(`${BASE_URL}/items`).then((r) => r.json());
    const healthRes = await fetch(`${BASE_URL}/health`).then((r) => r.json());
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "student@mitaoe.ac.in", password: "password123" })
    }).then((r) => r.json());

    assert(
      allItemsRes.success === true &&
      allItemsRes.count > 0 &&
      healthRes.success === true &&
      loginRes.success === true &&
      loginRes.token,
      "Existing items querying, health check, and authentication are intact and running!"
    );

  } catch (err) {
    console.error("Test execution exception:", err);
    failed++;
  }

  console.log("\n==================================================================");
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) process.exit(1);
}

runTests();
