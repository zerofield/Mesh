using UnityEngine;
using System.Collections.Generic;
using System.Collections;

public class TerrainGenerator : MonoBehaviour
{
    private Mesh mesh;

    private Vector3[] points;

    private List<Vector3> vertices = new List<Vector3>();
    private List<int> triangles = new List<int>();

    void Start()
    {
        MeshFilter meshFilter = GetComponent<MeshFilter>();
        Mesh mesh = new Mesh();
        meshFilter.mesh = mesh;

        int segmentCount = 10;

        points = new Vector3[4 * segmentCount];

        float x = 0;

        for (int i = 0; i < points.Length; ++i)
        {
            x += 0.5f;
            if (i >= 4 && i % 3 == 1)
            {
                float y = points[i - 1].y + points[i - 1].y - points[i - 2].y;

                points[i] = new Vector3(x, y, 0);
                continue;
            }

            points[i] = new Vector3(x, Random.Range(1f, 2f), 0);
        }

        int resolution = 20;

        for (int r = 0; r < resolution; ++r)
        {
            float t = 1.0f * r / resolution;
            Vector3 point = CalculateBezierPoint(t, points[0], points[1], points[2], points[3]);
            AddTerrainPoints(point);
        }

        for (int i = 3; i + 3 < points.Length; i += 3)
        {
            for (int r = 0; r < resolution; ++r)
            {

                float t = 1.0f * r / resolution;
                Vector3 point = CalculateBezierPoint(t, points[i + 0], points[i + 1], points[i + 2], points[i + 3]);
                AddTerrainPoints(point);
            }
        }

        mesh.vertices = vertices.ToArray();
        mesh.triangles = triangles.ToArray();

        mesh.Optimize();
        mesh.RecalculateNormals();
        mesh.RecalculateBounds();
    }

    void AddTerrainPoints(Vector3 point)
    {
        Vector3 otherPoint = new Vector3(point.x, 0, 0);
        vertices.Add(otherPoint);
        vertices.Add(point);

        if (vertices.Count >= 4)
        {
            int start = vertices.Count - 4;
            triangles.Add(start + 0);
            triangles.Add(start + 1);
            triangles.Add(start + 2);

            triangles.Add(start + 2);
            triangles.Add(start + 1);
            triangles.Add(start + 3);
        }


    }

    Vector3 CalculateBezierPoint(float t, Vector3 p0, Vector3 p1, Vector3 p2, Vector3 p3)
    {

        float u = 1 - t;
        float tt = t * t;
        float uu = u * u;
        float uuu = uu * u;
        float ttt = tt * t;

        Vector3 p = uuu * p0;
        p += 3 * uu * t * p1;
        p += 3 * u * tt * p2;
        p += ttt * p3;

        return p;
    }
}
