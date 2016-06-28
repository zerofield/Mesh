@CustomEditor (MeshGen)
#if (UNITY_EDITOR)
public class MeshGenEditor extends Editor
{
	
	private var groundOffset : float = 0.01;
	private var curveControlStateStrings : String[] = ["Full Manual", "Automatic Rotation"];
    private var constantVertsUpdateStr : String[] = ["Manual", "Vertices Only(Default)", "Vertices + Mesh (Low Performance)"];
	private var parentPointsStr : String[] = ["Off", "On"];
	private var includeColliderStr : String[] = ["Off", "On"];
	private var enableHelpStr : String[] = ["Off", "On"];
	private var uvSetStr : String[] = ["Per Segment", "Top Projection", "Width-to-Length (alpha)", "Stretch Single Texture"];
	private var enableMeshBordersStr : String[] = ["Off", "On"];
	private var borderWindowRect : Rect = Rect(Screen.width/2, Screen.height/2, 300,200);
	private var enableWindow : boolean = true;
	private var myScriptG : MeshGen;
	
	function OnInspectorGUI()
    {
		if(Application.isPlaying)
			return;
		
        DrawDefaultInspector();
        
        var myScript : MeshGen = target;
		myScriptG = myScript;
		
		if(myScript.parentPoints == 1){
			myScript.curveControlState = 0;
			myScript.curveControlState = myScript.curveControlState;
		}
		
		if(myScript.GetComponent(MeshFilter)){
			myScript.updatePointsMode = EditorGUILayout.Popup("Update Mode", myScript.updatePointsMode, constantVertsUpdateStr);
			myScript.parentPoints = EditorGUILayout.Popup("Parent Points", myScript.parentPoints, parentPointsStr);
			myScript.includeCollider = EditorGUILayout.Popup("Include Collider", myScript.includeCollider, includeColliderStr);
			myScript.curveControlState = EditorGUILayout.Popup("Point Control", myScript.curveControlState, curveControlStateStrings);
			myScript.uvSet = EditorGUILayout.Popup("UVs", myScript.uvSet, uvSetStr);
			
			myScript.enableMeshBorders = EditorGUILayout.Popup("Borders Mesh", myScript.enableMeshBorders, enableMeshBordersStr);
			if(myScript.enableMeshBorders == 1){
				//if(GUILayout.Button("Configure Border"))
				//	enableWindow = true;
				
				myScript.borderCurve = EditorGUILayout.CurveField("Border Shape", myScript.borderCurve);
			}
			
			if(myScript.enableHelp)
			GUILayout.Box("[Better border mesh system will be implemented in the next update.]");//space
			
			GUI.color = Color(0.3,1,0.3);
			GUILayout.BeginHorizontal();
			if(GUILayout.Button("Add Nav Point"))
			{
				myScript.CreateNavPoint();
			}
			GUI.color = Color(1,1,0.3);
			if(myScript.navPoints.length > 1)
				if(GUILayout.Button("Delete Nav Point")){
					myScript.DeleteNavPoint();
				}
			GUILayout.EndHorizontal();
			GUI.color = Color(0.3,1,0.3);
			if(myScript.updatePointsMode != 2)
				if(GUILayout.Button("Apply Changes"))
				{
					myScript.UpdateData();
				}
				
			GUI.color = Color(0.6,0.6,1);
			GUILayout.Box("Ground nav points to surface underneath.\nOffset: " + myScript.groundOffset, GUILayout.MaxWidth(999));
			GUILayout.BeginHorizontal();
			
			myScript.groundOffset = GUILayout.HorizontalSlider(myScript.groundOffset,0,1);
			
			GUILayout.EndHorizontal();
			
			if(GUILayout.Button("Ground Points")){
				myScript.GroundPoints(myScript.groundOffset);
			}
			
			
			GUI.color = Color(1,1,0.3);
			if(myScript.enableHelp != 0)
				GUILayout.Box("Delete the Nav Points and remove the mesh generation script.");
			if(GUILayout.Button("Finalise"))
				myScript.Finalise();
			
			GUI.color = Color(1,0.2,0.2);
			if(GUILayout.Button("Reset"))
			{
				myScript.ResetMesh();
			}
		}
		else{
			if(GUILayout.Button("Begin"))
			{
				myScript.GenerateFirstMesh();
			}
		}

		GUI.color = Color(1,1,1);
		myScript.enableHelp = EditorGUILayout.Popup("Enable Tips", myScript.enableHelp, enableHelpStr);
		if(myScript.enableHelp == 0)
			return;
		GUILayout.Box("Important: This object should remain at position (0,0,0) at all times. The Nav Points (Navigation Points) control the position and rotation of the dynamic mesh.");
		GUI.color = Color(1,0.2,0.2);
		if(myScript.parentPoints == 1)
		GUILayout.Box("Important: Automatic Point Control is not allowed while Parent Points is on.");
		
		
	}
	
	function Window(id : int){
		
	}
}
#endif