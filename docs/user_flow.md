# User Flow: Le Rituel de Capture (Pseudo-code) ✨🏺

Ce document décrit la logique logicielle derrière la "Capture de Souvenir" dans l'univers 3D.

## 1. Interaction de Sélection (Raycasting)

```javascript
// Détection du clic dans l'espace 3D
window.addEventListener('click', (event) => {
    // 1. Calcul de la position de la souris normalisée
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // 2. Envoi d'un "rayon" depuis la caméra
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(plushies);

    if (intersects.length > 0) {
        const selectedMemory = intersects[0].object;
        focusOnMemory(selectedMemory);
    }
});
```

## 2. Transition vers l'État "Focus"

```javascript
function focusOnMemory(memory) {
    // A. Animation de la caméra vers l'objet
    gsap.to(camera.position, {
        x: memory.position.x + 2,
        y: memory.position.y + 1,
        z: memory.position.z + 5,
        duration: 2,
        ease: "expo.out"
    });

    // B. Affichage de l'interface Glassmorphism
    const uiPanel = document.getElementById('memory-panel');
    uiPanel.classList.add('visible');
    
    // C. Chargement des données via GraphQL
    fetchMetadata(memory.id).then(data => {
        渲染故事(data.story); // Render the short story
    });
}
```

## 3. Le Processus de Capture (Checkout)

```javascript
async function startCapture(memory) {
    // Phase 1: Animation Onirique
    // La peluche "aspire" les particules environnantes
    memory.material.uniforms.uPulseSpeed.value = 10.0;
    
    // Phase 2: Préparation de la commande
    const session = await api.createStripeSession({
        items: [{ id: memory.sku_id, options: currentOptions }],
        metadata: { memory_captured: memory.name }
    });

    // Phase 3: Transition Finale
    gsap.to(memory.scale, { x: 0, y: 0, z: 0, duration: 1 });
    window.location.href = session.url; // Redirection vers Stripe
}
```
