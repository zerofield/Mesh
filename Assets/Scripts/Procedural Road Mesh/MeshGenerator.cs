using UnityEngine;
using System.Collections;

public class MeshGenerator : UniqueMesh
{

    public Transform[] points;

    public Transform p0;
    public Transform p1;
    public Transform p2;
    public Transform p3;

    public int segmentCount = 10;


    float[] arr;

    void Awake()
    {

    }

    void Update()
    {
        GenerateMesh();
    }


    void GenerateMesh()
    {
        ExtrudeShape shape = new ExtrudeShape();

        Vertex2D[] verts = new Vertex2D[points.Length];



        for (int i = 0; i < points.Length; ++i)
        {
            verts[i] = new Vertex2D();
            verts[i].point = points[i].position;

            if (i == points.Length - 1)
            {
                Vector2 direction = points[i].position - points[i - 1].position;
                verts[i].normal = new Vector2(-direction.y, direction.x);
            }
            else
            {
                Vector2 direction = points[i + 1].position - points[i].position;
                verts[i].normal = new Vector2(-direction.y, direction.x);
            }

            verts[i].uCoord = 1.0f * i / (points.Length - 1);

        }

        int[] lines = new int[(points.Length - 1) * 2];
        for (int i = 0; i < points.Length - 1; ++i)
        {
            lines[i * 2] = i;
            lines[i * 2 + 1] = i + 1;
        }

        shape.vert2Ds = verts;
        shape.lines = lines;

        Vector3[] controlPoints =
        {
            p0.position,
            p1.position,
            p2.position,
            p3.position,
        };

        OrientedPoint[] path = new OrientedPoint[segmentCount + 1];

        Vector3 lastPoint = Vector3.zero;


        for (int i = 0; i <= segmentCount; ++i)
        {
            float t = (float)i / segmentCount;
            Vector3 position = CubicBezier3D.GetPoint(controlPoints, t);
            Quaternion rotation = CubicBezier3D.GetOrientation3D(controlPoints, t, Vector3.up);

            path[i] = new OrientedPoint(position, rotation);

            Vector3 normal = CubicBezier3D.GetNormal3D(controlPoints, t, Vector3.up);
            //debug info
            // Debug.DrawLine(position, position + normal * 5, Color.blue);

            if (i != 0)
            {
                Debug.DrawLine(lastPoint, position, Color.green);
            }

            lastPoint = position;
        }

        arr = new float[2];
        CalcLengthTableInto(arr, controlPoints);
        Extrude(mesh, shape, path);
    }

    public void Extrude(Mesh mesh, ExtrudeShape shape, OrientedPoint[] path)
    {
        int vertsInShape = shape.vert2Ds.Length;
        int segments = path.Length - 1;
        int edgeLoops = path.Length;
        int vertCount = vertsInShape * edgeLoops;
        int triCount = shape.lines.Length * segments;
        int triIndexCount = triCount * 3;


        int[] triangleIndices = new int[triIndexCount];
        Vector3[] vertices = new Vector3[vertCount];
        Vector3[] normals = new Vector3[vertCount];
        Vector2[] uvs = new Vector2[vertCount];


        for (int i = 0; i < path.Length; i++)
        {
            int offset = i * vertsInShape;
            for (int j = 0; j < vertsInShape; j++)
            {
                int id = offset + j;
                vertices[id] = path[i].LocalToWorld(shape.vert2Ds[j].point);
                normals[id] = path[i].LocalToWorldDirection(shape.vert2Ds[j].normal);

                // Debug.DrawLine(vertices[id], vertices[id] + normals[id].normalized, Color.gray);
                //uvs[id] = new Vector2(shape.vert2Ds[j].uCoord, i / ((float)edgeLoops));
                //uvs[id] = new Vector2(shape.vert2Ds[j].uCoord, arr.Sample(i / ((float)edgeLoops)));
                uvs[id] = new Vector2(shape.vert2Ds[j].uCoord, path.Length * i / ((float)edgeLoops));
            }
        }

        int[] lines = shape.lines;
        int ti = 0;
        for (int i = 0; i < segments; i++)
        {
            int offset = i * vertsInShape;
            for (int l = 0; l < lines.Length; l += 2)
            {
                int a = offset + lines[l] + vertsInShape;
                int b = offset + lines[l];
                int c = offset + lines[l + 1];
                int d = offset + lines[l + 1] + vertsInShape;

                triangleIndices[ti] = b; ti++;
                triangleIndices[ti] = a; ti++;
                triangleIndices[ti] = c; ti++;
                triangleIndices[ti] = c; ti++;
                triangleIndices[ti] = a; ti++;
                triangleIndices[ti] = d; ti++;

            }
        }


        mesh.Clear();
        mesh.vertices = vertices;
        mesh.triangles = triangleIndices;
        mesh.normals = normals;
        mesh.uv = uvs;
    }


    void CalcLengthTableInto(float[] arr, Vector3[] pts)
    {
        arr[0] = 0f;
        float totalLength = 0f;
        Vector3 prev = pts[0];
        for (int i = 1; i < arr.Length; i++)
        {
            float t = ((float)i) / (arr.Length - 1);
            Vector3 pt = CubicBezier3D.GetPoint(pts, t);
            float diff = (prev - pt).magnitude;
            totalLength += diff;
            arr[i] = totalLength;
            prev = pt;
        }
    }
}

public static class FloatArrayExtensions
{
    public static float Sample(this float[] fArr, float t)
    {
        int count = fArr.Length;
        if (count == 0)
        {
            Debug.LogError("Unable to sample array - it has no elements");
            return 0;
        }
        if (count == 1)
            return fArr[0];
        float iFloat = t * (count - 1);
        int idLower = Mathf.FloorToInt(iFloat);
        int idUpper = Mathf.FloorToInt(iFloat + 1);
        if (idUpper >= count)
            return fArr[count - 1];
        if (idLower < 0)
            return fArr[0];
        return Mathf.Lerp(fArr[idLower], fArr[idUpper], iFloat - idLower);
    }
}