attribute vec3 aVertexPosition;
attribute vec3 aVertexColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec3 vColor;

void main() {
    vec4 position = vec4(aVertexPosition, 1.0);
    gl_Position = uProjectionMatrix * uModelViewMatrix * position;

    float ambientValue = 0.3;
    vec3 ambientLight = vec3(ambientValue, ambientValue, ambientValue);

    vColor = ambientLight * aVertexColor;
}