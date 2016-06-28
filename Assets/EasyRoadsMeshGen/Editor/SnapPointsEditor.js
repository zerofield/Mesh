@CustomEditor (SnapPoint)
#if (UNITY_EDITOR)
public class SnapPointsEditor extends Editor
{
	var snapModeStr : String[] = ["None", "X,Y,Z", "Only X", "Only Y", "Only Z", "X,Y", "X,Z", "Y,Z"];
	var snapModeInt : int;
	
	function OnInspectorGUI() {
        DrawDefaultInspector();
		
		var snpScript : SnapPoint = target;
		
		if(snpScript.passive)
		return;
	
		if(!snpScript.snapped){
			snpScript.snapModeInt = EditorGUILayout.Popup("Inverse", snpScript.snapModeInt, snapModeStr);
			
			if(GUILayout.Button("Snap To Closest Point")){
				snpScript.SnapToPointTransform();
			}
			GUILayout.Box("Use inverse to select the right orientation of the point when snapped to another.");
		}else{
			if(GUILayout.Button("Unsnap To Previous")){
				snpScript.UnSnap();
			}
		}		
	}
}
#endif