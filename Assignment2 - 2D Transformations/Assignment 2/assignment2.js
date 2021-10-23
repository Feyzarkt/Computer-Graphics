"use strict";

var canvas;
var gl;

var scale = vec3(1, 1, 1); 
var theta=0;
var theta2=0;
var trans = vec3(0,0,1);
var speed =0.5;
var r,g,b;

var bufferTri, bufferRect1, bufferRect2, bufferRect3, triVertices, rectVertices1, rectVertices2, rectVertices3;
var vPosition;
var transformationMatrix, transformationMatrixLoc, fColorLoc;

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

    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Make the letters
    triVertices = [
        vec2(  -0.25,  -0.75 ),
        vec2(  0.25,  -0.75 ),
        vec2(  0.0, 0.2 )
    ];

    rectVertices1 = [
        vec2(  0.068,  -0.077 ),
        vec2(  0.37,  0.33 ),
		vec2(  -0.1,  0.055 ),
        vec2(  0.2,  0.45 )
        
    ];
	
	rectVertices2 = [
		vec2(  0.075,  0.075 ),
        vec2(  0.43,  -0.27 ),
        vec2(  -0.075,  -0.075 ),
        vec2(  0.27,  -0.43 )
	];
	
	rectVertices3 = [
		vec2(  0.0,  0.1 ),
        vec2(  -0.5,  0.1 ),
        vec2(  0.0,  -0.1 ),
        vec2(  -0.5,  -0.1 )
	];
	

    // Load the data into the GPU
    bufferTri = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferTri );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(triVertices), gl.STATIC_DRAW );

    // Load the data into the GPU
    bufferRect1 = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferRect1 );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(rectVertices1), gl.STATIC_DRAW );

	bufferRect2 = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, bufferRect2 );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(rectVertices2), gl.STATIC_DRAW );
	
	bufferRect3 = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, bufferRect3 );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(rectVertices3), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
		
    transformationMatrixLoc = gl.getUniformLocation( program, "transformationMatrix" );
	fColorLoc = gl.getUniformLocation(program, "fColor");
	
    document.getElementById("inp_objX").oninput = function(event) {
        
		trans[0]=event.target.value;
    };
    document.getElementById("inp_objY").oninput = function(event) {
        
		trans[1]=event.target.value;
    };
    document.getElementById("inp_obj_scale").oninput = function(event) {
        
		scale[0] = event.target.value;
        scale[1] = event.target.value;
    };
    document.getElementById("inp_obj_rotation").oninput = function(event) {
       
		theta2=event.target.value;
    };
    document.getElementById("inp_wing_speed").oninput = function(event) {
       
	    speed = event.target.value; 
    };
    document.getElementById("redSlider").oninput = function(event) {
		
		r=event.target.value;
    };
    document.getElementById("greenSlider").oninput = function(event) {
       
		g=event.target.value;
    };
    document.getElementById("blueSlider").oninput = function(event) {
      
		b=event.target.value;
    };

    render();

};


function render() {

    gl.clear( gl.COLOR_BUFFER_BIT );
		
	transformationMatrix = mat4();
	
	transformationMatrix = mult(transformationMatrix, translate(trans[0], trans[1], trans[2]));
	//I moved the mill to its previous location.
	transformationMatrix = mult(transformationMatrix, translate(0.0, -0.3, 0.0));
	transformationMatrix = mult(transformationMatrix, rotateZ(theta2));
	transformationMatrix = mult(transformationMatrix, scalem(scale[0], scale[1], scale[2]));
	//I used scaling because I wanted to make small my windmill. 
	transformationMatrix = mult(transformationMatrix, scalem(0.8, 0.8, scale[2])); 
	//I found the center of the mill.
	transformationMatrix = mult(transformationMatrix, translate(0.0, 0.3, 0.0));
	
    gl.uniformMatrix4fv( transformationMatrixLoc, false, flatten(transformationMatrix) );
	
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferTri );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
	gl.uniform4f(fColorLoc, r, g, b, 1.0);
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 3 );
	
	theta += speed * 2;
	transformationMatrix = mult(transformationMatrix, rotateZ(theta));
	gl.uniformMatrix4fv( transformationMatrixLoc, false, flatten(transformationMatrix) );

    gl.bindBuffer( gl.ARRAY_BUFFER, bufferRect1 );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
	gl.uniform4f(fColorLoc, 0.0, 1.0, 0.0, 1.0);//green
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );

	gl.bindBuffer( gl.ARRAY_BUFFER, bufferRect2 );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
	gl.uniform4f(fColorLoc, 1.0, 0.0, 0.0, 1.0);//red
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
	
	gl.bindBuffer( gl.ARRAY_BUFFER, bufferRect3 );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
	gl.uniform4f(fColorLoc, 0.0, 0.0, 1.0, 1.0);//blue
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );

    window.requestAnimFrame(render);
}
