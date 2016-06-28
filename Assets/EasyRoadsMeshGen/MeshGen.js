@script AddComponentMenu ("Easy Roads/Mesh Gen")
#if (UNITY_EDITOR)
public var deltaWidth : float = 1;
public var subdivision : int = 1;
public var uvScale : float = 1;
var navPoints : Transform[] = new Transform[0];
@HideInInspector
var navPointsBeta_p : Vector3[] = new Vector3[0];
private var newVertices : Vector3[] = new Vector3[0];
private var newUV : Vector2[] = new Vector2[0];
private var newTriangles : int[] = new int[0];
private var quadMatrix : int[] = [2,1,0,2,3,1];
private var triCount : int = 0;
//private var matrixCount : int = 0;
private var uvSetCount : int = 0;
private var updateLoopCount : int = 0;

@HideInInspector
public var groundOffset : float = 0.1;
@HideInInspector
public var curveControlState : int = 1; //manual, automatic 1;
@HideInInspector
public var updatePointsMode : int = 1;
@HideInInspector
public var parentPoints : int = 0;
private var lastParentPointsUpd : int = 0;
@HideInInspector
public var includeCollider : int = 1;
@HideInInspector
public var enableHelp : int = 1;
@HideInInspector
public var uvSet : int = 0; //0 - per quad, 1 - cube projection,2 - width-to-length
@HideInInspector
public var enableMeshBorders : int = 0;
@HideInInspector
public var bordersAmount : int = 0; //wip (0.2.5)
@HideInInspector
public var borderCurve : AnimationCurve = AnimationCurve(Keyframe(0, 0), Keyframe(0.3, 0.6), Keyframe(1, 0.6)); //the points in 2d plane
//@HideInInspector
public var leftBorderMeshObj : GameObject;
//@HideInInspector
public var rightBorderMeshObj : GameObject;

//private var lBorderNavPoints : Vector2[]; //the points in 2d plane
private var rBorderNavPoints : Vector2[];
private var leftBorderVertices : Vector3[];
private var leftUV : Vector2[] = new Vector2[0];
private var leftTriangles : int[] = new int[0];
private var rightBorderVertices : Vector3[];
private var rightUV : Vector2[] = new Vector2[0];
private var rightTriangles : int[] = new int[0];
private var borderCount : int = 0;

private var xRelative : int = 0;

function OnDrawGizmos () {
		if(Application.isPlaying)
			return;
		
	if(updatePointsMode == 0)
		return;
	for(var v = 0; v < newVertices.length; v++){
		Gizmos.DrawWireSphere(newVertices[v],0.08);
	}
	Gizmos.color = Color(0,0,1,0.8);
	
	if(1==0)
	for(var rb = 0; rb < rightBorderVertices.length; rb++){
		Gizmos.DrawWireSphere(rightBorderVertices[rb],0.03);
		Gizmos.DrawWireSphere(leftBorderVertices[rb],0.02);
	}
	
	if(updateLoopCount < 8)
		updateLoopCount++;
	else if(subdivision > 0){
		if(updatePointsMode == 1)
			SetVerts();
		
		if(updatePointsMode == 2)
			UpdateData();
		updateLoopCount = 0;
	}
	if(subdivision < 1)
		subdivision = 1;
}
function GenerateFirstMesh () {
	if(!GetComponent(MeshFilter)){
		gameObject.AddComponent(MeshFilter);
	}
	if(!GetComponent(MeshRenderer)){
		gameObject.AddComponent(MeshRenderer);
	}
	ResetMesh();
}

function CreateNavPoint () {
	if(navPoints.length > 0)
	if(navPoints[navPoints.length-1].GetComponent(SnapPoint))
		if(navPoints[navPoints.length-1].GetComponent(SnapPoint).snapped){
			Debug.LogWarning("Easy Roads: End point <" + navPoints[navPoints.length-1].gameObject.name + "> is snapped. Unsnap it to add new points!");
			return;
		}
		
	var navPointObject = new GameObject();
	navPointObject.name = "Nav Point " + navPoints.length;
	if(parentPoints == 1 && navPoints.length > 0)
		navPointObject.transform.parent = navPoints[navPoints.length - 1];
	else
		navPointObject.transform.parent = transform;
	
	navPointObject.AddComponent(NavPointGizmos);
	navPointObject.GetComponent(NavPointGizmos).showSPLinePoints = true;
	navPointObject.AddComponent(SnapPoint);
	
	if(navPoints.length > 0){
		navPointObject.transform.position = navPoints[navPoints.length - 1].forward*deltaWidth + navPoints[navPoints.length - 1].position;
		navPointObject.transform.position.y = navPoints[navPoints.length - 1].position.y;
		navPointObject.transform.rotation = navPoints[navPoints.length - 1].rotation;
	}
	
	UpdateNavPoints(navPointObject.transform);
	UpdateData();
}

function DeleteNavPoint () {
	//save the points in temporary variable
	var navPointsA = navPoints;
	//resize the array
	navPoints = new Transform[navPointsA.length - 1];
	//reassign the old points
	for(var u = 0; u < navPoints.length; u++)
		navPoints[u] = navPointsA[u];
	//delete last
	DestroyImmediate(navPointsA[navPointsA.length -1].gameObject);
	UpdateData();
}

function UpdateData (){
		if(Application.isPlaying)
			return;
	
	transform.rotation = Quaternion.identity;
	transform.position = Vector3.zero;
	
	if(lastParentPointsUpd != parentPoints){
		var parentPointsBool : boolean;
		if(parentPoints == 0)
			parentPointsBool = false;
		else
			parentPointsBool = true;
		ReparentPoints(parentPointsBool);
	}
	
	GenerateMesh();
}

private function UpdateNavPoints (trans : Transform) {
	//save the points in temporary variable
	var navPointsA = navPoints;
	//resize the array
	navPoints = new Transform[navPointsA.length + 1];
	//reassign the old points
	for(var u = 0; u < navPointsA.length; u++)
		navPoints[u] = navPointsA[u];
	//assign the new point 
	navPoints[navPoints.length - 1] = trans;
}

private function GenerateMesh () {
	if(subdivision <= 0)
		return;
	
	SetVerts();
	SetTriangles();
	SetUVs();
	
	//GetComponent(MeshFilter).sharedMesh.Clear();
	var mesh : Mesh = new Mesh ();
	GetComponent(MeshFilter).sharedMesh = mesh;
	mesh.vertices = newVertices;
	mesh.uv = newUV;
	mesh.triangles = newTriangles;
	mesh.RecalculateNormals();
	
	
	UpdateCollider(mesh);
	
	if(enableMeshBorders == 1)
		EnableBorders(true);
	else
		EnableBorders(false);
	
}

private function SetVerts () {
		if(navPoints.length > 0)
			navPointsBeta_p = new Vector3[parseInt((navPoints.length-1) * subdivision)];
		else
			navPointsBeta_p = new Vector3[0];
		newVertices = new Vector3[(navPointsBeta_p.length + 1) * 2];
		//get borderNavPoints
		lBorderNavPoints = new Vector2[borderCurve.length];
		rBorderNavPoints = new Vector2[borderCurve.length];
		
		for(var v = 0; v < borderCurve.length; v++){ //assign the borderNavPoints : Vector2 values based on the borderCurve
			rBorderNavPoints[v] = new Vector2(borderCurve.keys[v].time, borderCurve.keys[v].value);
		}
		
 		if(rBorderNavPoints)
		leftBorderVertices = new Vector3[borderCurve.length*navPointsBeta_p.length + borderCurve.length];
		if(rBorderNavPoints)
		rightBorderVertices = new Vector3[borderCurve.length*navPointsBeta_p.length + borderCurve.length];
		
		borderCount = 0;
		
		for(var a = 0; a < navPoints.length; a++){
			var previous : int; //previous point in array
			var next : int; //next point in array
			
			//get previous and next points relationship
			if(a > 0)
				previous = a-1;
			else
				previous = 0;
			
			if(a < navPoints.length - 1)
				next = a + 1;
			
			
			//calculate xRelative (based on z-axis position) which will be used to tell the orientation of the points
			if(curveControlState != 0){
				if(navPoints[a] && navPoints[next])
					if(navPoints[a].position.z > navPoints[next].position.z)
						xRelative = -1;
					else
						xRelative = 1;
			}
			
			//calculate direction
			var direction1 : Vector3 = navPoints[previous].position - navPoints[a].position;
			var direction2 : Vector3 = navPoints[a].position - navPoints[next].position;
			var midDirection : Vector3 = Vector3.zero;
			midDirection = Vector3.Lerp(direction1, direction2, 0.5); //Vector3.Distance(navPoints[previous].position,navPoints[next].position)/Vector3.Distance(navPoints[previous].position,navPoints[a].position)
			var betaEuler : Vector3 = Vector3(Vector3.Angle(midDirection,-Vector3.up) - 90,
			(Vector3.Angle(midDirection,Vector3.right) * xRelative  - 90),
			navPoints[a].localEulerAngles.z);
			
			//assign the point rotation
			if(curveControlState != 0){
				if(navPoints[a].GetComponent(SnapPoint)){ //Snap Points Check
					if(!navPoints[a].GetComponent(SnapPoint).snapped){
						if(a < navPoints.length - 1)
							navPoints[a].localEulerAngles = betaEuler;
						else if(navPoints.length > 1){
							if(navPoints[a].position.z < navPoints[previous].position.z)
								xRelative = -1;
							else
								xRelative = 1;
							navPoints[a].localEulerAngles = Vector3(Vector3.Angle(direction1,Vector3.up) - 90,
							(Vector3.Angle(direction1,Vector3.right) * xRelative  - 90),
							navPoints[a].localEulerAngles.z);
						}
					}
				}
				else{
					if(a < navPoints.length - 1)
							navPoints[a].localEulerAngles = betaEuler;
						else if(navPoints.length > 1){
							if(navPoints[a].position.z < navPoints[previous].position.z)
								xRelative = -1;
							else
								xRelative = 1;
							navPoints[a].localEulerAngles = Vector3(Vector3.Angle(direction1,Vector3.up) - 90,
							(Vector3.Angle(direction1,Vector3.right) * xRelative  - 90),
							navPoints[a].localEulerAngles.z);
						}
				}
			}
			
			//Subdivision points position
			if(a < navPoints.length - 1){ //inbetween the points
				navPointsBeta_p[a*subdivision] = navPoints[a].position; //set overlapping points
				
				var xCof : float;
				for(var b = 1; b < subdivision; b++){ //in-between points
						xCof = parseFloat(parseFloat(b)/parseFloat(subdivision));
						var ap : Vector3; var bp : Vector3; var cp : Vector3; var dp : Vector3; var ep : Vector3; var fp : Vector3;
						ap = Vector3.Lerp(navPoints[a].position, navPoints[a].forward * navPoints[a].localScale.z + navPoints[a].position, xCof);
						cp = Vector3.Lerp(-navPoints[next].forward * navPoints[next].localScale.z + navPoints[next].position, navPoints[next].position, xCof);
						bp = Vector3.Lerp(navPoints[a].forward * navPoints[a].localScale.z + navPoints[a].position, -navPoints[next].forward * navPoints[next].localScale.z + navPoints[next].position, xCof);
						dp = Vector3.Lerp(ap,bp, xCof);
						ep = Vector3.Lerp(bp,cp, xCof);
						fp = Vector3.Lerp(dp,ep, xCof);
						navPointsBeta_p[a*subdivision + b] = fp;
					
						//Post-Subdivision Vertices <<<----
						var gTng = GetTangent(dp,ep);
						var leftRight = -GetBinormal(gTng, navPoints[a].up, navPoints[next].up, xCof);
						newVertices[(a*subdivision + b)*2] = navPointsBeta_p[a*subdivision + b] - leftRight * (deltaWidth/2)
						* Mathf.Lerp(parseFloat(navPoints[a].localScale.x),parseFloat(navPoints[next].localScale.x), parseFloat(b)/parseFloat(subdivision));
						newVertices[(a*subdivision + b)*2 + 1] = navPointsBeta_p[a*subdivision + b] + leftRight * (deltaWidth/2)
						* Mathf.Lerp(parseFloat(navPoints[a].localScale.x),parseFloat(navPoints[next].localScale.x), parseFloat(b)/parseFloat(subdivision));
				}
			
				
				
			}//a-1 restriction:end
				for(var bord = 0; bord < subdivision; bord++){ //the beta points loop inside each segment
						var xCofb = parseFloat(bord)/parseFloat(subdivision);
						var apb : Vector3; var bpb : Vector3; var cpb : Vector3; var dpb : Vector3; var epb : Vector3; var fpb : Vector3;
						apb = Vector3.Lerp(navPoints[a].position, navPoints[a].forward * navPoints[a].localScale.z + navPoints[a].position, xCofb);
						cpb = Vector3.Lerp(-navPoints[next].forward * navPoints[next].localScale.z + navPoints[next].position, navPoints[next].position, xCofb);
						bpb = Vector3.Lerp(navPoints[a].forward * navPoints[a].localScale.z + navPoints[a].position, -navPoints[next].forward * navPoints[next].localScale.z + navPoints[next].position, xCofb);
						dpb = Vector3.Lerp(apb,bpb, xCofb);
						epb = Vector3.Lerp(bpb,cpb, xCofb);
						fpb = Vector3.Lerp(dpb,epb, xCofb);
						leftRightb = GetBinormal(GetTangent(dpb,epb), navPoints[a].up, navPoints[next].up, xCofb);
					for(var cl = 0; cl < borderCurve.length; cl++){ //the points loop 0 1 2 3 0 1 2 3...
						
						if(borderCount*borderCurve.length + cl < rightBorderVertices.length){
							rightBorderVertices[borderCount*borderCurve.length + cl] = fpb + leftRightb * (deltaWidth/2) + leftRightb * rBorderNavPoints[cl].x
							+ GetNormal(leftRightb, GetTangent(dpb,epb)) * rBorderNavPoints[cl].y;
							
							leftBorderVertices[borderCount*borderCurve.length + cl] = fpb - leftRightb * (deltaWidth/2) - leftRightb * rBorderNavPoints[cl].x
							+ GetNormal(leftRightb, GetTangent(dpb,epb)) * rBorderNavPoints[cl].y;
						}
					}
					
					borderCount++;
				}
			//assign main vertices
			if(a < navPoints.length - 1){
				newVertices[a * subdivision *2] = navPoints[a].position + navPoints[a].right * -(deltaWidth/2 * navPoints[a].localScale.x);
				newVertices[a * subdivision *2 + 1] = navPoints[a].position + navPoints[a].right * (deltaWidth/2 * navPoints[a].localScale.x);
			}else{
				newVertices[newVertices.length - 2] = navPoints[navPoints.length - 1].position + navPoints[navPoints.length - 1].right * -(deltaWidth/2 * navPoints[navPoints.length - 1].localScale.x);
				newVertices[newVertices.length - 1] = navPoints[navPoints.length - 1].position + navPoints[navPoints.length - 1].right * (deltaWidth/2 * navPoints[navPoints.length - 1].localScale.x);
			}
		}//a:end
}

private function SetTriangles () {
	//v2
	var qCount = (navPoints.length - 1) * subdivision + 1;
	if(navPoints.length > 1) //if there is room for triangles to be drawn{
		newTriangles = new int[qCount * 6];
	else
		newTriangles = new int[0];
	//triCount = 0;
	for(var quad = 1; quad < qCount; quad++){
		//matrixCount = 0;
		for(var s2 = 0; s2 < 6; s2++){
			//assign numbers
			newTriangles[(quad-1)*6 + s2] = quadMatrix[s2] + ((quad*2) - 2);
		}
	}
	
	//BORDER
	qCount = ((navPoints.length - 1)*subdivision) * borderCurve.length;//*borderCurve.length;
	if(navPoints.length > 1){ //if there is room for triangles to be drawn{
		if(enableMeshBorders == 1){
			rightTriangles = new int[qCount*6];
			leftTriangles = new int[qCount*6];
		}
	}else{
		rightTriangles = new int[0];
		leftTriangles = new int[0];
	}
	
	triCount = 0; //re use variable
	for(var ll = 0; ll < (navPoints.length - 1)*subdivision; ll++) //length index (horizontal index) X
		for(var lb = 0; lb < borderCurve.length - 1; lb++){//vertical index Y quad
			for(var bct = 0; bct < 6; bct++){ //under each quad - for matrix (assign tri points to curve points)
			var borderQuadMatrix : int[] = [1,borderCurve.length+1,0,borderCurve.length,0,borderCurve.length+1];
											  //1,3,0,2,0,3
			var borderQuadMatrixLeft : int[] = [0,borderCurve.length+1,1,borderCurve.length+1,0,borderCurve.length];
				if(triCount < rightTriangles.length){
					rightTriangles[triCount] = borderQuadMatrix[bct]+lb+borderCurve.length*ll;
					leftTriangles[triCount] = borderQuadMatrixLeft[bct]+lb+borderCurve.length*ll;
					triCount++;
				}
			}
	}
}

private function SetUVs () {
	var uvs_y_array : int = newVertices.length/2;
	newUV = new Vector2[newVertices.length];
	rightUV = new Vector2[rightBorderVertices.length];
	leftUV = new Vector2[rightBorderVertices.length];
	
	//get point-to-point distance and mesh length
	var previousDistance : float = 0;
	var ptpDistance : float[] = new float[navPointsBeta_p.length];
	for(var ptp = 0; ptp < ptpDistance.length; ptp++){
		if(ptp < ptpDistance.length - 1)
			ptpDistance[ptp] = Vector3.Distance(navPointsBeta_p[ptp],navPointsBeta_p[ptp + 1]);
	}
			
	switch (uvSet){
		case 0:
			uvSetCount = 0;
			for(var uvy = 0; uvy < uvs_y_array; uvy++){
				for(var uvx = 0; uvx < 2; uvx++){
					newUV[uvSetCount] = new Vector2(uvx * uvScale,uvy * uvScale);
					
					uvSetCount++;
				}
			}
		break;
		case 1:
			for(var uvp = 0; uvp < newUV.length; uvp++){
				newUV[uvp] = new Vector2(newVertices[uvp].x * uvScale, newVertices[uvp].z * uvScale);
			}
		break;
		case 2:
			
			uvSetCount = 0;
			previousDistance = 0;
			
			for(var uvny = 0; uvny < ptpDistance.length + 1; uvny++){
				for(var uvnx = 0; uvnx < 2; uvnx++){
					if(uvny > 0){
						if(uvny < ptpDistance.length)
							newUV[uvSetCount] = new Vector2(uvnx * uvScale, (ptpDistance[uvny - 1] + previousDistance) * uvScale / deltaWidth);
						else
							newUV[uvSetCount] = new Vector2(uvnx * uvScale, previousDistance * uvScale / deltaWidth);
					}
					else
						newUV[uvSetCount] = new Vector2(uvnx * uvScale, 0);
				
					uvSetCount++;
				}
					if(uvny < ptpDistance.length)
						previousDistance += ptpDistance[uvny];
			}
		break;
		case 3:
			
			uvSetCount = 0;
			previousDistance = 0;
			
			for(var uvny3 = 0; uvny3 < ptpDistance.length + 1; uvny3++){
				for(var uvnx3 = 0; uvnx3 < 2; uvnx3++){
					if(uvny3 > 0){
						if(uvny3 < ptpDistance.length)
							newUV[uvSetCount] = new Vector2(uvnx3, 1/(ptpDistance[uvny3 - 1] + previousDistance) * uvScale);
						else
							newUV[uvSetCount] = new Vector2(uvnx3, 1/previousDistance * uvScale);
					}
					else
						newUV[uvSetCount] = new Vector2(uvnx3, 0);
				
					uvSetCount++;
				}
					if(uvny3 < ptpDistance.length)
						previousDistance += ptpDistance[uvny3];
			}
		break;
	}
	
	for(var uvpb = 0; uvpb < rightUV.length; uvpb++){
				rightUV[uvpb] = new Vector2(rightBorderVertices[uvpb].x * uvScale, rightBorderVertices[uvpb].z * uvScale);
				leftUV[uvpb] = new Vector2(leftBorderVertices[uvpb].x * uvScale, leftBorderVertices[uvpb].z * uvScale);
			}
}

function GroundPoints (offset : float) {
	var hit : RaycastHit;
	var pointPos : Vector3[] = new Vector3[navPoints.length]; //temporary variable used to store the position of the points to be used to cast a ray from there
	//save the position data
	for(var p = 0; p < pointPos.length; p++){
		pointPos[p] = navPoints[p].position;
	}
	
	for(var vg = 0; vg < navPoints.length; vg++){
		if(Physics.Raycast(pointPos[vg], Vector3.down, hit)){
			navPoints[vg].position = hit.point + hit.normal*offset;
			var normalQuaternion : Quaternion = Quaternion.FromToRotation (Vector3.up, hit.normal);
			if(navPoints[vg].GetComponent(SnapPoint)){ //Snap Points Check
					if(!navPoints[vg].GetComponent(SnapPoint).snapped)
						navPoints[vg].eulerAngles = Vector3(normalQuaternion.eulerAngles.x,navPoints[vg].eulerAngles.y,normalQuaternion.eulerAngles.z);
			}else{
				navPoints[vg].eulerAngles = Vector3(normalQuaternion.eulerAngles.x,navPoints[vg].eulerAngles.y,normalQuaternion.eulerAngles.z);
			}
		}
	}
	
	UpdateData();
}

function ResetMesh () {
	
	for(var nav = 0; nav < navPoints.length; nav++){
		if(navPoints[nav] != null){
			DestroyImmediate(navPoints[nav].gameObject);
		}
	}
	
	navPoints = new Transform[0];
	newVertices = new Vector3[0];
	newUV = new Vector2[0];
	newTriangles = new int[0];
	
	CreateNavPoint();
	GenerateMesh();
}

private function EnableBorders (state : boolean){
	if(state == true){
		if(!leftBorderMeshObj){
			leftBorderMeshObj = new GameObject();
			leftBorderMeshObj.name = "leftBorderMeshObj";
			leftBorderMeshObj.transform.position = Vector3.zero;
			leftBorderMeshObj.transform.eulerAngles = Vector3.zero;
			leftBorderMeshObj.AddComponent(MeshFilter);
			leftBorderMeshObj.AddComponent(MeshRenderer);
			leftBorderMeshObj.transform.parent = this.transform;
		}
		if(!rightBorderMeshObj){
			rightBorderMeshObj = new GameObject();
			rightBorderMeshObj.name = "rightBorderMeshObj";
			rightBorderMeshObj.transform.position = Vector3.zero;
			rightBorderMeshObj.transform.eulerAngles = Vector3.zero;
			rightBorderMeshObj.AddComponent(MeshFilter);
			rightBorderMeshObj.AddComponent(MeshRenderer);
			rightBorderMeshObj.transform.parent = this.transform;
		}
	}
	
	if(state == true){
		var lMesh : Mesh = new Mesh();
		var rMesh : Mesh = new Mesh();
		
		leftBorderMeshObj.GetComponent(MeshFilter).sharedMesh = lMesh;
		lMesh.vertices = leftBorderVertices;
		lMesh.uv = leftUV;
		lMesh.triangles = leftTriangles;
		lMesh.RecalculateNormals();
		
		rightBorderMeshObj.GetComponent(MeshFilter).sharedMesh = rMesh;
		rMesh.vertices = rightBorderVertices;
		rMesh.uv = rightUV;
		rMesh.triangles = rightTriangles;
		rMesh.RecalculateNormals();
		
	}else{
		if(rightBorderMeshObj)
			DestroyImmediate(rightBorderMeshObj);
		rightBorderMeshObj = null;
		if(leftBorderMeshObj)
			DestroyImmediate(leftBorderMeshObj);
		leftBorderMeshObj = null;
	}
}

function ReparentPoints (reparent : boolean) {
	for(var p = 0; p < navPoints.length; p++){
		if(reparent){
			if(p > 0){
				navPoints[p].parent = navPoints[p-1];
			}
		}else{
			navPoints[p].parent = transform;
		}
	}
	lastParentPointsUpd = parentPoints;
}

private function UpdateCollider (colMesh : Mesh) {
	if(includeCollider == 1){
		if(!GetComponent(MeshCollider))
			gameObject.AddComponent(MeshCollider);
	
		GetComponent(MeshCollider).sharedMesh = colMesh; //assign the updated mesh to the collider;
		
		if(enableMeshBorders){
			if(!rightBorderMeshObj)
				EnableBorders(true);
			
			if(!rightBorderMeshObj.GetComponent(MeshCollider))
				rightBorderMeshObj.AddComponent(MeshCollider);
			if(!leftBorderMeshObj.GetComponent(MeshCollider))
				leftBorderMeshObj.AddComponent(MeshCollider);
			
			if(rightBorderMeshObj.GetComponent(MeshFilter))
				rightBorderMeshObj.GetComponent(MeshFilter).sharedMesh.Clear();
			
			if(leftBorderMeshObj.GetComponent(MeshFilter))
				leftBorderMeshObj.GetComponent(MeshFilter).sharedMesh.Clear();
			
			rightBorderMeshObj.GetComponent(MeshCollider).sharedMesh = rightBorderMeshObj.GetComponent(MeshFilter).sharedMesh; //assign the updated mesh to the collider;
			leftBorderMeshObj.GetComponent(MeshCollider).sharedMesh = leftBorderMeshObj.GetComponent(MeshFilter).sharedMesh; //assign the updated mesh to the collider;
		}
	}else{
		if(GetComponent(MeshCollider))
			DestroyImmediate(GetComponent(MeshCollider));
		if(rightBorderMeshObj)
		if(rightBorderMeshObj.GetComponent(MeshCollider))
			DestroyImmediate(rightBorderMeshObj.GetComponent(MeshCollider));
		if(leftBorderMeshObj)
		if(leftBorderMeshObj.GetComponent(MeshCollider))
			DestroyImmediate(leftBorderMeshObj.GetComponent(MeshCollider));
	}
}

function Finalise () {
	for(var nav = 0; nav < navPoints.length; nav++){
		if(navPoints[nav] != null){
			DestroyImmediate(navPoints[nav].gameObject);
		}
	}
	
	DestroyImmediate(this);
}

private function GetTangent (d : Vector3, e : Vector3) { //get the tangent of the subdivision curve
	return (d - e)/Vector3.Distance(d,e);
}

private function GetBinormal (tng : Vector3, upVectorA : Vector3, upVectorB : Vector3, cof : float){ //get the normal (y dir) of the subdivision curve
	var binormal : Vector3 = Vector3.Cross(Vector3.Lerp(upVectorA, upVectorB, cof), tng).normalized;
	return binormal; //Mathf.Cross(tng, binormal);
}

function GetNormal (bnrm : Vector3, tng : Vector3){
	return Vector3.Cross(tng, bnrm);
}

#endif