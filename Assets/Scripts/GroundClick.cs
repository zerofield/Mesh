using UnityEngine;
using System.Collections;

public class GroundClick : MonoBehaviour
{
    public Material matRoad;

    void OnMouseDown()
    {
        //Create a road
        GameObject road = new GameObject("road", typeof(MeshFilter), typeof(MeshRenderer));
        road.transform.position = new Vector3(0, 0.1f, 0);

        MeshFilter meshFilter = road.GetComponent<MeshFilter>();
        MeshRenderer meshRenderer = road.GetComponent<MeshRenderer>();
        //Create a mesh
        Mesh mesh = new Mesh();
        meshFilter.mesh = mesh;

        Vector3[] vertices =
        {
            new Vector3(0,0,0),
            new Vector3(1,0,0),
            new Vector3(1,0,1),
            new Vector3(0,0,1),

        };

        int[] triangles =
        {
            0, 2, 1,
            3, 2, 0
        };

        mesh.vertices = vertices;
        mesh.triangles = triangles;

        mesh.RecalculateNormals();
        mesh.RecalculateBounds();

        meshRenderer.material = matRoad;
    }
}
