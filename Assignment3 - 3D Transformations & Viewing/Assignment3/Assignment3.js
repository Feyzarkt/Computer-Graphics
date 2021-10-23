"use strict";

var canvas;
var gl;

var bufferSurname, bufferPlane, planeVertices, surnameVertices;
var vPosition;
var transformationMatrix, transformationMatrixLoc;
var pos, scale, rotationX, rotationY, rotationZ;
var color, colorLoc, speed, theta = 0;;

var count = 36;
var bufferCone, bufferMiniCone;
var verticesCone = [vec3(0,0.7,0)];
var verticesMiniCone = [vec3(0.0,0.0,0.15)];

var modelView, projection;
var mvMatrix, pMatrix;

var eye = [0.0,0.7,3.0];
var at = [0.0,0.1,0.0];
var up = vec3(0.0,1.0,0.0);

var fovy = 30.0;
var aspect = 1.0;
var near = 1.0;
var far = 10.0;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
	gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
	
	//--------------------Cone------------------
	for (var i = 0; i < count+2; i++) {
        var angle = i*(360/count)*(Math.PI/180);
        verticesCone.push(vec3(0.15*Math.sin(angle),-0.08,0.15*Math.cos(angle)));
		verticesMiniCone.push(vec3(0.02*Math.sin(angle),0.02*Math.cos(angle),-0.01));
    };
	//---------------------------------------
	
    pos = [0,0,0];
    scale = [1,1,1];
    rotationX = 0;
	rotationY = 0;
	rotationZ = 0;
    color = [0,0,0,1];
    speed = 0.5;

    // Make the letters
 	planeVertices = [
        vec3(  -1.0, -0.1,-1.0 ),
        vec3(  1.0,  -0.1,-1.0 ),
        vec3(  -1.0, -0.1,  1.0 ),
        vec3(  1.0, -0.1, 1.0 )
    ];
	
    surnameVertices = [
        vec3(  0.0,  -0.05,0.08),
        vec3(  0.3,  -0.05,0.1),
        vec3(  0.0,  0.05, 0.1),
        vec3(  0.3,  0.05, 0.12)
    ];

    // Load the data into the GPU
	bufferCone = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferCone );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(verticesCone), gl.STATIC_DRAW );
	
	bufferMiniCone = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferMiniCone );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(verticesMiniCone), gl.STATIC_DRAW );
	
	bufferPlane= gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferPlane );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(planeVertices), gl.STATIC_DRAW );

    bufferSurname = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferSurname );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(surnameVertices), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
	
    transformationMatrixLoc = gl.getUniformLocation( program, "transformationMatrix" );
	modelView = gl.getUniformLocation( program, "modelView" );
    projection = gl.getUniformLocation( program, "projection" );
    colorLoc = gl.getUniformLocation( program, "color" );
	
	document.getElementById("inp_fovy").oninput = function(event) { fovy = event.target.value; };
	document.getElementById("inp_objCamPosX").oninput = function(event) { eye[0] = event.target.value; };
	document.getElementById("inp_objCamPosY").oninput = function(event) { eye[1] = event.target.value; };
	document.getElementById("inp_objCamPosZ").oninput = function(event) { eye[2] = event.target.value; };
	document.getElementById("inp_objTargetX").oninput = function(event) { at[0] = event.target.value; };
	document.getElementById("inp_objTargetY").oninput = function(event) { at[1] = event.target.value; };
	document.getElementById("inp_objTargetZ").oninput = function(event) { at[2] = event.target.value; };   
    document.getElementById("inp_objX").oninput = function(event) { pos[0] = event.target.value; };
    document.getElementById("inp_objY").oninput = function(event) { pos[1] = event.target.value; };
	document.getElementById("inp_objZ").oninput = function(event) { pos[2] = event.target.value; };
    document.getElementById("inp_obj_scale").oninput = function(event) {
        scale[0] = event.target.value;
        scale[1] = event.target.value;
		scale[2] = event.target.value;
    };
    document.getElementById("inp_speed").oninput = function(event) { speed = parseFloat(event.target.value); };
    document.getElementById("inp_obj_rotationX").oninput = function(event) { rotationX = event.target.value; };
	document.getElementById("inp_obj_rotationY").oninput = function(event) { rotationY = event.target.value; };
	document.getElementById("inp_obj_rotationZ").oninput = function(event) { rotationZ = event.target.value; };
    document.getElementById("redSlider").oninput = function(event) { color[0] = event.target.value; };
    document.getElementById("greenSlider").oninput = function(event) { color[1] = event.target.value; };
    document.getElementById("blueSlider").oninput = function(event) { color[2] = event.target.value; };

    render();

};

function render() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
    var mvMatrix = lookAt(eye, at , up);
    var pMatrix = perspective(fovy, aspect, near, far);
	
	gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
	gl.uniformMatrix4fv( projection, false, flatten(pMatrix) );
	
    transformationMatrix = mat4();
	transformationMatrix = mult(transformationMatrix, translate(0.0,-0.15,0.0));
	gl.uniformMatrix4fv( transformationMatrixLoc, false, flatten(transformationMatrix) );
    gl.uniform4fv( colorLoc, [ 1.0, 1.0, 0.0, 0.65 ] );
	gl.bindBuffer( gl.ARRAY_BUFFER, bufferPlane );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
	
    transformationMatrix = mult(transformationMatrix, translate(pos[0],pos[1],pos[2]));
    transformationMatrix = mult(transformationMatrix, rotate(rotationX,[1,0,0]));
	transformationMatrix = mult(transformationMatrix, rotate(rotationY,[0,1,0]));
	transformationMatrix = mult(transformationMatrix, rotate(rotationZ,[0,0,1]));
    transformationMatrix = mult(transformationMatrix, scalem(scale[0],scale[1],scale[2]));
   
    gl.uniformMatrix4fv( transformationMatrixLoc, false, flatten(transformationMatrix));
    gl.uniform4fv( colorLoc, flatten(color) );
	gl.bindBuffer( gl.ARRAY_BUFFER, bufferCone );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
	gl.drawArrays( gl.TRIANGLE_FAN, 0, count+2 );
	
	transformationMatrix = mult(transformationMatrix, translate(0.0,0.22,0.0));
	gl.uniformMatrix4fv( transformationMatrixLoc, false, flatten(transformationMatrix));
    gl.uniform4fv( colorLoc, flatten(color) );
	gl.bindBuffer( gl.ARRAY_BUFFER, bufferMiniCone );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
	gl.drawArrays( gl.TRIANGLE_FAN, 0, count+2 );

    theta += speed;    
    transformationMatrix = mult(transformationMatrix, rotateZ(theta));
	gl.uniform4fv( colorLoc, [0.0,1.0,0.0,1.0] );
    gl.uniformMatrix4fv( transformationMatrixLoc, false, flatten(transformationMatrix));
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferSurname );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );

    gl.uniform4fv( colorLoc, [1.0,0.0,0.0,1.0] );
    transformationMatrix = mult(transformationMatrix, rotateZ(120));
    gl.uniformMatrix4fv( transformationMatrixLoc, false, flatten(transformationMatrix));
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
	
    gl.uniform4fv( colorLoc, [0.0,0.0,1.0,1.0] );
    transformationMatrix = mult(transformationMatrix, rotateZ(120));
    gl.uniformMatrix4fv( transformationMatrixLoc, false, flatten(transformationMatrix));
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
	

    window.requestAnimFrame(render);
}
