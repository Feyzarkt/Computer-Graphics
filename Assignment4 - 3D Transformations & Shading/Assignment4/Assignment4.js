"use strict";

var canvas;
var gl;

var verticesCone, planeVertices, surnameVertices;
var normalsCone=[], planeNormals, surnameNormals;
var bufferCone, bufferSurname, bufferPlane;
var bufferCN, bufferPN, bufferSN;

var transformationMatrix, transformationMatrixLoc;
var normalMatrix, normalMatrixLoc;
var color, colorLoc;
var lightLoc, ambientLoc, diffuseLoc, specularLoc, shininessLoc;

var vPosition, vNormal;
var pos, scale, rotationX, rotationY, rotationZ;
var speed, theta = 0, slices = 20;

//------------

var modelView, projection;
var mvMatrix, pMatrix;

var eye = [0.0,0.7,3.0];
var at = [0.0,0.1,0.0];
var up = vec3(0.0,1.0,0.0);

var fovy = 30.0;
var aspect = 1.0;
var near = 1.0;
var far = 10.0;

//------------

var lightPosition = vec4(3.0, 5.0, 2.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 0.5, 0.5, 1.0, 0.5 );
var materialShininess = 20.0;

var ambientProduct ;
var diffuseProduct;
var specularProduct ;

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
	
	ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
	
	//--------------------Cone------------------
	
	verticesCone = [vec4( 0,0.6,0,0)];
	
    for (var i = 0; i <= slices+2; i++) {
        var angle = 2*i*Math.PI/slices;
        verticesCone.push(vec4( 0.15*Math.sin(angle),-0.1,0.15*Math.cos(angle),1) );
		normalsCone.push(normalize(vec4( 0.15*Math.sin(angle),1, 0.15*Math.cos(angle),0)));
    };
	
	//------------------------------------------
	
    pos = [0,0,0];
    scale = [1,1,1];
    rotationX = 0;
	rotationY = 0;
	rotationZ = 0;
    color = [0,0,0,1];
    speed = 0.5;

    // Make the letters
 	planeVertices = [
		vec4(  -1.0,  -0.1,  -1.0, 1.0 ),
        vec4(  -1.0,  -0.1,  1.0, 1.0 ),
        vec4(  1.0,  -0.1,  -1.0, 1.0 ),
        vec4(  1.0,  -0.1,  1.0, 1.0 )
    ];
	
	planeNormals = [
        vec4(  0.0,  1.0, 0.0, 0.0 ),
        vec4(  0.0,  1.0, 0.0, 0.0 ),
        vec4(  0.0,  1.0, 0.0, 0.0 ),
        vec4(  0.0,  1.0, 0.0, 0.0 )
    ];
	
	surnameVertices = [
        vec3(  0.0,  -0.05,0.08),
        vec3(  0.3,  -0.05,0.1),
        vec3(  0.0,  0.05, 0.1),
        vec3(  0.3,  0.05, 0.12)
    ];
	
	surnameNormals = [
        vec4( 0.0,	 0.0,	1.0,	0.0),
        vec4( 0.0,	 0.0,	1.0,	0.0),
        vec4( 0.0,	 0.0,	1.0,	0.0),
        vec4( 0.0,	 0.0,	1.0,	0.0)
    ];

    // Load the data into the GPU
	bufferCone = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferCone );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(verticesCone), gl.STATIC_DRAW );
	
	bufferCN= gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferCN );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsCone), gl.STATIC_DRAW );
	
	bufferPlane= gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferPlane );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(planeVertices), gl.STATIC_DRAW );
	
	bufferPN= gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferPN );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(planeNormals), gl.STATIC_DRAW );
	
	bufferSurname = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferSurname );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(surnameVertices), gl.STATIC_DRAW );
	
	bufferSN = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferSN );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(surnameNormals), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
	vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);
	
    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
	
    transformationMatrixLoc = gl.getUniformLocation( program, "transformationMatrix" );
	modelView = gl.getUniformLocation( program, "modelView" );
    projection = gl.getUniformLocation( program, "projection" );
    colorLoc = gl.getUniformLocation( program, "vColor" );
	normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
	
	lightLoc= gl.getUniformLocation(program,"lightPosition");
	ambientLoc= gl.getUniformLocation(program, "ambientProduct");
	diffuseLoc= gl.getUniformLocation(program, "diffuseProduct");
	specularLoc= gl.getUniformLocation(program, "specularProduct");
	shininessLoc= gl.getUniformLocation(program, "shininess");
	
	document.getElementById("inp_fovy").oninput = function(event) { fovy = event.target.value; };
	
	document.getElementById("inp_objCamPosX").oninput = function(event) { eye[0] = event.target.value; };
	document.getElementById("inp_objCamPosY").oninput = function(event) { eye[1] = event.target.value; };
	document.getElementById("inp_objCamPosZ").oninput = function(event) { eye[2] = event.target.value; };
	
	document.getElementById("inp_objTargetX").oninput = function(event) { at[0] = event.target.value; };
	document.getElementById("inp_objTargetY").oninput = function(event) { at[1] = event.target.value; };
	document.getElementById("inp_objTargetZ").oninput = function(event) { at[2] = event.target.value; }; 
	
    document.getElementById("inp_objLightX").oninput = function(event) { lightPosition[0] = event.target.value; };
	document.getElementById("inp_objLightY").oninput = function(event) { lightPosition[1] = event.target.value; };
	document.getElementById("inp_objLightZ").oninput = function(event) { lightPosition[2] = event.target.value; };	
	
	document.getElementById("spec_R").oninput = function(event) { materialSpecular[0]=event.target.value; };
	document.getElementById("spec_G").oninput = function(event) { materialSpecular[1]=event.target.value; };
	document.getElementById("spec_B").oninput = function(event) { materialSpecular[2]=event.target.value; };
	
	document.getElementById("diff_R").oninput = function(event) { materialDiffuse[0]=event.target.value; };
	document.getElementById("diff_G").oninput = function(event) { materialDiffuse[1]=event.target.value; };
	document.getElementById("diff_B").oninput = function(event) { materialDiffuse[2]=event.target.value; };
	
	document.getElementById("ambient_R").oninput = function(event) { materialAmbient[0]=event.target.value; };
	document.getElementById("ambient_G").oninput = function(event) { materialAmbient[1]=event.target.value; };
	document.getElementById("ambient_B").oninput = function(event) { materialAmbient[2]=event.target.value; };
	
	document.getElementById("inp_shineness").oninput = function(event) { materialShininess=event.target.value; };
	
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
	
	normalMatrix = [
        vec3(mvMatrix[0][0], mvMatrix[0][1], mvMatrix[0][2]),
        vec3(mvMatrix[1][0], mvMatrix[1][1], mvMatrix[1][2]),
        vec3(mvMatrix[2][0], mvMatrix[2][1], mvMatrix[2][2])
    ];
	
	gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
	gl.uniformMatrix4fv( projection, false, flatten(pMatrix) );
	gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );
	
	gl.uniform4fv(lightLoc,flatten(lightPosition) );
	gl.uniform4fv( ambientLoc,flatten(materialAmbient) );
    gl.uniform4fv( diffuseLoc,flatten(materialDiffuse) );
    gl.uniform4fv( specularLoc,flatten(materialSpecular) );
    gl.uniform1f( shininessLoc,materialShininess );
	
    transformationMatrix = mat4();
	transformationMatrix = mult(transformationMatrix, translate(0.0,-0.15,0.0));
	gl.uniformMatrix4fv( transformationMatrixLoc, false, flatten(transformationMatrix) );
    gl.uniform4fv( colorLoc, [ 1.0, 1.0, 0.0, 0.65 ] );
	gl.bindBuffer( gl.ARRAY_BUFFER, bufferPlane );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
	gl.bindBuffer( gl.ARRAY_BUFFER, bufferPN );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
	
    transformationMatrix = mult(transformationMatrix, translate(pos[0],pos[1],pos[2]));
    transformationMatrix = mult(transformationMatrix, rotate(rotationX,[1,0,0]));
	transformationMatrix = mult(transformationMatrix, rotate(rotationY,[0,1,0]));
	transformationMatrix = mult(transformationMatrix, rotate(rotationZ,[0,0,1]));
    transformationMatrix = mult(transformationMatrix, scalem(scale[0],scale[1],scale[2]));
   
    gl.uniformMatrix4fv( transformationMatrixLoc, false, flatten(transformationMatrix));
    gl.uniform4fv( colorLoc, flatten(color) );
	gl.bindBuffer( gl.ARRAY_BUFFER, bufferCone );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
	gl.bindBuffer( gl.ARRAY_BUFFER, bufferCN );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
	gl.drawArrays( gl.TRIANGLE_FAN, 0, slices+2 );

	var transformationMatrix2 = mult(transformationMatrix, translate(0.0,0.2,0.01));
	transformationMatrix2 = mult(transformationMatrix2, rotateX(90));
    transformationMatrix2 = mult(transformationMatrix2, scalem(0.12,0.2,0.15));
    gl.uniformMatrix4fv( transformationMatrixLoc, false, flatten(transformationMatrix2) );
    gl.drawArrays( gl.TRIANGLE_FAN, 0, slices+2 );
	
	theta += speed;
	transformationMatrix = mult(transformationMatrix, translate(0.0,0.2,0));	
    transformationMatrix = mult(transformationMatrix, rotateZ(theta));
	gl.uniform4fv( colorLoc, [0.0,1.0,0.0,1.0] );
    gl.uniformMatrix4fv( transformationMatrixLoc, false, flatten(transformationMatrix));
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferSurname );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
	gl.bindBuffer( gl.ARRAY_BUFFER, bufferSN );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
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
