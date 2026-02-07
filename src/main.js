import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import gsap from 'gsap';
import { listMemories, getMemoryDetails, initiateCapture } from './api.js';

/**
 * L'Archéologie du Sentiment - Oniric Engine Sketch
 * Architecture Logicielle Senior / Creative Dev
 */

class OniricEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });

        this.clock = new THREE.Clock();
        this.plushies = [];
        this.hearts = [];
        this.particles = null;
        this.selectedPlushy = null;
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.raycaster.params.Line.threshold = 0.5;
        this.raycaster.params.Points.threshold = 0.5;
        this.raycaster.params.Mesh.threshold = 0.5;

        this.scrollProgress = 0;
        this.targetScroll = 0;

        this.init();
        this.initUI();
        this.initPostProcessing();
    }

    initPostProcessing() {
        this.composer = new EffectComposer(this.renderer);

        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // Unreal Bloom: Magical glow
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5, // strength
            0.4, // radius
            0.85 // threshold
        );
        this.composer.addPass(this.bloomPass);

        // Bokeh: Cinematic Depth of Field
        this.bokehPass = new BokehPass(this.scene, this.camera, {
            focus: 10.0,
            aperture: 0.025,
            maxblur: 0.01
        });
        this.composer.addPass(this.bokehPass);

        // Custom Vignette & Grain Shader
        const filmShader = {
            uniforms: {
                tDiffuse: { value: null },
                uAmount: { value: 0.1 },
                uTime: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float uAmount;
                uniform float uTime;
                varying vec2 vUv;
                float random(vec2 p) {
                    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                }
                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    float grain = random(vUv + uTime) * uAmount;
                    float dist = distance(vUv, vec2(0.5));
                    float vignette = smoothstep(0.8, 0.4, dist);
                    gl_FragColor = vec4((color.rgb + grain) * vignette, color.a);
                }
            `
        };
        this.filmPass = new ShaderPass(filmShader);
        this.composer.addPass(this.filmPass);

        const outputPass = new OutputPass();
        this.composer.addPass(outputPass);
    }

    init() {
        // 1. Environment & Atmosphere
        this.scene.background = new THREE.Color(0xaa0000); // Vibrant red background
        this.scene.fog = new THREE.FogExp2(0xaa0000, 0.01);

        // 2. Camera & Control
        this.camera.position.set(0, 5, 10);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.5;

        // 3. Lighting (Soft & Dynamic)
        const ambient = new THREE.AmbientLight(0xffaaaa, 0.4); // Soft reddish-white glow
        this.scene.add(ambient);

        this.initEnvironment(); // Load Env Map for reflections
        this.setupLights();
        this.spawnPlushyMemory();

        // 4. Events
        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('click', () => this.onClick());
        window.addEventListener('wheel', (e) => {
            this.targetScroll += e.deltaY * 0.05;
            this.targetScroll = Math.max(0, Math.min(this.targetScroll, 1000));
        });

        this.render();
    }

    initUI() {
        this.uiPanel = document.getElementById('memory-panel');
        this.closeBtn = document.getElementById('close-panel');
        this.captureBtn = document.getElementById('capture-button');

        this.closeBtn?.addEventListener('click', () => this.closePanel());
        this.captureBtn?.addEventListener('click', () => this.captureCurrentMemory());
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onClick() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        if (intersects.length > 0) {
            const object = intersects[0].object;

            if (object.userData.isHeart && object.userData.hasMemory) {
                if (window.navigator.vibrate) window.navigator.vibrate(20); // Micro-vibration
                this.revealMemoryFromHeart(object);
            } else if (object.userData.isPlushy) {
                if (window.navigator.vibrate) window.navigator.vibrate(40);
                this.selectPlushy(object);
            }
        }
    }

    async spawnPlushyMemory() {
        // Load shaders first
        this.shaders = await this.loadShaders();

        const memories = await listMemories();
        const heartGeo = this.getHeartGeometry();

        memories.forEach(data => {
            const mat = new THREE.MeshPhysicalMaterial({
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 1.5,
                transmission: 0.7,
                thickness: 0.5,
                roughness: 0.05,
                metalness: 0.05,
                transparent: true,
                opacity: 0.9
            });

            const containerHeart = new THREE.Mesh(heartGeo, mat);
            containerHeart.position.set(
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 30 - 30
            );
            containerHeart.rotation.set(Math.PI, Math.random() * Math.PI, 0);
            containerHeart.userData = {
                isHeart: true,
                hasMemory: true,
                memoryData: data,
                velocity: (Math.random() * 0.02) + 0.01, // Much slower
                rotVelocity: (Math.random() - 0.5) * 0.02
            };

            // Subtle Hint: Memory hearts are slightly bigger and have a tiny bit of emissive gold
            containerHeart.scale.setScalar(1.2);
            containerHeart.material.emissive.set(0xffaa00);
            containerHeart.material.emissiveIntensity = 2.0;

            this.scene.add(containerHeart);
            this.hearts.push(containerHeart);
        });

        this.createHeartGalaxy();
    }

    createTeddyBear(color, scale) {
        const group = new THREE.Group();

        // Materials - Premium Gummy look
        const bodyMat = new THREE.MeshPhysicalMaterial({
            color: color,
            roughness: 0.1,
            metalness: 0.1,
            transmission: 0.6, // Glassy/Gel aspect
            thickness: 0.5,
            ior: 1.45,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            emissive: color,
            emissiveIntensity: 0.2
        });

        // Inject external Shaders
        if (this.shaders) {
            bodyMat.onBeforeCompile = (shader) => {
                shader.uniforms.uTime = { value: 0 };
                shader.uniforms.uPulseSpeed = { value: 2.0 };
                shader.uniforms.uColor = { value: color };

                // Vertex Injection: Use the organic noise wobbly pulse from plushy.vert
                shader.vertexShader = `uniform float uTime;\nuniform float uPulseSpeed;\nvarying float vNoise;\n` + shader.vertexShader;

                // We need to inject the noise function and the vertex deformation
                // Since our plushy.vert is a full shader, we extract the relevant parts:
                // For simplicity in this creative coding context, we'll use a slightly more robust injection:

                const noiseFunc = `
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
                `;

                shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\n' + noiseFunc);
                shader.vertexShader = shader.vertexShader.replace(
                    '#include <begin_vertex>',
                    `
                    float noiseVal = noise(position * 2.0 + uTime * uPulseSpeed * 0.5);
                    vNoise = noiseVal;
                    float pulse = 1.0 + sin(uTime * uPulseSpeed + noiseVal * 5.0) * 0.05;
                    vec3 transformed = position * pulse + normal * noiseVal * 0.03;
                    `
                );

                // Fragment Injection: Rim light + Animated Glitter from plushy.frag
                shader.fragmentShader = `uniform float uTime;\nuniform vec3 uColor;\nvarying float vNoise;\n` + shader.fragmentShader;
                shader.fragmentShader = shader.fragmentShader.replace(
                    '#include <dithering_fragment>',
                    `
                    #include <dithering_fragment>
                    
                    // Oniric Glow & Glitter (Logic from plushy.frag)
                    vec3 viewDir = normalize(vViewPosition);
                    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
                    float glitter = fract(sin(dot(vNormal.xy + sin(uTime * 0.5), vec2(12.9898, 78.233))) * 43758.5453);
                    float sparkle = step(0.99, glitter) * (0.5 + 0.5 * sin(uTime * 10.0));
                    
                    float glow = fresnel * 0.6 + sparkle * 0.4;
                    vec3 oniricColor = uColor;
                    oniricColor.r += vNoise * 0.05;
                    oniricColor.b += fresnel * 0.2;
                    
                    gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0, 0.9, 0.8), glow);
                    `
                );
                bodyMat.userData.shader = shader;
            };
        }

        const redMat = new THREE.MeshPhysicalMaterial({
            color: 0xff0000,
            roughness: 0.2,
            metalness: 0.5,
            transmission: 0.8,
            thickness: 0.2
        });

        redMat.onBeforeCompile = (shader) => {
            shader.uniforms.uTime = { value: 0 };
            shader.vertexShader = `uniform float uTime;\n` + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                float pulse = 1.0 + sin(uTime * 4.0) * 0.08;
                vec3 transformed = position * pulse;
                `
            );
            shader.fragmentShader = `uniform float uTime;\n` + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <dithering_fragment>',
                `
                #include <dithering_fragment>
                float glitter = fract(sin(dot(vNormal.xy, vec2(12.9898, 78.233))) * 43758.5453);
                glitter = step(0.98, glitter) * 0.5; // Stronger glitter for the heart
                gl_FragColor.rgb += glitter;
                `
            );
            redMat.userData.shader = shader;
        };

        // Body
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.8, 32, 32), bodyMat);
        group.add(body);

        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 32), bodyMat);
        head.position.y = 1;
        group.add(head);

        // Ears
        const earGeo = new THREE.SphereGeometry(0.2, 16, 16);
        const earL = new THREE.Mesh(earGeo, bodyMat);
        earL.position.set(-0.4, 1.4, 0);
        group.add(earL);
        const earR = new THREE.Mesh(earGeo, bodyMat);
        earR.position.set(0.4, 1.4, 0);
        group.add(earR);

        // Arms
        const armGeo = new THREE.SphereGeometry(0.3, 16, 16);
        const armL = new THREE.Mesh(armGeo, bodyMat);
        armL.position.set(-0.7, 0.5, 0.2);
        group.add(armL);
        const armR = new THREE.Mesh(armGeo, bodyMat);
        armR.position.set(0.7, 0.5, 0.2);
        group.add(armR);

        // Legs
        const legGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const legL = new THREE.Mesh(legGeo, bodyMat);
        legL.position.set(-0.4, -0.7, 0.2);
        group.add(legL);
        const legR = new THREE.Mesh(legGeo, bodyMat);
        legR.position.set(0.4, -0.7, 0.2);
        group.add(legR);

        // Red Heart (The "For You" heart) - Simplified for performance
        const heartShape = new THREE.Shape();
        heartShape.moveTo(0, 0);
        heartShape.bezierCurveTo(0, 0, -1, -1, -2.5, 0);
        heartShape.bezierCurveTo(-4, 1, -4, 3, -4, 3);
        heartShape.bezierCurveTo(-4, 5, -2, 7, 0, 9);
        heartShape.bezierCurveTo(2, 7, 4, 5, 4, 3);
        heartShape.bezierCurveTo(4, 3, 4, 1, 2.5, 0);
        heartShape.bezierCurveTo(1, -1, 0, 0, 0, 0);

        const heartGeo = new THREE.ExtrudeGeometry(heartShape, { depth: 1, bevelEnabled: true, bevelSize: 0.5 });
        const heartMesh = new THREE.Mesh(heartGeo, redMat);
        heartMesh.scale.set(0.04, 0.04, 0.04);
        heartMesh.rotation.z = Math.PI;
        heartMesh.position.set(0, 0.3, 0.6);
        group.add(heartMesh);

        group.scale.setScalar(scale);

        return group;
    }

    async selectPlushy(plushy) {
        this.selectedPlushy = plushy;

        // Load full details
        const details = await getMemoryDetails(plushy.userData.id);

        // Update UI
        document.getElementById('memory-title').innerText = details.name;
        document.getElementById('memory-story').innerText = details.fullStory;
        document.getElementById('memory-tag').innerText = details.emotionType;

        this.uiPanel?.classList.add('visible');

        // Visual feedback on selection
        this.plushies.forEach(p => {
            p.traverse(child => {
                if (child.material) {
                    gsap.to(child.material, { emissiveIntensity: p === plushy ? 4 : 0.5, duration: 0.5 });
                    if (p === plushy && child.material.color.getHex() === 0xffffff) {
                        // Extra shine for the selected white bear body
                        gsap.to(child.material, { emissiveIntensity: 6, duration: 0.5 });
                    }
                }
            });
        });

        // Camera transition
        gsap.to(this.camera.position, {
            x: plushy.position.x + 2,
            y: plushy.position.y + 1,
            z: plushy.position.z + 5,
            duration: 2,
            ease: "expo.out",
            onUpdate: () => this.controls.update()
        });

        this.controls.autoRotate = false;
    }

    closePanel() {
        this.uiPanel?.classList.remove('visible');
        if (this.selectedPlushy) {
            this.selectedPlushy.traverse(child => {
                if (child.material) {
                    gsap.to(child.material, { emissiveIntensity: 0.5, duration: 0.5 });
                }
            });
            this.selectedPlushy = null;
        }
        this.controls.autoRotate = true;

        // Reset camera gently
        gsap.to(this.camera.position, {
            x: 0, y: 5, z: 10,
            duration: 2,
            ease: "power2.inOut"
        });
    }

    async captureCurrentMemory() {
        if (!this.selectedPlushy) return;

        const memory = this.selectedPlushy;
        this.uiPanel?.classList.add('capturing');

        // Phase 1: Animation "Aspiration"
        memory.traverse(child => {
            if (child.material) {
                gsap.to(child.material, { emissiveIntensity: 20, duration: 0.5 });
            }
        });

        gsap.to(memory.scale, {
            x: 1.5, y: 1.5, z: 1.5,
            duration: 0.5,
            ease: "elastic.out(1, 0.3)"
        });

        // Phase 2: Call API
        const session = await initiateCapture(memory.userData.id);

        // Update UI Counter
        const countEl = document.getElementById('captured-count');
        if (countEl) countEl.innerText = parseInt(countEl.innerText) + 1;

        // Phase 3: Final Scale Down and Redirect
        gsap.to(memory.scale, {
            x: 0, y: 0, z: 0,
            duration: 0.8,
            ease: "expo.in",
            onComplete: () => {
                window.location.href = session.stripeCheckoutUrl;
            }
        });
    }

    initEnvironment() {
        const loader = new RGBELoader();
        // Standard high-end studio environment for reflections
        loader.load('https://threejs.org/examples/textures/equirectangular/royal_esplanade_1k.hdr', (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            this.scene.environment = texture;
        });
    }

    setupLights() {
        const pointLight = new THREE.PointLight(0xff0000, 5, 50);
        pointLight.position.set(5, 5, 5);
        this.scene.add(pointLight);

        const secondaryLight = new THREE.PointLight(0xffaa00, 2, 30);
        secondaryLight.position.set(-5, 0, 10);
        this.scene.add(secondaryLight);
    }

    getHeartGeometry() {
        const shape = new THREE.Shape();
        const x = 0, y = 0;
        shape.moveTo(x + 0.25, y + 0.25);
        shape.bezierCurveTo(x + 0.25, y + 0.25, x + 0.2, y, x, y);
        shape.bezierCurveTo(x - 0.3, y, x - 0.3, y + 0.35, x - 0.3, y + 0.35);
        shape.bezierCurveTo(x - 0.3, y + 0.55, x - 0.15, y + 0.77, x + 0.25, y + 0.95);
        shape.bezierCurveTo(x + 0.6, y + 0.77, x + 0.8, y + 0.55, x + 0.8, y + 0.35);
        shape.bezierCurveTo(x + 0.8, y + 0.35, x + 0.8, y, x + 0.5, y);
        shape.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25);

        const extrudeSettings = { depth: 0.1, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 0.05, bevelThickness: 0.05 };
        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geo.center();
        return geo;
    }

    async loadShaders() {
        const vert = await fetch('./src/shaders/plushy.vert').then(res => res.text());
        const frag = await fetch('./src/shaders/plushy.frag').then(res => res.text());
        return { vert, frag };
    }

    async revealMemoryFromHeart(heart) {
        if (heart.userData.revealing) return;
        heart.userData.revealing = true;

        // Heart "burst" or transform animation
        gsap.to(heart.scale, { x: 2, y: 2, z: 2, duration: 0.3, ease: "back.in" });
        gsap.to(heart.material, {
            opacity: 0, duration: 0.3, onComplete: () => {
                this.scene.remove(heart);
            }
        });

        // Spawn actual memory (Teddy Bear) at heart position
        const data = heart.userData.memoryData;
        const plushy = this.createTeddyBear(new THREE.Color(data.color), 0);
        plushy.position.copy(heart.position);
        plushy.userData = { id: data.id, isPlushy: true };

        this.scene.add(plushy);
        this.plushies.push(plushy);

        gsap.to(plushy.scale, { x: data.scale, y: data.scale, z: data.scale, duration: 1, ease: "elastic.out(1, 0.3)" });

        this.selectPlushy(plushy);
    }

    createHeartGalaxy() {
        const heartGeo = this.getHeartGeometry();
        const count = 400;

        for (let i = 0; i < count; i++) {
            const mat = new THREE.MeshPhysicalMaterial({
                color: 0xff0000,
                transmission: 0.9,
                thickness: 0.2,
                roughness: 0.1,
                metalness: 0.0,
                transparent: true,
                opacity: 0.4,
                emissive: 0xaa0000,
                emissiveIntensity: 0.1
            });

            const heart = new THREE.Mesh(heartGeo, mat);
            heart.position.set(
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 150 - 50
            );
            heart.rotation.set(Math.PI, Math.random() * Math.PI, 0);
            heart.scale.setScalar(Math.random() * 0.4 + 0.2);

            heart.userData = {
                isHeart: true,
                velocity: (Math.random() * 0.08) + 0.02, // Generally slower
                rotVelocity: (Math.random() - 0.5) * 0.05
            };

            this.scene.add(heart);
            this.hearts.push(heart);
        }
    }

    render() {
        const elapsedTime = this.clock.getElapsedTime();

        // Linear interpolation for scroll
        this.scrollProgress = THREE.MathUtils.lerp(this.scrollProgress, this.targetScroll, 0.05);
        if (!this.selectedPlushy) {
            this.camera.position.z = 10 - this.scrollProgress * 0.1;
            this.camera.position.x = Math.sin(this.scrollProgress * 0.01) * 2;
        }

        if (this.filmPass) this.filmPass.uniforms.uTime.value = elapsedTime;

        // Animate floating memories (already revealed)
        this.plushies.forEach((p, i) => {
            p.position.y += Math.sin(elapsedTime + i) * 0.01;
            p.rotation.z = Math.cos(elapsedTime * 0.5 + i) * 0.1;
            p.rotation.y += 0.005;
            p.traverse(child => {
                if (child.material && child.material.userData.shader) {
                    child.material.userData.shader.uniforms.uTime.value = elapsedTime;
                }
            });
        });

        // Animate floating hearts (Stream/Flow)
        if (this.hearts) {
            this.hearts.forEach(h => {
                const flicker = Math.sin(elapsedTime * 2 + h.position.x) * 0.1 + 0.9;
                if (h.material.emissiveIntensity) {
                    h.material.emissiveIntensity *= flicker;
                }
                h.position.z += h.userData.velocity;
                h.rotation.y += h.userData.rotVelocity || 0.01;

                // Noise-like floating
                h.position.y += Math.sin(elapsedTime + h.position.x) * 0.01;

                // Wrap around when hearts pass the camera (adjusted for scrollytelling)
                const limit = this.camera.position.z + 10;
                if (h.position.z > limit) {
                    h.position.z = limit - 150;
                    h.position.x = (Math.random() - 0.5) * 80;
                    h.position.y = (Math.random() - 0.5) * 80;
                }
            });
        }

        this.controls.update();

        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }

        requestAnimationFrame(() => this.render());
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.composer) {
            this.composer.setSize(window.innerWidth, window.innerHeight);
        }
    }
}

export default OniricEngine;
