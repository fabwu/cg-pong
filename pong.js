// we save the canvas and the gl context globally
var canvas;
var gl;

// program and attribute locations
var shaderProgram;

// attribute locations
var aVertexPositionId;
var aVertexNormalId;
var aVertexColorId;
var uNormalMatrixId;
var uModelViewMatrixId;
var uProjectionMatrixId;

var projectionMatrix;

// objects to draw
var solidCube;
var panel;
var sphere;

var spherePosition = [0.0, 0.0, 0.0];
var padelPosition = [0.0, -0.15];

var oldTimestamp = 0;
var xVelocity = 0.01;
var yVelocity = 0.008;
var zVelocity = 0.009;

/**
 * startup function to be called when the body is loaded
 */
function startup() {
    canvas = document.getElementById("canvas");
    gl = createGLContext(canvas);
    initGL();
    draw();
    window.requestAnimationFrame(drawAnimated);
    document.onkeydown = checkKey;
}

function checkKey(e) {
    const LEFT = 37;
    const UP = 38;
    const RIGHT = 39;
    const DOWN = 40;

    switch (e.keyCode) {
        case LEFT:
            padelPosition[0] -= 0.01;
            break;
        case UP:
            padelPosition[1] += 0.01;
            break;
        case RIGHT:
            padelPosition[0] += 0.01;
            break;
        case DOWN:
            padelPosition[1] -= 0.01;
            break;
    }
}

/**
 * Initialize openGL. Only called once to setup appropriate parameters.
 */
function initGL() {
    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.frontFace(gl.CW); // defines how the front face is drawn
    gl.cullFace(gl.BACK); // defines which face should be culled
    gl.enable(gl.CULL_FACE); // enables culling

    initShaders();
    initCamera();
    setupAttributes();
    setupObjects();
}

/**
 * Initialize the camera
 */
function initCamera() {
    // init model view matrix
    var matrix = mat4.create();
    mat4.identity(matrix);
    mat4.lookAt(matrix, [0, -0.2, 1.93], [0, 0, 0], [0, 1, 0]);
    pushMatrix(matrix);

    projectionMatrix = mat4.create();
    // init projection matrix
    var aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
    mat4.perspective(projectionMatrix, glMatrix.toRadian(40), aspectRatio, 0.5, 10.0);
}

/**
 * Initialize the shader programs.
 */
function initShaders() {
    shaderProgram = loadAndCompileShaders(gl, 'vertex-diffuse.glsl', 'fragment-diffuse.glsl');
}

/**
 * Setup the location of the attributes for communication with the shaders
 */
function setupAttributes() {
    // finds the index of the variable in the program
    aVertexPositionId = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    aVertexNormalId = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    aVertexColorId = gl.getAttribLocation(shaderProgram, "aVertexColor");
    uNormalMatrixId = gl.getUniformLocation(shaderProgram, "uNormalMatrix");
    uModelViewMatrixId = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
    uProjectionMatrixId = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
}

/**
 * Setup the objects to be drawn
 */
function setupObjects() {
    panel = definePadel(gl);
    solidCube = defineSolidCube(gl);
    sphere = defineSphere(gl, 50, 50);
}

/**
 * Draw the scene
 */
function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
    gl.uniformMatrix4fv(uProjectionMatrixId, false, projectionMatrix);

    var padelMatrix = topMatrix();
    padelPosition[2] = 1.4;
    mat4.translate(padelMatrix, padelMatrix, padelPosition);
    mat4.scale(padelMatrix, padelMatrix, [0.1, 0.1, 0.0]);

    var normalMatrix = mat3.create();
    mat3.normalFromMat4(normalMatrix, padelMatrix);
    gl.uniformMatrix3fv(uNormalMatrixId, false, normalMatrix);

    drawSolidCube(gl, panel, aVertexPositionId, aVertexNormalId, aVertexColorId, uModelViewMatrixId, padelMatrix);

    var cubeMatrix = topMatrix();
    mat4.translate(cubeMatrix, cubeMatrix, [0.0, 0.0, 0.0]);
    mat4.scale(cubeMatrix, cubeMatrix, [1, 1, 1.5]);

    mat3.normalFromMat4(normalMatrix, cubeMatrix);
    gl.uniformMatrix3fv(uNormalMatrixId, false, normalMatrix);

    drawSolidCube(gl, solidCube, aVertexPositionId, aVertexNormalId, aVertexColorId, uModelViewMatrixId, cubeMatrix);

    var sphereMatrix = topMatrix();
    mat4.translate(sphereMatrix, sphereMatrix, spherePosition);
    mat4.scale(sphereMatrix, sphereMatrix, [0.05, 0.05, 0.05]);

    drawSphere(gl, sphere, aVertexPositionId, aVertexColorId, aVertexNormalId, sphereMatrix, [1.0, 1.0, 1.0])
}

function drawAnimated(timeStamp) {
    if (timeStamp - oldTimestamp > 10) {
        oldTimestamp = timeStamp;

        if (spherePosition[0] > 0.4) {
            xVelocity *= -1;
        }

        if (spherePosition[0] < -0.4) {
            xVelocity *= -1;
        }

        if (spherePosition[1] > 0.4) {
            yVelocity *= -1;
        }

        if (spherePosition[1] < -0.4) {
            yVelocity *= -1;
        }

        if (spherePosition[2] > 1.0) {
            zVelocity *= -1;
        }

        if (spherePosition[2] < -0.7) {
            zVelocity *= -1;
        }

        spherePosition[0] += xVelocity;
        spherePosition[1] += yVelocity;
        spherePosition[2] += zVelocity;

        draw();
    }

    window.requestAnimationFrame(drawAnimated);
}
// this variable should only be used here for implementing the matrix stack
var modelViewMatrixStack = [];

/**
 * Push the matrix to the stack
 * @param matrix the matrix to be pushed
 */
function pushMatrix(matrix) {
    modelViewMatrixStack.push(matrix);
}

/**
 *
 * @returns the matrix that was on top of the stack
 */
function popMatrix() {
    return modelViewMatrixStack.pop();
}

/**
 * Returns a copy of the matrix at the top of the stack. This matrix can then be manipulated
 * without an effect upon other matrices on the stack
 * @returns {mat4} A copy of the matrix on top of the stack.
 */
function topMatrix() {
    var matrix = modelViewMatrixStack[modelViewMatrixStack.length - 1];
    return mat4.clone(matrix);
}

function defineSolidCubeVertices(gl) {
    // define the vertices of the cube
    // we organize them now by side, so that we can have constant colored faces
    var vertices = [
        // Normalenvektor gehört zur Fläche deshalb ist er überall gleich
        // back
        0, 0, 0, // v0
        1, 0, 0, // v1
        1, 1, 0, // v2
        0, 1, 0, // v3

        // front
        0, 0, 1, // v4
        1, 0, 1, // v5
        1, 1, 1, // v6
        0, 1, 1, // v7

        // right
        1, 0, 0, // v8 = v1
        1, 1, 0, // v9 = v2
        1, 1, 1, // v10 = v6
        1, 0, 1, // v11 = v5

        // left
        0, 0, 0, // v12 = v0
        0, 1, 0, // v13 = v3
        0, 1, 1, // v14 = v7
        0, 0, 1, // v15 = v4

        // top
        0, 1, 0, // v16 = v3
        0, 1, 1, // v17 = v7
        1, 1, 1, // v18 = v6
        1, 1, 0, // v19 = v2

        // bottom
        0, 0, 0, // v20 = v0
        0, 0, 1, // v21 = v4
        1, 0, 1, // v22 = v5
        1, 0, 0  // v23 = v1
    ];
    var bufferVertices = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferVertices);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    return bufferVertices;
}

function defineSolidCubeColors(gl) {
    var backColor = [1.0, 0.0, 0.0],
        frontColor = [0.0, 0.0, 1.0],
        rightColor = [0.0, 1.0, 0.0],
        leftColor = [1.0, 1.0, 0.0],
        topColor = [1.0, 0.0, 1.0],
        bottomColor = [0.0, 1.0, 1.0];

    // make 4 entries, one for each vertex
    var backSide = backColor.concat(backColor, backColor, backColor);
    var frontSide = frontColor.concat(frontColor, frontColor, frontColor);
    var rightSide = rightColor.concat(rightColor, rightColor, rightColor);
    var leftSide = leftColor.concat(leftColor, leftColor, leftColor);
    var topSide = topColor.concat(topColor, topColor, topColor);
    var bottomSide = bottomColor.concat(bottomColor, bottomColor, bottomColor);

    var allSides = backSide.concat(frontSide, rightSide, leftSide, topSide, bottomSide);

    var bufferColor = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferColor);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(allSides), gl.STATIC_DRAW);
    return bufferColor;
}

function definePadelColors(gl) {
    var backColor = [0.0, 0.0, 0.0],
        frontColor = [0.0, 0.0, 1.0],
        rightColor = [0.0, 1.0, 0.0],
        leftColor = [1.0, 1.0, 0.0],
        topColor = [1.0, 0.0, 1.0],
        bottomColor = [0.0, 1.0, 1.0];

    // make 4 entries, one for each vertex
    var backSide = backColor.concat(backColor, backColor, backColor);
    var frontSide = frontColor.concat(frontColor, frontColor, frontColor);
    var rightSide = rightColor.concat(rightColor, rightColor, rightColor);
    var leftSide = leftColor.concat(leftColor, leftColor, leftColor);
    var topSide = topColor.concat(topColor, topColor, topColor);
    var bottomSide = bottomColor.concat(bottomColor, bottomColor, bottomColor);

    var allSides = backSide.concat(frontSide, rightSide, leftSide, topSide, bottomSide);

    var bufferColor = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferColor);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(allSides), gl.STATIC_DRAW);
    return bufferColor;
}

function defineSolidCubeSides(gl) {
    var vertexIndices = [
        0, 2, 1, // face 0 (back)
        2, 0, 3,
        4, 5, 6, // face 1 (front)
        4, 6, 7,
        8, 9, 10, // face 2 (right)
        10, 11, 8,
        12, 15, 14, // face 3 (left)
        14, 13, 12,
        16, 17, 18, // face 4 (top)
        18, 19, 16,
        20, 23, 22, // face 5 (bottom)
        22, 21, 20
    ];
    var bufferSides = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferSides);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);
    return bufferSides;
}

function defineSolidCubeNormalVectors(gl) {
    var backNormal = [0, 0, 1],
        frontNormal = [0, 0, 1],
        rightNormal = [-1, 0, 0],
        leftNormal = [-1, 0, 0],
        topNormal = [0, 1, 0],
        bottomNormal = [0, 1, 0];

    // make 4 entries, one for each vertex
    var backSide = backNormal.concat(backNormal, backNormal, backNormal);
    var frontSide = frontNormal.concat(frontNormal, frontNormal, frontNormal);
    var rightSide = rightNormal.concat(rightNormal, rightNormal, rightNormal);
    var leftSide = leftNormal.concat(leftNormal, leftNormal, leftNormal);
    var topSide = topNormal.concat(topNormal, topNormal, topNormal);
    var bottomSide = bottomNormal.concat(bottomNormal, bottomNormal, bottomNormal);

    var allSides = backSide.concat(frontSide, rightSide, leftSide, topSide, bottomSide);

    var bufferNormal = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferNormal);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(allSides), gl.STATIC_DRAW);
    return bufferNormal;
}

/**
 * Define the cube, the cube is modelled at the origin
 */
function defineSolidCube(gl) {
    return {
        bufferVertices: defineSolidCubeVertices(gl),
        bufferColor: defineSolidCubeColors(gl),
        bufferSides: defineSolidCubeSides(gl),
        bufferNormal: defineSolidCubeNormalVectors(gl)
    }
}

/**
 * Define the cube, the cube is modelled at the origin
 */
function definePadel(gl) {
    return {
        bufferVertices: defineSolidCubeVertices(gl),
        bufferColor: definePadelColors(gl),
        bufferSides: defineSolidCubeSides(gl),
        bufferNormal: defineSolidCubeNormalVectors(gl)
    }
}

/**
 * Draw the cube.
 */
function drawSolidCube(gl, cube, aVertexPositionId, aVertexNormalId, aVertexColorId, uniformMatrixId, matrixIn) {
    // setup transformation
    var matrix = mat4.create();
    // translate so that the position is the centre of the cube
    mat4.translate(matrix, matrixIn, vec3.fromValues(-0.5, -0.5, -0.5));

    gl.uniformMatrix4fv(uniformMatrixId, false, matrix);

    // bind the buffer, so that the cube vertices are used
    gl.bindBuffer(gl.ARRAY_BUFFER, cube.bufferVertices);
    gl.vertexAttribPointer(aVertexPositionId, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aVertexPositionId);

    // bind buffer for normal vectors
    gl.bindBuffer(gl.ARRAY_BUFFER, cube.bufferNormal);
    gl.vertexAttribPointer(aVertexNormalId, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aVertexNormalId);

    // bind the buffer for color
    gl.bindBuffer(gl.ARRAY_BUFFER, cube.bufferColor);
    gl.vertexAttribPointer(aVertexColorId, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aVertexColorId);

    // draw the elements
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.bufferSides);
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
}