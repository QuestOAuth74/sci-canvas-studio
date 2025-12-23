import { describe, it, expect } from 'vitest';
import { lineIntersection, type LineSegment, type Point } from '@/lib/lineIntersection';
import { createJumpArc } from '@/lib/jumpArcPath';
import { simplifyPath } from '@/lib/pathSimplification';

describe('Path Operations', () => {
  describe('lineIntersection', () => {
    it('should return correct crossing point for intersecting lines', () => {
      const line1: LineSegment = { x1: 0, y1: 0, x2: 10, y2: 10 };
      const line2: LineSegment = { x1: 0, y1: 10, x2: 10, y2: 0 };

      const intersection = lineIntersection(line1, line2);

      expect(intersection).not.toBeNull();
      expect(intersection?.x).toBeCloseTo(5, 1);
      expect(intersection?.y).toBeCloseTo(5, 1);
    });

    it('should return null for parallel lines', () => {
      const line1: LineSegment = { x1: 0, y1: 0, x2: 10, y2: 0 };
      const line2: LineSegment = { x1: 0, y1: 5, x2: 10, y2: 5 };

      const intersection = lineIntersection(line1, line2);

      expect(intersection).toBeNull();
    });

    it('should return null for non-intersecting lines', () => {
      const line1: LineSegment = { x1: 0, y1: 0, x2: 5, y2: 5 };
      const line2: LineSegment = { x1: 10, y1: 10, x2: 15, y2: 15 };

      const intersection = lineIntersection(line1, line2);

      expect(intersection).toBeNull();
    });
  });

  describe('createJumpArc', () => {
    it('should produce valid SVG path string for jump arc', () => {
      const startPoint: Point = { x: 0, y: 10 };
      const endPoint: Point = { x: 20, y: 10 };
      const arcHeight = 5;

      const pathString = createJumpArc(startPoint, endPoint, arcHeight);

      // Verify it's a valid SVG path string
      expect(pathString).toMatch(/^M\s*[\d.]+\s*[\d.]+/); // Starts with M (moveto)
      expect(pathString).toContain('Q'); // Contains Q (quadratic curve) or C (cubic curve)

      // Verify the path starts and ends at correct points
      expect(pathString).toContain('M 0 10'); // Starts at startPoint
      expect(pathString).toMatch(/[\d.]+\s+10$/); // Ends at y=10 (endPoint.y)
    });

    it('should create higher arc for larger arcHeight values', () => {
      const startPoint: Point = { x: 0, y: 10 };
      const endPoint: Point = { x: 20, y: 10 };

      const arc5 = createJumpArc(startPoint, endPoint, 5);
      const arc10 = createJumpArc(startPoint, endPoint, 10);

      // Both should be valid paths
      expect(arc5).toMatch(/^M/);
      expect(arc10).toMatch(/^M/);

      // Arc with height 10 should have different control points than height 5
      expect(arc5).not.toBe(arc10);
    });
  });

  describe('simplifyPath', () => {
    it('should reduce point count within tolerance', () => {
      // Create a path with many points that are nearly collinear
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0.1 },
        { x: 2, y: 0.2 },
        { x: 3, y: 0.1 },
        { x: 4, y: 0 },
        { x: 5, y: 0.1 },
        { x: 6, y: 0.2 },
        { x: 7, y: 0.1 },
        { x: 8, y: 0 },
        { x: 9, y: 0.1 },
        { x: 10, y: 0 },
      ];

      const tolerance = 0.5;
      const simplified = simplifyPath(points, tolerance);

      // Simplified path should have fewer points
      expect(simplified.length).toBeLessThan(points.length);

      // Simplified path should still start and end at same points
      expect(simplified[0]).toEqual(points[0]);
      expect(simplified[simplified.length - 1]).toEqual(points[points.length - 1]);
    });

    it('should preserve important points with tight tolerance', () => {
      // Create a path with a sharp turn
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 5, y: 5 },
        { x: 10, y: 5 },
      ];

      const tolerance = 0.1;
      const simplified = simplifyPath(points, tolerance);

      // With tight tolerance, should preserve all key points
      expect(simplified.length).toBeGreaterThanOrEqual(3);

      // Should preserve start and end
      expect(simplified[0]).toEqual(points[0]);
      expect(simplified[simplified.length - 1]).toEqual(points[points.length - 1]);
    });
  });

  describe.todo('curveFitting', () => {
    // TODO: Implement when curve fitting algorithm is ready
    // Expected behavior:
    // - Takes array of freehand points
    // - Returns smooth Bezier curve path
    // - Produces fewer control points than input points
    // - Curve should pass near all original points within tolerance
  });
});
