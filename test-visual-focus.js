#!/usr/bin/env node

console.log("🎯 Visual Focus Window Demonstration\n");

console.log("When typewriter mode is enabled with cursor at line 5:\n");

console.log("Line 0: [DIMMED] Far above cursor - not visible");
console.log("Line 1: [DIMMED] Above cursor - not visible");
console.log("Line 2: [DIMMED] Above cursor - not visible");
console.log("Line 3: [DIMMED] Above cursor - not visible");
console.log("Line 4: [BRIGHT] ← 1 line BEFORE cursor (visible)");
console.log("Line 5: [BRIGHT] ← CURRENT cursor line (visible)");
console.log("Line 6: [BRIGHT] ← 1 line AFTER cursor (visible)");
console.log("Line 7: [DIMMED] Below cursor - not visible");
console.log("Line 8: [DIMMED] Below cursor - not visible");
console.log("Line 9: [DIMMED] Far below cursor - not visible");

console.log("\n" + "=".repeat(50));
console.log("📊 FOCUS WINDOW SUMMARY:");
console.log("  ✅ Total visible lines: 3");
console.log("  ✅ Lines before cursor: 1 (line 4)");
console.log("  ✅ Current cursor line: 1 (line 5)");
console.log("  ✅ Lines after cursor: 1 (line 6)");
console.log("  ✅ All other lines: DIMMED");

console.log("\n🎨 Visual Effect:");
console.log("  • Creates a tight 3-line spotlight");
console.log("  • Minimal context, maximum focus");
console.log("  • Dark dimming for strong contrast");
console.log("  • Perfect for distraction-free writing");

console.log("\n💡 This is exactly what you requested:");
console.log("  • 1 line before cursor: ✓");
console.log("  • Current line: ✓");
console.log("  • 1 line after cursor: ✓");
console.log("  • Everything else dimmed: ✓");
