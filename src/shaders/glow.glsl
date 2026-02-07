/**
 * Custom Glow Shader for "Souvenirs Flottants"
 * Type: GLSL Fragment Shader
 */

uniform float uTime;
uniform vec3 uColor;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    // 1. Fresnel Effect (Lueur sur les bords)
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - dot(vNormal, viewDirection), 3.0);
    
    // 2. Pulse Animation
    float pulse = (sin(uTime * 2.0) * 0.5 + 0.5) * 0.2;
    float finalAlpha = fresnel + pulse;
    
    // 3. Final Color Composition
    vec3 glowColor = uColor + (fresnel * 0.5);
    
    gl_FragColor = vec4(glowColor, clamp(finalAlpha, 0.0, 1.0));
    
    // Add additive blending feel
    if (gl_FragColor.a < 0.1) discard;
}

/**
 * Vertex Shader excerpt (to be paired with above)
 */
/*
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = vec3(modelMatrix * vec4(position, 1.0));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
*/
