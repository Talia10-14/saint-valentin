varying vec3 vNormal;
varying vec3 vPosition;
varying float vNoise;

uniform vec3 uColor;
uniform float uTime;

void main() {
    // Advanced Fresnel (Rim Light)
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - max(dot(viewDirection, vNormal), 0.0), 3.0);
    
    // Animated Glitter based on normals and time
    float glitter = fract(sin(dot(vNormal.xy + sin(uTime * 0.5), vec2(12.9898, 78.233))) * 43758.5453);
    float sparkle = step(0.99, glitter) * (0.5 + 0.5 * sin(uTime * 10.0 + vPosition.x * 10.0));
    
    // spiritual / oniric glow intensity
    float glow = fresnel * 0.6 + sparkle * 0.4;
    
    // Subtle chromatic shift based on noise from vertex
    vec3 oniricColor = uColor;
    oniricColor.r += vNoise * 0.05;
    oniricColor.b += fresnel * 0.2;
    
    vec3 finalColor = mix(oniricColor, vec3(1.0, 0.9, 0.8), glow);
    
    gl_FragColor = vec4(finalColor, 0.9);
}
