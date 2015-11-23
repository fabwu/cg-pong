attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec3 aVertexColor;

uniform mat3 uNormalMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec3 vColor;

void main() {
    vec4 position = vec4(aVertexPosition, 1.0);
    gl_Position = uProjectionMatrix * uModelViewMatrix * position;

    float ambientValue = 0.3;
    vec3 ambientLight = vec3(ambientValue, ambientValue, ambientValue);
    vec3 directionalLightColor = vec3(0.5, 0.5, 0.75);
    vec3 directionalVector = vec3(-1, 1, 0.75);

    vec3 transformedNormal = uNormalMatrix * aVertexNormal;

    float directional = max(dot(transformedNormal, directionalVector), 0.0);

    vColor = (ambientLight + (directionalLightColor * directional)) * aVertexColor;
}