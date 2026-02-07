varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying float vNoise;

uniform float uTime;
uniform float uPulseSpeed;

// Simple 3D Noise function for organic movement
float hash(float n) { return fract(sin(n) * 753.5453123); }
float noise(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f*f*(3.0-2.0*f);
    float n = p.x + p.y*157.0 + 113.0*p.z;
    return mix(mix(mix(hash(n+  0.0), hash(n+  1.0),f.x),
                   mix(hash(n+157.0), hash(n+158.0),f.x),f.y),
               mix(mix(hash(n+113.0), hash(n+114.0),f.x),
                   mix(hash(n+270.0), hash(n+271.0),f.x),f.y),f.z);
}

void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    
    // Organic wobbly pulse using noise
    float noiseVal = noise(position * 2.0 + uTime * uPulseSpeed * 0.5);
    vNoise = noiseVal;
    
    float pulse = 1.0 + sin(uTime * uPulseSpeed + noiseVal * 5.0) * 0.05; 
    vec3 newPosition = position * pulse;
    
    // Additional soft wobble
    newPosition += vNormal * noiseVal * 0.03;
    
    vPosition = (modelViewMatrix * vec4(newPosition, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
