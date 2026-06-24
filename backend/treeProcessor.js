/**
 * Core processing logic for the Chitkara Full Stack Engineering Challenge.
 */

/**
 * Parses and processes raw input data to produce structured hierarchies, invalid entries,
 * duplicate edges, and summary metrics.
 * 
 * @param {Array<string>} rawData - The raw input array of connection strings.
 * @returns {Object} The processed response object containing hierarchies, invalid_entries, duplicate_edges, and summary.
 */
function processInputData(rawData) {
  const invalidEntries = [];
  const duplicateEdges = [];
  const validEdges = []; // array of { parent, child, originalString }
  const seenEdges = new Set(); // set of parent->child

  // 1. Validation & Duplicate Filter
  if (Array.isArray(rawData)) {
    for (const entry of rawData) {
      if (typeof entry !== 'string') {
        invalidEntries.push(String(entry));
        continue;
      }

      const trimmed = entry.trim();
      
      // Validate pattern X->Y where X and Y are uppercase letters
      const match = trimmed.match(/^([A-Z])->([A-Z])$/);
      if (!match) {
        invalidEntries.push(entry);
        continue;
      }

      const parent = match[1];
      const child = match[2];

      // Self-loop check
      if (parent === child) {
        invalidEntries.push(entry);
        continue;
      }

      // Check for duplicate edges
      const edgeKey = `${parent}->${child}`;
      if (seenEdges.has(edgeKey)) {
        // Push subsequent occurrences once each
        if (!duplicateEdges.includes(edgeKey)) {
          duplicateEdges.push(edgeKey);
        }
      } else {
        seenEdges.add(edgeKey);
        validEdges.push({ parent, child, originalString: trimmed });
      }
    }
  }

  // 2. Multi-Parent Resolution (First parent wins)
  const activeEdges = []; // edges used for tree construction
  const parentOf = {}; // child -> parent mapping
  
  for (const edge of validEdges) {
    const { parent, child } = edge;
    if (parentOf[child]) {
      // Subsequent parent edges for this child are silently discarded
      continue;
    }
    parentOf[child] = parent;
    activeEdges.push(edge);
  }

  // 3. Find Connected Components (Undirected)
  // Gather all unique nodes involved in active edges
  const allNodes = new Set();
  for (const edge of activeEdges) {
    allNodes.add(edge.parent);
    allNodes.add(edge.child);
  }

  // Build undirected adjacency list
  const adj = {};
  for (const node of allNodes) {
    adj[node] = [];
  }
  for (const edge of activeEdges) {
    adj[edge.parent].push(edge.child);
    adj[edge.child].push(edge.parent);
  }

  // Traverse to find components
  const visited = new Set();
  const components = []; // array of Set(nodes)

  // Find components in order of appearance of their first active edge
  for (const edge of activeEdges) {
    if (!visited.has(edge.parent) || !visited.has(edge.child)) {
      const component = new Set();
      const queue = [edge.parent];
      visited.add(edge.parent);

      while (queue.length > 0) {
        const curr = queue.shift();
        component.add(curr);
        
        for (const neighbor of adj[curr]) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
      components.push(component);
    }
  }

  // 4. Construct Hierarchies for each Component
  const hierarchies = [];

  for (const component of components) {
    // Determine if there is a node with in-degree 0 in this component
    const rootsInComponent = [];
    for (const node of component) {
      if (!parentOf[node]) {
        rootsInComponent.push(node);
      }
    }

    if (rootsInComponent.length > 0) {
      // It's a valid non-cyclic tree (rootsInComponent should have exactly 1 element)
      const root = rootsInComponent[0];
      
      // Helper function to build nested tree recursively
      const buildTree = (node) => {
        // Find all children of this node
        const children = [];
        for (const child in parentOf) {
          if (parentOf[child] === node && component.has(child)) {
            children.push(child);
          }
        }
        children.sort(); // sort children lexicographically for deterministic output
        
        const nodeTree = {};
        for (const child of children) {
          nodeTree[child] = buildTree(child);
        }
        return nodeTree;
      };

      // Helper function to calculate depth (number of nodes on longest path)
      const getDepth = (node) => {
        const children = [];
        for (const child in parentOf) {
          if (parentOf[child] === node && component.has(child)) {
            children.push(child);
          }
        }
        if (children.length === 0) return 1;
        
        let maxChildDepth = 0;
        for (const child of children) {
          maxChildDepth = Math.max(maxChildDepth, getDepth(child));
        }
        return 1 + maxChildDepth;
      };

      const treeStructure = {};
      treeStructure[root] = buildTree(root);

      hierarchies.push({
        root: root,
        tree: treeStructure,
        depth: getDepth(root)
      });
    } else {
      // It's a cyclic group (no node has in-degree 0)
      // Root: Lexicographically smallest node in the component
      const sortedNodes = Array.from(component).sort();
      const root = sortedNodes[0];

      hierarchies.push({
        root: root,
        tree: {},
        has_cycle: true
      });
    }
  }

  // 5. Calculate Summary Statistics
  let totalTrees = 0;
  let totalCycles = 0;
  let maxDepth = -1;
  let largestTreeRoot = "";

  for (const h of hierarchies) {
    if (h.has_cycle) {
      totalCycles++;
    } else {
      totalTrees++;
      if (h.depth > maxDepth) {
        maxDepth = h.depth;
        largestTreeRoot = h.root;
      } else if (h.depth === maxDepth) {
        // Tiebreaker: lexicographically smaller root wins
        if (h.root < largestTreeRoot) {
          largestTreeRoot = h.root;
        }
      }
    }
  }

  return {
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary: {
      total_trees: totalTrees,
      total_cycles: totalCycles,
      largest_tree_root: largestTreeRoot
    }
  };
}

module.exports = {
  processInputData
};
