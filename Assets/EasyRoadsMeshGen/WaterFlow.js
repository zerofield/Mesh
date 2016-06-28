var direction : Vector2;

var Bumpmap : boolean = true;

private var x : float = 0;
private var y : float = 0;

private var mesh: Mesh;
private var verts: Vector3[];
private var uvs0: Vector2[];
private var uvs: Vector2[];
private var size: int;

function Start(){
    mesh = GetComponent(MeshFilter).mesh;
    verts = mesh.vertices;
    uvs0 = mesh.uv;
    size = verts.length;
    uvs = new Vector2[size];
}

function Update(){
    	x += direction.x * Time.deltaTime;
    	y += direction.y * Time.deltaTime;
    	GetComponent.<Renderer>().material.SetTextureOffset ("_MainTex", Vector2(x,y));
    	if(Bumpmap)
    	{
    		GetComponent.<Renderer>().material.SetTextureOffset ("_BumpMap", Vector2(x,y));
    	}
}