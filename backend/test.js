const assert = require('assert');
const { processInputData } = require('./treeProcessor');

function runTests() {
  console.log("Running backend tests...\n");

  // Test Case 1: The Example Request from Challenge PDF
  console.log("Test Case 1: Example Request from Challenge PDF");
  const test1Input = [
    "A->B", "A->C", "B->D", "C->E", "E->F",
    "X->Y", "Y->Z", "Z->X",
    "P->Q", "Q->R",
    "G->H", "G->H", "G->I",
    "hello", "1->2", "A->"
  ];
  
  const res1 = processInputData(test1Input);

  // Assert invalid entries are identified
  assert.deepStrictEqual(res1.invalid_entries, ["hello", "1->2", "A->"]);
  console.log("  ✓ Invalid entries correctly identified");

  // Assert duplicate edges are identified once each
  assert.deepStrictEqual(res1.duplicate_edges, ["G->H"]);
  console.log("  ✓ Duplicate edges correctly identified");

  // Assert summary statistics
  assert.strictEqual(res1.summary.total_trees, 3);
  assert.strictEqual(res1.summary.total_cycles, 1);
  assert.strictEqual(res1.summary.largest_tree_root, "A");
  console.log("  ✓ Summary statistics correct");

  // Check hierarchies array size
  assert.strictEqual(res1.hierarchies.length, 4);
  console.log("  ✓ Hierarchies array size matches");

  // Check details of the first hierarchy (A)
  const hA = res1.hierarchies.find(h => h.root === "A");
  assert.ok(hA, "Root A hierarchy should exist");
  assert.strictEqual(hA.depth, 4);
  assert.deepStrictEqual(hA.tree, {
    "A": {
      "B": { "D": {} },
      "C": {
        "E": { "F": {} }
      }
    }
  });
  assert.strictEqual(hA.has_cycle, undefined);
  console.log("  ✓ Tree A depth and structure correct");

  // Check details of the second hierarchy (X)
  const hX = res1.hierarchies.find(h => h.root === "X");
  assert.ok(hX, "Root X hierarchy should exist");
  assert.strictEqual(hX.has_cycle, true);
  assert.deepStrictEqual(hX.tree, {});
  assert.strictEqual(hX.depth, undefined);
  console.log("  ✓ Component X cycle correct");

  // Test Case 2: Multi-parent resolution (First-parent wins)
  console.log("\nTest Case 2: Multi-parent (First-parent wins)");
  // A->D is first, B->D is second. B->D should be discarded.
  const test2Input = ["A->D", "B->D", "B->C"];
  const res2 = processInputData(test2Input);
  
  // A->D and B->C should form two separate trees: root A (A->D) and root B (B->C).
  // Node D will be part of root A's tree. B->D is discarded, so B is not a parent of D.
  assert.strictEqual(res2.summary.total_trees, 2);
  const hA2 = res2.hierarchies.find(h => h.root === "A");
  const hB2 = res2.hierarchies.find(h => h.root === "B");
  assert.ok(hA2);
  assert.ok(hB2);
  assert.deepStrictEqual(hA2.tree, { "A": { "D": {} } });
  assert.deepStrictEqual(hB2.tree, { "B": { "C": {} } });
  console.log("  ✓ Multi-parent edge discarded successfully, forming independent trees");

  // Test Case 3: Trimming whitespace
  console.log("\nTest Case 3: Whitespace trimming");
  const test3Input = ["  A->B  ", "  C->D "];
  const res3 = processInputData(test3Input);
  assert.strictEqual(res3.invalid_entries.length, 0);
  assert.strictEqual(res3.summary.total_trees, 2);
  console.log("  ✓ Whitespace trimmed and validated correctly");

  // Test Case 4: Self loop invalidation
  console.log("\nTest Case 4: Self loop validation");
  const test4Input = ["A->A"];
  const res4 = processInputData(test4Input);
  assert.deepStrictEqual(res4.invalid_entries, ["A->A"]);
  assert.strictEqual(res4.summary.total_trees, 0);
  console.log("  ✓ Self loops categorized as invalid");

  console.log("\nAll backend tests passed successfully!");
}

try {
  runTests();
} catch (error) {
  console.error("\nTest failed!");
  console.error(error);
  process.exit(1);
}
