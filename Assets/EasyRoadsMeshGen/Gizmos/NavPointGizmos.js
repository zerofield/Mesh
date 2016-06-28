var gizmoColor : Color = Color(0,1,0,0.5);
var gizmoSize : float = 1;
var showAxis : boolean = true;
var showSPLinePoints : boolean = false;

function OnDrawGizmos () {
	Gizmos.color = gizmoColor;
	Gizmos.DrawSphere(transform.position,0.12 * gizmoSize);
	Gizmos.DrawWireSphere(transform.position,0.12 * gizmoSize);

	if(showSPLinePoints){
		Gizmos.color = Color(1,1,0,gizmoColor.a);
		Gizmos.DrawWireSphere(transform.position + transform.forward*transform.localScale.z,0.08 * gizmoSize);
		Gizmos.DrawWireSphere(transform.position - transform.forward*transform.localScale.z,0.08 * gizmoSize);
	}
	
	if(!showAxis)
		return;
	
	Gizmos.color = Color.red;
	Gizmos.DrawLine(transform.position,transform.position+ transform.right*gizmoSize*transform.localScale.x);
	Gizmos.color = Color.green;
	Gizmos.DrawLine(transform.position,transform.position+ transform.up*gizmoSize*transform.localScale.y);
	Gizmos.color = Color.blue;
	Gizmos.DrawLine(transform.position,transform.position+ transform.forward*gizmoSize*transform.localScale.z);
	
	//Gizmos.DrawIcon(transform.position, "waypoint_icon.png");
}