Easy Roads Mesh Gen v0.2

Agreement 2.0:
This product and all of it components are created by Hristo Mihailov Ivanov (also known as Kris Development).
You are free to use it for any personal/commercial purpose
but you are not allowed to change and/or redistribute the source code without explicit permission.

Instructions:
To use this tool you need to create an empty game object inside Unity3D.
Assign the "Mesh Gen.js" script to the empty object and click "Begin". This
will create one Navigation Point (Nav Point) in the scene.
To extend the array of Nav Points click "Add Nav Point".
After you have modified the position and rotation of the Nav Point click
"Update Mesh" to apply the new changes (or just select the Verices + Mesh update option).

Use "Delete Nav Point" to delete the last added point.

The "Update Mode" menu changes the way the mesh is being updated (manually, vertices only, or in real time).

"Parent points" will make any future point a child of the previous, which can make
easier modifying the general shape of the mesh.

"Delta Width" represents the width of the road/river/etc.

"Include Collider" will create mesh collider and update it every time the mesh is updated

The "Ground Points" button will snap the entire structure to the surface of whatever object lies
under the points. This is useful for making roads on large terrains.
There is also a slider which controls the height offset of the structure.

"Point Control" will change the way the points are used in the scene. The Full Manual option will let the user
rotate and manually modify each point while Automatic will rotate the points based on their position.

"UVs" control the way the texture is being drawn on top of the mesh.

"Finalise" will remove the script and delete all Nav Points leaving only the complete product.

The package also includes "WaterFlow.js" script which is used to create river-like effect
based on the generated mesh.