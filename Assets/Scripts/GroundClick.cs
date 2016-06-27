using UnityEngine;
using System.Collections;

public class GroundClick : MonoBehaviour
{
    public GameObject prefabRoad;
    void Update()
    {
        if (Input.GetMouseButtonDown(0))
        {
            Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);
            RaycastHit hit;

            if (GetComponent<Collider>().Raycast(ray, out hit, Mathf.Infinity))
            {

                CreateRoad(hit.point);
            }
        }
    }

    void CreateRoad(Vector3 point)
    {
        //Create a road
        GameObject road = Instantiate(prefabRoad, point + new Vector3(0, 0.1f, 0), Quaternion.identity) as GameObject;

        MeshFilter meshFilter = road.GetComponent<MeshFilter>();
        MeshRenderer meshRenderer = road.GetComponent<MeshRenderer>();
        //Create a mesh
        Mesh mesh = new Mesh();
        meshFilter.mesh = mesh;

        float width = 1f;
        float length = 5f;

        Vector3[] vertices =
        {
            new Vector3(0       ,0,-width/2),
            new Vector3(length  ,0,-width/2),
            new Vector3(length  ,0,width/2),
            new Vector3(0       ,0,width/2),

        };

        int[] triangles =
        {
            0, 2, 1,
            3, 2, 0
        };

        Vector2[] uv =
        {
            new Vector2(0,0),
            new Vector2(length,0),
            new Vector2(length,1),
            new Vector2(0,1),
        };

        mesh.vertices = vertices;
        mesh.triangles = triangles;
        mesh.uv = uv;

        mesh.Optimize();
        mesh.RecalculateNormals();
        mesh.RecalculateBounds();

        // Vector2 texScale = new Vector2(5, 1);
        // road.GetComponent<MeshRenderer>().materials[0].mainTextureScale = texScale;
    }
}
